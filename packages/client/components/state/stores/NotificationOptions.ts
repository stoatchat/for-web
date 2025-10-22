import { Accessor, createSignal } from "solid-js";

import { Channel, Server } from "stoat.js";

import { State } from "..";

import { AbstractStore } from ".";

/**
 * Possible notification states
 */
export type NotificationState = "all" | "mention" | "none";

/**
 * Possible notification states
 */
const NotificationStates: NotificationState[] = ["all", "mention", "none"];

/**
 * Default notification states for various types of channels
 */
export const DEFAULT_STATES: {
  [key in Channel["type"]]: NotificationState;
} = {
  SavedMessages: "all",
  DirectMessage: "all",
  Group: "all",
  TextChannel: undefined!,
};

/**
 * Default state for servers
 */
export const DEFAULT_SERVER_STATE: NotificationState = "mention";

export interface MuteState {
  until?: number;
}

export interface TypeNotificationOptions {
  /**
   * Per-server settings
   */
  server: Record<string, NotificationState | undefined>;

  /**
   * Per-channel settings
   */
  channel: Record<string, NotificationState | undefined>;

  /**
   * Server mute settings
   */
  server_mutes: Record<string, MuteState | undefined>;

  /**
   * Channel mute settings
   */
  channel_mutes: Record<string, MuteState | undefined>;
}

/**
 * Manages the user's notification preferences.
 */
export class NotificationOptions extends AbstractStore<
  "notifications",
  TypeNotificationOptions
> {
  private activeNotifications: Record<string, Notification> = {};

  #now: Accessor<number>;

  /**
   * Construct new Experiments store.
   */
  constructor(state: State) {
    super(state, "notifications");

    // memory leak? -- maybe this should be a global util somewhere
    // todo: refactor
    const [now, setNow] = createSignal<number>(+new Date());
    this.#now = now;

    // update every minute
    setInterval(() => setNow(+new Date()), 6e3);
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    /** nothing needs to be done */
  }

  /**
   * Generate default values
   */
  default(): TypeNotificationOptions {
    return {
      server: {},
      channel: {},
      server_mutes: {},
      channel_mutes: {},
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeNotificationOptions>): TypeNotificationOptions {
    const server: TypeNotificationOptions["server"] = {};
    const channel: TypeNotificationOptions["channel"] = {};
    const server_mutes: TypeNotificationOptions["server_mutes"] = {};
    const channel_mutes: TypeNotificationOptions["channel_mutes"] = {};

    if (typeof input.server === "object") {
      for (const serverId of Object.keys(input.server)) {
        const entry = input.server[serverId];

        // migrate legacy muted channels to new dict.
        if ((entry as unknown) === "muted") {
          server_mutes[serverId] = {};
        }

        if (entry && NotificationStates.includes(entry)) {
          server[serverId] = entry;
        }
      }
    }

    if (typeof input.channel === "object") {
      for (const channelId of Object.keys(input.channel)) {
        const entry = input.channel[channelId];

        // migrate legacy muted channels to new dict.
        if ((entry as unknown) === "muted") {
          channel_mutes[channelId] = {};
        }

        if (entry && NotificationStates.includes(entry)) {
          channel[channelId] = entry;
        }
      }
    }

    const now = +new Date();

    if (typeof input.server_mutes === "object") {
      for (const serverId of Object.keys(input.server_mutes)) {
        const entry = input.server_mutes[serverId];
        if (
          entry &&
          (typeof entry.until === "undefined" ||
            (typeof entry.until === "number" && entry.until > now))
        ) {
          server_mutes[serverId] = { until: entry.until };
        }
      }
    }

    if (typeof input.channel_mutes === "object") {
      for (const channelId of Object.keys(input.channel_mutes)) {
        const entry = input.channel_mutes[channelId];
        if (
          entry &&
          (typeof entry.until === "undefined" ||
            (typeof entry.until === "number" && entry.until > now))
        ) {
          channel_mutes[channelId] = { until: entry.until };
        }
      }
    }

    return {
      server,
      channel,
      server_mutes,
      channel_mutes,
    };
  }

  /**
   * Compute the notification state for a given Server
   * @param server Server
   * @returns Notification state
   */
  computeForServer(server?: Server) {
    return server
      ? (this.get().server[server.id] ?? DEFAULT_SERVER_STATE)
      : undefined;
  }

  /**
   * Compute the actual notification state for a given Channel
   * @param channel Channel
   * @returns Notification state
   */
  computeForChannel(channel: Channel) {
    return (
      this.get().channel[channel.id] ??
      this.computeForServer(channel.server) ??
      DEFAULT_STATES[channel.type]
    );
  }

  /**
   * Set notification state for a server
   * @param server Server
   * @param state State
   */
  setServer(server: Server, state: NotificationState | undefined) {
    this.set("server", server.id, state);
  }

  /**
   * Set mute state for a server
   * @param server Server
   * @param state State
   */
  setServerMute(server: Server, state: MuteState | undefined) {
    this.set("server_mutes", server.id, state);
  }

  /**
   * Get muted state for a server
   * @param server Server
   * @returns Current state
   */
  getServerMute(server: Server) {
    return this.get().server_mutes[server.id];
  }

  /**
   * Set notification state for a channel
   * @param channel Channel
   * @param state State
   */
  setChannel(channel: Channel, state: NotificationState | undefined) {
    this.set("channel", channel.id, state);
  }

  /**
   * Set mute state for a channel
   * @param channel Channel
   * @param state State
   */
  setChannelMute(channel: Channel, state: MuteState | undefined) {
    this.set("channel_mutes", channel.id, state);
  }

  /**
   * Get notification state for a channel
   * @param channel Channel
   * @returns Current state
   */
  getChannel(channel: Channel) {
    return this.get().channel[channel.id];
  }

  /**
   * Get muted state for a channel
   * @param channel Channel
   * @returns Current state
   */
  getChannelMute(channel: Channel) {
    return this.get().channel_mutes[channel.id];
  }

  /**
   * Check whether a Channel or Server is muted (channel will inherit server)
   * @param target Channel or Server
   * @returns Whether this object is muted
   */
  isMuted(target?: Channel | Server): boolean {
    let value: MuteState | undefined;
    if (target instanceof Channel) {
      if (this.isMuted(target.server)) return true;
      value = this.get().channel_mutes[target.id];
    } else if (target instanceof Server) {
      value = this.get().server_mutes[target.id];
    }

    return !!value && (!value.until || value.until > this.#now());
  }

  /**
   * Check whether a Channel is muted (ignoring server)
   * @param channel Channel
   * @returns Whether this channel is muted
   */
  isChannelMuted(channel: Channel): boolean {
    const value = this.get().channel_mutes[channel.id];
    return !!value && (!value.until || value.until > this.#now());
  }
}
