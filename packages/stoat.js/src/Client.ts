import type { Accessor, Setter } from "solid-js";
import { batch, createSignal } from "solid-js";

import { AsyncEventEmitter } from "@vladfrangu/async_event_emitter";
import { API } from "stoat-api";
import type {
  DataLogin,
  RevoltConfig,
  Role,
  Error as StoatError,
} from "stoat-api";

import type { Channel } from "./classes/Channel.js";
import type { Emoji } from "./classes/Emoji.js";
import type { Message } from "./classes/Message.js";
import type { Server } from "./classes/Server.js";
import type { ServerMember } from "./classes/ServerMember.js";
import type { User, UserLimits } from "./classes/User.js";
import { AccountCollection } from "./collections/AccountCollection.js";
import { BotCollection } from "./collections/BotCollection.js";
import { ChannelCollection } from "./collections/ChannelCollection.js";
import { ChannelUnreadCollection } from "./collections/ChannelUnreadCollection.js";
import { ChannelWebhookCollection } from "./collections/ChannelWebhookCollection.js";
import { EmojiCollection } from "./collections/EmojiCollection.js";
import { MessageCollection } from "./collections/MessageCollection.js";
import { ServerCollection } from "./collections/ServerCollection.js";
import { ServerMemberCollection } from "./collections/ServerMemberCollection.js";
import { SessionCollection } from "./collections/SessionCollection.js";
import { UserCollection } from "./collections/UserCollection.js";
import {
  ConnectionState,
  EventClient,
  type EventClientOptions,
} from "./events/EventClient.js";
import { ProtocolV1, handleEvent } from "./events/v1.js";
import type { HydratedChannel } from "./hydration/channel.js";
import type { HydratedEmoji } from "./hydration/emoji.js";
import type { HydratedMessage } from "./hydration/message.js";
import type { HydratedServer } from "./hydration/server.js";
import type { HydratedServerMember } from "./hydration/serverMember.js";
import type { HydratedUser } from "./hydration/user.js";
import {
  RE_CHANNELS,
  RE_CUSTOM_EMOJI,
  RE_MENTIONS,
  RE_SPOILER,
} from "./lib/regex.js";

export type Session = { _id: string; token: string; user_id: string } | string;

/**
 * Events provided by the client
 */
export type Events = {
  error: [error: StoatError | Error | Event];

  connected: [];
  connecting: [];
  disconnected: [];
  ready: [];
  logout: [];

  policyChanges: [
    policyChanges: ProtocolV1["types"]["policyChange"][],
    acknowledge: () => Promise<void>,
  ];

  messageCreate: [message: Message];
  messageUpdate: [message: Message, previousMessage: HydratedMessage];
  messageDelete: [message: HydratedMessage];
  messageDeleteBulk: [messages: HydratedMessage[], channel?: Channel];
  messageReactionAdd: [message: Message, userId: string, emoji: string];
  messageReactionRemove: [message: Message, userId: string, emoji: string];
  messageReactionRemoveEmoji: [message: Message, emoji: string];

  channelCreate: [channel: Channel];
  channelUpdate: [channel: Channel, previousChannel: HydratedChannel];
  channelDelete: [channel: HydratedChannel];
  channelGroupJoin: [channel: Channel, user: User];
  channelGroupLeave: [channel: Channel, user?: User];
  channelStartTyping: [channel: Channel, user?: User];
  channelStopTyping: [channel: Channel, user?: User];
  channelAcknowledged: [channel: Channel, messageId: string];

  serverCreate: [server: Server];
  serverUpdate: [server: Server, previousServer: HydratedServer];
  serverDelete: [server: HydratedServer];
  serverLeave: [server: HydratedServer];
  serverRoleUpdate: [server: Server, roleId: string, previousRole: Role];
  serverRoleRanksUpdate: [server: Server, ranks: string[]];
  serverRoleDelete: [server: Server, roleId: string, role: Role];

  serverMemberUpdate: [
    member: ServerMember,
    previousMember: HydratedServerMember,
  ];
  serverMemberJoin: [member: ServerMember];
  serverMemberLeave: [member: HydratedServerMember];

  userUpdate: [user: User, previousUser: HydratedUser];
  // ^ userRelationshipChanged: [user: User, previousRelationship: RelationshipStatus];
  // ^ userPresenceChanged: [user: User, previousPresence: boolean];
  userSettingsUpdate: [id: string, update: Record<string, [number, string]>];
  entitlementsUpdate: [entitlements: ProtocolV1["types"]["entitlement"][]];

  emojiCreate: [emoji: Emoji];
  emojiDelete: [emoji: HydratedEmoji];

  userSlowmodes: [];
};

/**
 * Client options object
 */
export type ClientOptions = Partial<EventClientOptions> & {
  /**
   * Base URL of the API server
   */
  baseURL: string;

  /**
   * Whether to allow partial objects to emit from events
   * @default false
   */
  partials: boolean;

  /**
   * Whether to eagerly fetch users and members for incoming events
   * @default true
   * @deprecated
   */
  eagerFetching: boolean;

  /**
   * Whether to automatically sync unreads information
   * @default false
   */
  syncUnreads: boolean;

  /**
   * Whether to reconnect when disconnected
   * @default true
   */
  autoReconnect: boolean;

  /**
   * Whether to rewrite sent messages that include identifiers such as @silent
   * @default true
   */
  messageRewrites: boolean;

  /**
   * Retry delay function
   * @param retryCount Count
   * @returns Delay in seconds
   * @default (2^x-1) ±20%
   */
  retryDelayFunction(retryCount: number): number;

  /**
   * Check whether a channel is muted
   * @param channel Channel
   * @return Whether it is muted or through inheritance
   * @default false
   */
  channelIsMuted(channel: Channel): boolean;

  /**
   * Check whether a channel is exclusively muted (irrespective of server)
   * @param channel Channel
   * @return Whether it is exclusively muted
   * @default false
   */
  channelExclusiveMuted(channel: Channel): boolean;
};

/**
 * Stoat.js Clients
 */
export class Client extends AsyncEventEmitter<Events> {
  readonly account;
  readonly bots;
  readonly channels;
  readonly channelUnreads;
  readonly channelWebhooks;
  readonly emojis;
  readonly messages;
  readonly servers;
  readonly serverMembers;
  readonly sessions;
  readonly users;

  readonly api: API;
  readonly options: ClientOptions;
  readonly events: EventClient<1>;

  readonly configuration: RevoltConfig | undefined;
  #configLock?: Promise<void>;
  #session: Session | undefined;
  user: User | undefined;

  readonly ready: Accessor<boolean>;
  #ready: Accessor<boolean>;
  #setReady: Setter<boolean>;

  readonly configured: Accessor<boolean>;
  #setConfigured: Setter<boolean>;

  readonly connectionFailureCount: Accessor<number>;
  #setConnectionFailureCount: Setter<number>;

  /**
   * Entitlements the current user holds, as last sent by the server.
   * Note that passing an expiration date will NOT remove its data,
   * so you may need to keep track of expiration yourself.
   */
  readonly entitlements: Accessor<ProtocolV1["types"]["entitlement"][]>;
  #setEntitlements: Setter<ProtocolV1["types"]["entitlement"][]>;
  #reconnectTimeout: number | undefined;
  #disposed = false;

  /**
   * Server and roles to calculate permissions as, for previewing a role
   */
  readonly viewAs: Accessor<{ server: string; roles: string[] } | undefined>;
  #setViewAs: Setter<{ server: string; roles: string[] } | undefined>;

  /**
   * Create Stoat.js Client
   * @param configuration Deprecated - Please use `Client.initConfig` if you need to override config.
   */
  constructor(options?: Partial<ClientOptions>, configuration?: RevoltConfig) {
    super();

    this.options = {
      baseURL: "https://stoat.chat/api",
      partials: false,
      eagerFetching: true,
      syncUnreads: false,
      autoReconnect: true,
      messageRewrites: true,
      /**
       * Retry delay function
       * @param retryCount Count
       * @returns Delay in seconds
       */
      retryDelayFunction(retryCount) {
        return (Math.pow(2, retryCount) - 1) * (0.8 + Math.random() * 0.4);
      },
      /**
       * Check whether a channel is muted
       * @param channel Channel
       * @return Whether it is muted
       */
      channelIsMuted() {
        return false;
      },
      /**
       * Check whether a channel is exclusively muted (irrespective of server)
       * @param channel Channel
       * @return Whether it is exclusively muted
       * @default false
       */
      channelExclusiveMuted() {
        return false;
      },
      ...options,
    };

    this.configuration = configuration;

    this.api = new API({
      baseURL: this.options.baseURL,
    });

    this.#guardAPI();

    const [configured, setConfigured] = createSignal(
      configuration !== undefined,
    );
    this.configured = configured;
    this.#setConfigured = setConfigured;

    const [ready, setReady] = createSignal(false);
    this.#ready = ready;
    this.#setReady = setReady;
    this.ready = () => !this.#disposed && this.#ready();

    const [connectionFailureCount, setConnectionFailureCount] = createSignal(0);
    this.connectionFailureCount = connectionFailureCount;
    this.#setConnectionFailureCount = setConnectionFailureCount;

    const [viewAs, setViewAs] = createSignal<
      { server: string; roles: string[] } | undefined
    >();
    this.viewAs = viewAs;
    this.#setViewAs = setViewAs;

    const [entitlements, setEntitlements] = createSignal<
      ProtocolV1["types"]["entitlement"][]
    >([]);
    this.entitlements = entitlements;
    this.#setEntitlements = setEntitlements;

    this.account = new AccountCollection(this);
    this.bots = new BotCollection(this);
    this.channels = new ChannelCollection(this);
    this.channelUnreads = new ChannelUnreadCollection(this);
    this.channelWebhooks = new ChannelWebhookCollection(this);
    this.emojis = new EmojiCollection(this);
    this.messages = new MessageCollection(this);
    this.servers = new ServerCollection(this);
    this.serverMembers = new ServerMemberCollection(this);
    this.sessions = new SessionCollection(this);
    this.users = new UserCollection(this);

    this.events = new EventClient(1, "json", this.options);
    this.events.on("error", (error) =>
      this.listenerCount("error") > 0 ? this.emit("error", error) : undefined,
    );
    this.events.on("state", (state) => {
      switch (state) {
        case ConnectionState.Connected:
          batch(() => {
            this.servers.forEach((server) => server.resetSyncStatus());
            this.#setConnectionFailureCount(0);
            this.emit("connected");
          });
          break;
        case ConnectionState.Connecting:
          this.emit("connecting");
          break;
        case ConnectionState.Disconnected:
          this.emit("disconnected");
          if (this.options.autoReconnect) {
            this.#reconnectTimeout = setTimeout(
              () => this.connect(),
              this.options.retryDelayFunction(this.connectionFailureCount()) *
                1e3,
            ) as never;

            this.#setConnectionFailureCount((count) => count + 1);
          }
          break;
      }
    });

    this.events.on("event", (event) =>
      handleEvent(this, event, this.#setReady),
    );
  }

  /**
   * Current session id
   */
  get sessionId(): string | undefined {
    return typeof this.#session === "string" ? undefined : this.#session?._id;
  }

  /**
   * Get authentication header
   */
  get authenticationHeader(): [string, string] {
    return typeof this.#session === "string"
      ? ["X-Bot-Token", this.#session]
      : ["X-Session-Token", this.#session?.token as string];
  }

  /**
   * Calculate permissions in a server as if we only had the given roles
   */
  setViewAs(server?: string, roles: string[] = []): void {
    this.#setViewAs(server ? { server, roles } : undefined);
  }

  /**
   * Whether a request would make changes in the server we are previewing
   */
  #blockedWhilePreviewing(
    method: string,
    path: string,
    data?: unknown,
  ): boolean {
    const server = this.viewAs()?.server;
    if (!server || /\/(ack|search)(\/|$)/.test(path)) return false;

    const [, type, id, sub] = path.split("/");
    if (type === "servers") return id === server;
    if (type === "channels") {
      if (id === "create") return false;
      const channel = this.channels.get(id);
      return channel ? channel.serverId === server : true;
    }
    if (type === "custom" && id === "emoji") {
      if (method === "put") {
        return (data as { parent?: { id?: string } })?.parent?.id === server;
      }
      const emoji = this.emojis.get(sub);
      return emoji
        ? emoji.parent.type === "Server" && emoji.parent.id === server
        : true;
    }
    if (type === "webhooks") {
      const webhook = this.channelWebhooks.get(id);
      return webhook
        ? webhook.channel
          ? webhook.channel.serverId === server
          : true
        : true;
    }
    if (type === "bots" && sub === "invite") {
      return (data as { server?: string })?.server === server;
    }
    if (type === "invites") return method === "delete";

    return false;
  }

  /**
   * Connect to Revolt
   */
  connect(): void {
    if (this.#disposed) return;
    clearTimeout(this.#reconnectTimeout);
    this.#setReady(false);
    this.events.connect(
      this.configuration?.ws ?? "wss://stoat.chat/events",
      typeof this.#session === "string" ? this.#session : this.#session!.token,
    );
  }

  /**
   * Fetches the server config. This is called automatically by `login()` or `loginBot()`,
   * but you can call it first manually if you need to override any config options.
   *
   * Override example:
   * ```ts
   * await client.initConfig((config) => {
   *   config.ws = "wss://example.com";
   * });
   * ```
   */
  async initConfig(preConfig?: (config: RevoltConfig) => void): Promise<void> {
    if (!this.#configLock && !this.configuration) {
      //Create promise lock to avoid race condition
      this.#configLock = (async () => {
        //@ts-expect-error readonly override
        this.configuration = await this.api.get("/");
        preConfig?.(this.configuration);
        this.#setConfigured(true);
        this.#configLock = undefined;
      })();
    }
    return this.#configLock;
  }

  /**
   * Update API object to use authentication.
   */
  #updateHeaders(): void {
    (this.api as API) = new API({
      baseURL: this.options.baseURL,
      authentication: {
        revolt: this.#session,
      },
    });

    this.#guardAPI();
  }

  /**
   * Block changes to a server while previewing it as a role
   */
  #guardAPI(): void {
    const req = this.api.req.bind(this.api);
    this.api.req = ((method: string, path: string, ...args: unknown[]) =>
      method !== "get" && this.#blockedWhilePreviewing(method, path, args[0])
        ? Promise.reject({ type: "ViewingAsRole" })
        : (req as (...args: unknown[]) => Promise<unknown>)(
            method,
            path,
            ...args,
          )) as typeof this.api.req;
  }

  /**
   * Log in with auth data, creating a new session in the process.
   * @param details Login data object
   * @returns An on-boarding function if on-boarding is required, undefined otherwise
   */
  async login(details: DataLogin): Promise<void> {
    await this.initConfig();
    const data = await this.api.post("/auth/session/login", details);
    if (data.result === "Success") {
      this.#session = data;
      // TODO: return await this.connect();
    } else {
      throw "MFA not implemented!";
    }
  }

  /**
   * Use an existing session
   */
  useExistingSession(session: Session): void {
    this.#session = session;
    this.#updateHeaders();
  }

  /**
   * Log in as a bot
   * @param token Bot token
   */
  async loginBot(token: string): Promise<void> {
    await this.initConfig();
    this.#session = token;
    this.#updateHeaders();
    this.connect();
  }

  /**
   * Log out of current session
   *
   * This function fully disposes the client by removing all event listeners
   * and killing the events socket. It is disposed regardless of whether the
   * logout request is successful or not.
   */
  async logout(): Promise<void> {
    if (this.#disposed) return;
    try {
      await this.api.post("/auth/session/logout");
    } catch {
      // Ignore errors, low risk/priority.
    } finally {
      this.dispose();
    }
  }

  /**
   * Whether this client has been disposed
   */
  get disposed(): boolean {
    return this.#disposed;
  }

  /**
   * Dispose of this client
   *
   * Stops any pending reconnects and timers, removes all event listeners and kills the events socket,
   * so that the client can be garbage collected. The client must not be used after calling this.
   * Calling this more than once is a no-op.
   */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;

    clearTimeout(this.#reconnectTimeout);
    this.#reconnectTimeout = undefined;

    // Remove listeners before closing the socket so nobody observes the disconnect
    this.events.removeAllListeners();
    this.removeAllListeners();
    this.events.disconnect();

    batch(() => {
      this.#setReady(false);
      this.#setEntitlements([]);
      this.#setViewAs(undefined);
    });

    this.user = undefined;
    this.#session = undefined;
    this.#updateHeaders();

    const collections = [
      this.bots,
      this.channels,
      this.channelUnreads,
      this.channelWebhooks,
      this.emojis,
      this.messages,
      this.servers,
      this.serverMembers,
      this.sessions,
      this.users,
    ];

    for (const collection of collections) collection._close();

    // Release cached data. If something outside our control (e.g. a detached
    // DOM node held by the browser) still references this client, it then
    // pins an empty shell rather than the whole account's state.
    // Deferred so UI still being torn down doesn't observe empty collections.
    setTimeout(() =>
      batch(() => {
        for (const collection of collections) collection._clear();
      }),
    );
  }

  /**
   * Replace the current user's entitlements, from the events socket
   * @internal
   */
  setEntitlements(entitlements: ProtocolV1["types"]["entitlement"][]): void {
    this.#setEntitlements(entitlements);
  }

  /**
   * Prepare a markdown-based message to be displayed to the user as plain text.
   * @param source Source markdown text
   * @returns Modified plain text
   */
  markdownToText(source: string): string {
    return source
      .replace(RE_MENTIONS, (sub: string, id: string) => {
        const user = this.users.get(id as string);

        if (user) {
          return `@${user.username}`;
        }

        return sub;
      })
      .replace(RE_CHANNELS, (sub: string, id: string) => {
        const channel = this.channels.get(id as string);

        if (channel) {
          return `#${channel.displayName}`;
        }

        return sub;
      })
      .replace(RE_CUSTOM_EMOJI, (sub: string, id: string) => {
        const emoji = this.emojis.get(id as string);

        if (emoji) {
          return `:${emoji.name}:`;
        }

        return sub;
      })
      .replace(RE_SPOILER, "<spoiler>");
  }

  /**
   * Prepare a markdown-based message to be displayed to the user as plain text. This method will fetch each user or channel if they are missing. Useful for serviceworkers.
   * @param source Source markdown text
   * @returns Modified plain text
   */
  async markdownToTextFetch(source: string): Promise<string> {
    // Get all user matches, create a map to dedupe
    const userMatches = Object.fromEntries(
      Array.from(source.matchAll(RE_MENTIONS), (match) => {
        return [match[0], match[1]];
      }),
    );

    // Get all channel matches, create a map to dedupe
    const channelMatches = Object.fromEntries(
      Array.from(source.matchAll(RE_CHANNELS), (match) => {
        return [match[0], match[1]];
      }),
    );

    // Get all custom emoji matches, create a map to dedupe
    const customEmojiMatches = Object.fromEntries(
      Array.from(source.matchAll(RE_CUSTOM_EMOJI), (match) => {
        return [match[0], match[1]];
      }),
    );

    // Send requests to replace user ids
    const userReplacementPromises = Object.keys(userMatches).map(
      async (key) => {
        const substr = userMatches[key];
        if (substr) {
          try {
            const user = await this.users.fetch(substr);
            if (user) {
              return [key, `@${user.username}`];
            }
          } catch {
            // If the fetch fails, just show the match as a default
            return [key, key];
          }
        }

        return [key, key];
      },
    );

    // Send requests to replace channel ids
    const channelReplacementPromises = Object.keys(channelMatches).map(
      async (key) => {
        const substr = channelMatches[key];
        if (substr) {
          try {
            const channel = await this.channels.fetch(substr);
            if (channel) {
              return [key, `#${channel.displayName}`];
            }
          } catch {
            // If the fetch fails, just show the match as a default
            return [key, key];
          }
        }

        return [key, key];
      },
    );

    // Send requests to replace custom emojis
    const customEmojiReplacementPromises = Object.keys(customEmojiMatches).map(
      async (key) => {
        const substr = customEmojiMatches[key];
        if (substr) {
          try {
            const emoji = await this.emojis.fetch(substr);
            if (emoji) {
              return [key, `:${emoji.name}:`];
            }
          } catch {
            // If the fetch fails, just show the match as a default
            return [key, key];
          }
        }

        return [key, key];
      },
    );

    // Await for all promises to get the strings to replace with.
    const replacements = await Promise.all([
      ...userReplacementPromises,
      ...channelReplacementPromises,
      ...customEmojiReplacementPromises,
    ]);

    const replacementsMap = Object.fromEntries(replacements);

    return source
      .replace(RE_MENTIONS, (match) => replacementsMap[match])
      .replace(RE_CHANNELS, (match) => replacementsMap[match])
      .replace(RE_CUSTOM_EMOJI, (match) => replacementsMap[match])
      .replace(RE_SPOILER, "<spoiler>");
  }

  /**
   * Proxy a file through January.
   * @param url URL to proxy
   * @returns Proxied media URL
   */
  proxyFile(url: string): string | undefined {
    if (this.configuration?.features.january.enabled) {
      return `${this.configuration.features.january.url}/proxy?url=${encodeURIComponent(
        url,
      )}`;
    } else {
      return url;
    }
  }

  /**
   * Upload a file
   * @param tag Tag
   * @param file File
   * @param uploadUrl Media server upload route
   */
  async uploadFile(
    tag: string,
    file: File,
    uploadUrl?: string,
  ): Promise<string> {
    const body = new FormData();
    body.append("file", file);

    const [key, value] = this.authenticationHeader;
    const data: { id: string } = await fetch(
      `${uploadUrl ?? this.configuration?.features.autumn.url}/${tag}`,
      {
        method: "POST",
        body,
        headers: {
          [key]: value,
        },
      },
    ).then((res) => res.json());

    return data.id;
  }

  /**
   * Backend enforced limits for the logged in user
   */
  get limits(): UserLimits | undefined {
    if (this.configured() && this.user) return this.user.limits;
  }
}
