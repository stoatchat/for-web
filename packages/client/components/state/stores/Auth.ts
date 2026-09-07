import { CONFIGURATION } from "@revolt/common";
import { User } from "stoat.js";

import { AbstractStore } from ".";
import { State } from "..";

export type Session = {
  _id: string;
  token: string;
  userId: string;
  host?: string;
  cachedName?: string;
  cachedAvatar?: string;
  valid: boolean;
};

export type TypeAuth = {
  /**
   * Session information
   */
  session?: Session;
  saved: Array<Session>;
};

type AuthErrType = "save_fail" | "dup_login" | "ses_not_found";

export class AuthError extends Error {
  type: "AuthError";
  name: AuthErrType;

  constructor(name: AuthErrType) {
    super();
    this.type = "AuthError";
    this.name = name;
  }
}

function strOrNone(str?: string) {
  if (typeof str === "string" && str) return str;
  return undefined;
}

function cleanSes(inSes?: Session): Session | undefined {
  if (
    typeof inSes === "object" &&
    typeof inSes._id === "string" &&
    typeof inSes.token === "string" &&
    typeof inSes.userId === "string" &&
    inSes.valid
  ) {
    return {
      _id: inSes._id,
      token: inSes.token,
      userId: inSes.userId,
      host: strOrNone(inSes.host),
      cachedName: strOrNone(inSes.cachedName),
      cachedAvatar: strOrNone(inSes.cachedAvatar),
      valid: true,
    };
  }
}

/**
 * Authentication details store
 */
export class Auth extends AbstractStore<"auth", TypeAuth> {
  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "auth", true);
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    if (CONFIGURATION.DEVELOPMENT_TOKEN && CONFIGURATION.DEVELOPMENT_USER_ID) {
      this.addSession({
        _id: CONFIGURATION.DEVELOPMENT_SESSION_ID ?? "0",
        token: CONFIGURATION.DEVELOPMENT_TOKEN,
        userId: CONFIGURATION.DEVELOPMENT_USER_ID,
        valid: true,
      });
    }
  }

  /**
   * Generate default values
   */
  default(): TypeAuth {
    return {
      session: undefined,
      saved: [],
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeAuth>): TypeAuth {
    const saved = [];
    let ses;
    if (Array.isArray(input.saved))
      for (ses of input.saved) {
        ses = cleanSes(ses);
        if (ses) saved.push(ses);
      }

    return {
      session: cleanSes(input.session),
      saved,
    };
  }

  #read(): TypeAuth {
    const data = this.get();
    return {
      session: data.session,
      saved: [...data.saved],
    };
  }

  /**
   * Get current session
   * @param unhold Try to resume held session
   * @returns Session
   */
  getSession(unhold = false) {
    const data = unhold ? this.#read() : this.get();
    if (unhold && !data.session) {
      data.session = data.saved.shift();
      this.set(data);
    }
    return data.session;
  }

  /**
   * Get saved sessions
   */
  getSaved() {
    return this.get().saved;
  }

  /**
   * Get all sessions, including current and saved
   */
  getSessions() {
    const data = this.get();
    return [...(data.session ? [data.session] : []), ...data.saved];
  }

  /**
   * True if there are multiple saved sessions
   */
  hasMultiSession() {
    return this.get().saved.length > 0;
  }

  /**
   * Add a new session to the auth manager
   * @param session Session
   */
  addSession(newSes: Session) {
    const data = this.#read();
    if (data.session) throw new AuthError("save_fail");

    data.session = newSes;
    for (const ses of data.saved)
      if (ses.userId === newSes.userId) throw new AuthError("dup_login");
    this.set(data);
  }

  /**
   * Remove existing session
   * @param unhold Try to resume held session
   */
  removeSession(unhold = false) {
    const data = this.#read();
    data.session = unhold ? data.saved.shift() : undefined;
    this.set(data);
  }

  /**
   * Place current session on hold
   */
  holdSession() {
    const data = this.#read();
    if (!data.session) return;
    data.saved.unshift(data.session);
    data.session = undefined;
    this.set(data);
  }

  /**
   * Switch to a saved session
   */
  swapSession(userId: string) {
    const data = this.#read(),
      saved = data.saved;
    for (let i = 0, l = saved.length; i < l; ++i)
      if (saved[i].userId === userId) {
        const old = data.session;
        data.session = saved[i];
        saved.splice(i, 1);
        if (old) saved.unshift(old);
        return this.set(data);
      }
    throw new AuthError("ses_not_found");
  }

  /**
   * Cache username and avatar for account switcher
   */
  cacheUserInfo(user: User) {
    const data = JSON.parse(JSON.stringify(this.get()));
    for (const s of [data.session, ...data.saved])
      if (s && s.userId === user.id) {
        s.cachedName = `${user.displayName} (@${user.username}#${user.discriminator})`;
        s.cachedAvatar = user.avatarURL;
        return this.set(data);
      }
  }

  /**
   * Mark current session as valid
   */
  markValid() {
    const ses = this.get().session;
    if (ses && !ses.valid) this.set("session", "valid", true);
  }
}
