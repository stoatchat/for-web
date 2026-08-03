import { detect } from "detect-browser";
import { Accessor, Setter, createMemo, createSignal } from "solid-js";

import { API, Client, ConnectionState, ProtocolV1 } from "stoat.js";

import { DefaultHost } from "@revolt/instance";
import { ModalControllerExtended } from "@revolt/modal";
import type { State as ApplicationState } from "@revolt/state";
import type { Session } from "@revolt/state/stores/Auth";
import { useSnackbar } from "@revolt/ui";
import { useNavigate } from "@solidjs/router";

import Instance from "../instance/Instance";
import { killServiceWorkerSubscription } from "./NotificationsController";

export enum State {
  Ready = "Ready",
  LoggingIn = "Logging In",
  Onboarding = "Onboarding",
  Error = "Error",
  Dispose = "Dispose",
  Connecting = "Connecting",
  Connected = "Connected",
  Disconnected = "Disconnected",
  Reconnecting = "Reconnecting",
  Offline = "Offline",
}

export enum TransitionType {
  LoginUncached = "uncached login",
  LoginCached = "cached login",
  SocketConnected = "socket connected",
  DeviceOffline = "device offline",
  DeviceOnline = "device online",
  PermanentFailure = "permanent failure",
  TemporaryFailure = "temporary failure",
  UserCreated = "user created",
  NoUser = "no user",
  Cancel = "cancel",
  Dispose = "dispose",
  DisposeOnly = "dispose only",
  Dismiss = "dismiss",
  Ready = "ready",
  Retry = "retry",
  Logout = "logout",
}

export type Transition =
  | {
      type: TransitionType.LoginUncached | TransitionType.LoginCached;
      session: Session;
    }
  | {
      type: TransitionType.PermanentFailure;
      error: unknown;
    }
  | {
      type:
        | TransitionType.NoUser
        | TransitionType.UserCreated
        | TransitionType.TemporaryFailure
        | TransitionType.SocketConnected
        | TransitionType.DeviceOffline
        | TransitionType.DeviceOnline
        | TransitionType.Cancel
        | TransitionType.Dismiss
        | TransitionType.Ready
        | TransitionType.Retry
        | TransitionType.Dispose
        | TransitionType.DisposeOnly
        | TransitionType.Logout;
    };

type PolicyAttentionRequired = [
  ProtocolV1["types"]["policyChange"][],
  () => Promise<void>,
];

class Lifecycle {
  #controller: ClientController;

  readonly state: Accessor<State>;
  #setStateSetter: Setter<State>;

  readonly loadedOnce: Accessor<boolean>;
  #setLoadedOnce: Setter<boolean>;

  readonly policyAttentionRequired: Accessor<
    undefined | PolicyAttentionRequired
  >;
  #policyAttentionRequired: Setter<undefined | PolicyAttentionRequired>;

  private client: Client;

  #connectionFailures = 0;
  #permanentError: unknown | undefined;
  #retryTimeout: number | undefined;
  #nav;

  constructor(controller: ClientController) {
    this.#controller = controller;
    this.#nav = useNavigate();

    this.onState = this.onState.bind(this);
    this.onReady = this.onReady.bind(this);
    this.onPolicyChanges = this.onPolicyChanges.bind(this);

    const [state, setState] = createSignal(State.Ready);
    this.state = state;
    this.#setStateSetter = setState;

    const [loadedOnce, setLoadedOnce] = createSignal(false);
    this.loadedOnce = loadedOnce;
    this.#setLoadedOnce = setLoadedOnce;

    const [policyAttentionRequired, setPolicyAttentionRequired] = createSignal<
      undefined | PolicyAttentionRequired
    >(undefined);

    this.policyAttentionRequired = policyAttentionRequired;
    this.#policyAttentionRequired = setPolicyAttentionRequired;

    this.client = null!;
    this.dispose();
  }

  private dispose() {
    this.client = this.#controller.instance.newClient();

    this.client.options.channelIsMuted = (ch) =>
      this.#controller.state.notifications.isMuted(ch);

    this.client.options.channelExclusiveMuted = (ch) =>
      this.#controller.state.notifications.isChannelMuted(ch);

    this.client.events.on("state", this.onState);
    this.client.on("ready", this.onReady);
    this.client.on("policyChanges", this.onPolicyChanges);
  }

  #enter(nextState: State) {
    if (import.meta.env.DEV) {
      console.info("[lifecycle] entering state", nextState);
    }

    this.#setStateSetter(nextState);

    // Clean up retry timer
    if (this.#retryTimeout) {
      clearTimeout(this.#retryTimeout);
      this.#retryTimeout = undefined;
    }

    switch (nextState) {
      case State.LoggingIn:
        this.#controller.initUserState();
        this.client.api
          .get("/onboard/hello")
          .then(({ onboarding }) => {
            if (onboarding) this.transition({ type: TransitionType.NoUser });
            else this.client.connect();
          })
          .catch((e) => this.showError(e));
        break;
      case State.Connecting:
        this.#controller.initUserState();
      // eslint-disable-next-line no-fallthrough
      case State.Reconnecting:
        this.client.connect();
        break;
      case State.Connected:
        this.#controller.state.auth.markValid();
        this.#setLoadedOnce(true);
        this.#connectionFailures = 0;
        break;
      case State.Dispose:
        this.dispose();
        if (this.#controller.state.auth.getSession()) {
          this.#controller.loginCached();
        } else {
          this.transition({ type: TransitionType.Ready });
          this.#setLoadedOnce(false);
        }
        break;
      case State.Disconnected:
        this.#connectionFailures++;

        if (!navigator.onLine) {
          this.transition({
            type: TransitionType.DeviceOffline,
          });
        } else {
          const retryIn =
            (Math.pow(2, this.#connectionFailures) - 1) *
            (0.8 + Math.random() * 0.4);

          console.info(
            "Will try to reconnect in",
            retryIn.toFixed(2),
            "seconds!",
          );

          this.#retryTimeout = setTimeout(() => {
            this.#retryTimeout = undefined;
            this.transition({
              type: TransitionType.Retry,
            });
          }, retryIn * 1e3) as never;
        }
        break;
      case State.Error:
        this.#nav("/login");
    }
  }

  private logout() {
    this.client.logout();
    this.#enter(State.Dispose);
  }

  transition(transition: Transition) {
    console.debug("Received transition", transition.type);

    switch (transition.type) {
      case TransitionType.DisposeOnly:
        this.dispose();
        return;
      case TransitionType.Dispose:
        this.#enter(State.Dispose);
        return;
      case TransitionType.Logout:
        this.logout();
        return;
      case TransitionType.PermanentFailure:
        this.#permanentError = transition.error;
        this.#enter(State.Error);
        return;
    }

    const currentState = this.state();
    switch (currentState) {
      case State.Dispose:
        if (transition.type === TransitionType.Ready) {
          this.#enter(State.Ready);
        }
      // eslint-disable-next-line no-fallthrough
      case State.Ready:
        switch (transition.type) {
          case TransitionType.LoginUncached:
            this.client.useExistingSession({
              ...transition.session,
              user_id: transition.session.userId,
            });

            this.#enter(State.LoggingIn);
            break;
          case TransitionType.LoginCached:
            this.client.useExistingSession({
              ...transition.session,
              user_id: transition.session.userId,
            });

            this.#enter(State.Connecting);
        }
        break;
      case State.LoggingIn:
        switch (transition.type) {
          case TransitionType.SocketConnected:
            this.#enter(State.Connected);
            break;
          case TransitionType.NoUser:
            this.#enter(State.Onboarding);
            break;
        }
        break;
      case State.Onboarding:
        if (transition.type === TransitionType.UserCreated) {
          this.#enter(State.Connecting);
        } else if (transition.type === TransitionType.Cancel) {
          this.logout();
        }
        break;
      case State.Error:
        if (transition.type === TransitionType.Dismiss) {
          if (
            (this.permanentError as { type: string })?.type === "InvalidSession"
          )
            this.#controller.state.auth.removeSession(true);
          this.logout();
        }
        break;
      case State.Connecting:
        switch (transition.type) {
          case TransitionType.SocketConnected:
            this.#enter(State.Connected);
            break;
          case TransitionType.TemporaryFailure:
            this.#enter(State.Disconnected);
            break;
        }
        break;
      case State.Connected:
        switch (transition.type) {
          case TransitionType.TemporaryFailure:
            this.#enter(State.Disconnected);
            break;
        }
        break;
      case State.Disconnected:
        switch (transition.type) {
          case TransitionType.DeviceOffline:
            this.#enter(State.Offline);
            break;
          case TransitionType.Retry:
            this.#enter(State.Reconnecting);
            break;
        }
        break;
      case State.Reconnecting:
        switch (transition.type) {
          case TransitionType.SocketConnected:
            this.#enter(State.Connected);
            break;
          case TransitionType.TemporaryFailure:
            this.#enter(State.Disconnected);
            break;
        }
        break;
      case State.Offline:
        switch (transition.type) {
          case TransitionType.DeviceOnline:
            this.#enter(State.Reconnecting);
            break;
          case TransitionType.Retry:
            this.#enter(State.Reconnecting);
            break;
        }
        break;
    }

    if (currentState === this.state()) {
      console.error(
        "An unhandled transition occurred!",
        transition,
        "was received on",
        currentState,
      );
    }
  }

  private onReady() {
    this.transition({
      type: TransitionType.SocketConnected,
    });
  }

  private onPolicyChanges(
    changes: ProtocolV1["types"]["policyChange"][],
    ack: () => Promise<void>,
  ) {
    this.#policyAttentionRequired([
      changes,
      () => ack().then(() => this.#policyAttentionRequired(undefined)),
    ]);
  }

  private onState(state: ConnectionState) {
    if (state === ConnectionState.Disconnected) {
      if (this.client.events.lastError) {
        const revolt = this.client.events.lastError.type === "revolt";
        if (revolt || !this.loadedOnce())
          return this.showError(
            revolt
              ? this.client.events.lastError.data
              : { type: "SocketError" },
          );
      }
      this.transition({ type: TransitionType.TemporaryFailure });
    }
  }

  /**
   * Get the permanent error
   */
  get permanentError() {
    return this.#permanentError;
  }

  /** Redirect to client error page */
  showError(e: unknown) {
    this.transition({
      type: TransitionType.PermanentFailure,
      error: e,
    });
  }
}

/**
 * Controls lifecycle of clients
 */
export default class ClientController {
  /**
   * API Client
   */
  readonly api: API.API;

  /**
   * Lifecycle
   */
  readonly lifecycle: Lifecycle;

  /**
   * Reference to application state
   */
  readonly state: ApplicationState;

  isLoggedIn: Accessor<boolean>;
  #swapping = false;
  #setReady: Setter<boolean>;

  /** Stoat instance the client belongs to. Also accessible via `useInstance()` */
  readonly instance: Instance;

  /**
   * Construct new client controller
   */
  constructor(
    state: ApplicationState,
    instance: Instance,
    setReady: Setter<boolean>,
  ) {
    this.state = state;
    this.instance = instance;
    this.#setReady = setReady;
    this.api = new API.API({
      baseURL: instance.apiUrl,
    });

    this.lifecycle = new Lifecycle(this);

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.stow = this.stow.bind(this);
    this.swapAccount = this.swapAccount.bind(this);
    this.selectUsername = this.selectUsername.bind(this);
    this.isError = this.isError.bind(this);
    this.isSwapping = this.isSwapping.bind(this);

    //A memo to prevent isLoggedIn from bouncing when reconnecting
    this.isLoggedIn = createMemo(() =>
      [
        State.Connecting,
        State.Connected,
        State.Disconnected,
        State.Offline,
        State.Reconnecting,
      ].includes(this.lifecycle.state()),
    );

    //User switch request
    if (location.hash.startsWith("#uid=")) {
      try {
        this.state.auth.swapSession(location.hash.slice(5));
        location.hash = "";
      } catch (e) {
        useSnackbar().show({
          message: `${e}`,
          placement: "bottom",
          closeable: true,
          autoCloseDelay: 30000,
        });
      }
      this.state.auth.holdSession();
    }

    this.loginCached(false, true);
  }

  isError() {
    return this.lifecycle.state() === State.Error;
  }

  loginCached(unhold = false, cached = unhold) {
    const session = this.state.auth.getSession(unhold);
    if (!session) return this.initUserState();
    if (this.#checkSwapInstance(true, unhold)) return; //About to switch- Don't initialize app
    this.lifecycle.transition({
      type: cached ? TransitionType.LoginCached : TransitionType.LoginUncached,
      session,
    });
  }

  initUserState() {
    this.state.hydrate().then(() => this.#setReady(true));
  }

  /**
   * Login given a set of credentials
   * @param credentials Credentials
   */
  async login(credentials: API.DataLogin, modals: ModalControllerExtended) {
    const browser = detect();

    // Generate a friendly name for this browser
    let friendly_name;
    if (browser) {
      let { name, os } = browser as { name: string; os: string };
      if (name === "ios") {
        name = "safari";
      } else if (name === "fxios") {
        name = "firefox";
      } else if (name === "crios") {
        name = "chrome";
      } else if (os === "Mac OS" && navigator.maxTouchPoints > 0) {
        os = "iPadOS";
      }

      friendly_name = `Stoat for Web (${name} on ${os})`;
    } else {
      friendly_name = "Stoat for Web (Unknown Device)";
    }

    // Try to login with given credentials
    let session = await this.api.post("/auth/session/login", {
      ...credentials,
      friendly_name,
    });

    // Prompt for MFA verification if necessary
    if (session.result === "MFA") {
      const { allowed_methods } = session;
      while (session.result === "MFA") {
        const mfa_response: API.MFAResponse | undefined = await new Promise(
          (callback) =>
            modals.openModal({
              type: "mfa_flow",
              state: "unknown",
              available_methods: allowed_methods,
              callback,
            }),
        );

        if (typeof mfa_response === "undefined") {
          break;
        }

        try {
          session = await this.api.post("/auth/session/login", {
            mfa_response,
            mfa_ticket: session.ticket,
            friendly_name,
          });
        } catch (err) {
          console.error("Failed login:", err);
        }
      }

      if (session.result === "MFA") throw "Cancelled";
    }

    if (session.result === "Disabled") {
      return this.lifecycle.showError("This account is disabled.");
    }

    const createdSession = {
      _id: session._id,
      token: session.token,
      userId: session.user_id,
      host: this.instance.host,
      valid: false,
    };

    try {
      this.state.auth.addSession(createdSession);
      this.lifecycle.transition({
        type: TransitionType.LoginUncached,
        session: createdSession,
      });
      return true;
    } catch (e) {
      modals.openModal({ type: "error2", error: e });
    }
  }

  async selectUsername(username: string) {
    await this.instance.client.api.post("/onboard/complete", {
      username,
    });

    this.lifecycle.transition({
      type: TransitionType.UserCreated,
    });
  }

  #cacheUserInfo() {
    const user = this.instance.client.user;
    if (user) this.state.auth.cacheUserInfo(user);
  }

  /** Check if instance matches auth, and switch if it doesn't */
  #checkSwapInstance(swapUser: boolean, unhold = true) {
    const host = this.instance.host || DefaultHost,
      ses = this.state.auth.getSession();
    if (ses && (ses.host || DefaultHost) !== host) {
      //First try to find an account that fits this instance
      if (swapUser) {
        for (const s of this.state.auth.getSaved())
          if ((s.host || DefaultHost) === host) {
            this.#swapSession(s.userId);
            this.lifecycle.transition({
              type: TransitionType.LoginCached,
              session: this.state.auth.getSession()!,
            });
            return true;
          }
      }
      //None found? No prob
      if (unhold) {
        //Swap to old instance & login
        setTimeout(() => this.instance.switchTo(ses.host || DefaultHost), 1);
      } else {
        //Login to new instance
        //TODO Still time here to cache intended link dest via location.pathname
        //before it changes & attempt to jump after login
        this.stow(false);
        this.initUserState();
      }
      return true;
    }
  }

  /** True if the user session is about to be swapped */
  isSwapping() {
    return this.#swapping;
  }

  #swapSession(userId: string) {
    try {
      this.#cacheUserInfo();
      this.#swapping = true;
      this.state.auth.swapSession(userId);
    } catch (e) {
      this.#swapping = false;
      throw e;
    }
  }

  swapAccount(userId: string) {
    this.#swapSession(userId);
    if (this.#checkSwapInstance(false)) return;
    this.lifecycle.transition({
      type: TransitionType.Dispose,
    });
  }

  /** Stow current session and display the login screen */
  stow(dispose = true) {
    this.#cacheUserInfo();
    this.state.auth.holdSession();
    if (dispose)
      this.lifecycle.transition({
        type: TransitionType.Dispose,
      });
  }

  logout() {
    this.state.settings.resetNotificationsState();
    killServiceWorkerSubscription(this.instance.client, true);
    this.state.auth.removeSession();
    this.lifecycle.transition({
      type: TransitionType.Logout,
    });
  }

  dispose() {
    this.#cacheUserInfo();
    this.lifecycle.transition({
      type: TransitionType.DisposeOnly,
    });
  }
}
