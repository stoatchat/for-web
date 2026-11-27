import type { Accessor, Setter } from "solid-js";
import { createSignal } from "solid-js";

import { AsyncEventEmitter } from "@vladfrangu/async_event_emitter";
import { JSONParse, JSONStringify } from "json-with-bigint";
import type { Error as StoatError } from "stoat-api";

import type { ProtocolV1 } from "./v1.js";

/**
 * Available protocols to connect with
 */
export type AvailableProtocols = 1;

/**
 * Protocol mapping
 */
type Protocols = {
  1: ProtocolV1;
};

/**
 * Select a protocol by its key
 */
export type EventProtocol<T extends AvailableProtocols> = Protocols[T];

/**
 * All possible event client states.
 */
export enum ConnectionState {
  Idle,
  Connecting,
  Connected,
  Disconnected,
}

/**
 * Event client options object
 */
export interface EventClientOptions {
  /**
   * Whether to log events
   * @default false
   */
  debug: boolean;

  /**
   * Time in seconds between Ping packets sent to the server
   * @default 30
   */
  heartbeatInterval: number;

  /**
   * Maximum time in seconds between Ping and corresponding Pong
   * @default 10
   */
  pongTimeout: number;

  /**
   * Maximum time in seconds between init and first message
   * @default 10
   */
  connectTimeout: number;
}

/**
 * Events provided by the client.
 */
type Events<T extends AvailableProtocols, P extends EventProtocol<T>> = {
  error: [error: StoatError | Error | Event];
  event: [event: P["server"]];
  state: [state: ConnectionState];
};

/**
 * Simple wrapper around the Revolt websocket service.
 */
export class EventClient<
  T extends AvailableProtocols,
> extends AsyncEventEmitter<Events<T, EventProtocol<T>>> {
  readonly options: EventClientOptions;

  #protocolVersion: T;
  #transportFormat: "json" | "msgpack";

  readonly ping: Accessor<number>;
  #setPing: Setter<number>;

  readonly state: Accessor<ConnectionState>;
  #setStateSetter: Setter<ConnectionState>;

  #socket: WebSocket | undefined;
  #heartbeatIntervalReference: number | undefined;
  #pongTimeoutReference: number | undefined;
  #connectTimeoutReference: number | undefined;

  #lastError:
    | { type: "socket"; data: Event }
    | { type: "revolt"; data: StoatError }
    | { type: "protocol"; data: Error }
    | undefined;

  /**
   * Create a new event client.
   * @param protocolVersion Target protocol version
   * @param transportFormat Communication format
   * @param options Configuration options
   */
  constructor(
    protocolVersion: T,
    transportFormat: "json" = "json",
    options?: Partial<EventClientOptions>,
  ) {
    super();

    this.#protocolVersion = protocolVersion;
    this.#transportFormat = transportFormat;

    this.options = {
      heartbeatInterval: 30,
      pongTimeout: 10,
      connectTimeout: 10,
      debug: false,
      ...options,
    };

    const [state, setState] = createSignal(ConnectionState.Idle);
    this.state = state;
    this.#setStateSetter = setState;

    const [ping, setPing] = createSignal(-1);
    this.ping = ping;
    this.#setPing = setPing;

    this.disconnect = this.disconnect.bind(this);
    this.dispose = this.dispose.bind(this);
    this.send = this.send.bind(this);
    this.connect = this.connect.bind(this);
    this.handle = this.handle.bind(this);
  }

  /**
   * Set the current state
   * @param state state
   */
  private setState(state: ConnectionState): void {
    this.#setStateSetter(state);
    this.emit("state", state);
  }

  /**
   * Clear all pending connection timers. Call on disconnect.
   * Idempotent — safe to call multiple times.
   */
  private clearTimers(): void {
    clearInterval(this.#heartbeatIntervalReference);
    clearTimeout(this.#connectTimeoutReference);
    clearTimeout(this.#pongTimeoutReference);
    this.#heartbeatIntervalReference = undefined;
    this.#connectTimeoutReference = undefined;
    this.#pongTimeoutReference = undefined;
  }

  /**
   * Connect to the websocket service.
   * @param uri WebSocket URI
   * @param token Authentication token
   */
  connect(uri: string, token: string): void {
    this.dispose();
    this.#lastError = undefined;
    this.setState(ConnectionState.Connecting);

    this.#connectTimeoutReference = setTimeout(
      () => this.disconnect(),
      this.options.connectTimeout * 1e3,
    ) as never;

    const url = new URL(uri);
    url.searchParams.set("version", this.#protocolVersion.toString());
    url.searchParams.set("format", this.#transportFormat);
    url.searchParams.set("token", token);

    // todo: pass-through ts as a configuration option
    // todo: then remove /settings/fetch from web client
    // todo: do the same for unreads
    // url.searchParams.append("ready", "users");
    // url.searchParams.append("ready", "servers");
    // url.searchParams.append("ready", "channels");
    // url.searchParams.append("ready", "members");
    // url.searchParams.append("ready", "emojis");
    // url.searchParams.append("ready", "voice_states");
    // url.searchParams.append("ready", "user_settings[ordering]");
    // url.searchParams.append("ready", "user_settings[notifications]");
    // url.searchParams.append("ready", "unreads or something");
    // url.searchParams.append("ready", "policy_changes");

    const socket = (this.#socket = new WebSocket(url));

    socket.onopen = () => {
      if (this.#socket !== socket) return; // stale, a newer socket exists
      this.#heartbeatIntervalReference = setInterval(() => {
        this.send({ type: "Ping", data: +new Date() });
        this.#pongTimeoutReference = setTimeout(
          () => this.disconnect(),
          this.options.pongTimeout * 1e3,
        ) as never;
      }, this.options.heartbeatInterval * 1e3) as never;
    };

    socket.onerror = (error) => {
      if (this.#socket !== socket) return; // stale, a newer socket exists
      this.#lastError = { type: "socket", data: error };
      this.emit("error", error);
    };

    socket.onmessage = (event) => {
      if (this.#socket !== socket) return; // stale, a newer socket exists
      clearInterval(this.#connectTimeoutReference);

      if (this.#transportFormat === "json") {
        if (typeof event.data === "string") {
          try {
            this.handle(JSONParse(event.data));
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            this.#lastError = { type: "protocol", data: error };
            this.disconnect();
            this.emit("error", error);
          }
        }
      }
    };

    let closed = false;
    socket.onclose = () => {
      if (closed) return;
      closed = true;
      if (this.#socket !== socket) return; // stale, a newer socket exists
      this.#socket = undefined;
      this.clearTimers();
      this.setState(ConnectionState.Disconnected);
    };
  }

  /**
   * Dispose the websocket client.
   */
  dispose(): void {
    if (!this.#socket) return;
    this.clearTimers();
    const socket = this.#socket;
    this.#socket = undefined;
    socket.close();
  }

  /**
   * Disconnect the websocket client.
   */
  disconnect(): void {
    if (!this.#socket) return;
    this.dispose();
    this.setState(ConnectionState.Disconnected);
  }

  /**
   * Send an event to the server.
   * @param event Event
   */
  send(event: EventProtocol<T>["client"]): void {
    if (this.options.debug) console.debug("[C->S]", event);
    if (!this.#socket) throw "Socket closed, trying to send.";
    this.#socket.send(JSONStringify(event));
  }

  /**
   * Handle events intended for client before passing them along.
   * @param event Event
   */
  handle(event: EventProtocol<T>["server"]): void {
    if (this.options.debug) console.debug("[S->C]", event);
    switch (event.type) {
      case "Ping":
        this.send({
          type: "Pong",
          data: event.data,
        });
        return;
      case "Pong":
        clearTimeout(this.#pongTimeoutReference);
        this.#setPing(+new Date() - event.data);
        if (this.options.debug) console.debug(`[ping] ${this.ping()}ms`);
        return;
      case "Error":
        this.#lastError = {
          type: "revolt",
          data: event.data,
        };
        this.disconnect();
        this.emit("error", event.data);
        return;
    }

    switch (this.state()) {
      case ConnectionState.Connecting:
        if (event.type === "Authenticated") {
          // no-op
        } else if (event.type === "Ready") {
          this.emit("event", event);
          this.setState(ConnectionState.Connected);
        } else {
          throw `Unreachable code. Received ${event.type} in Connecting state.`;
        }
        break;
      case ConnectionState.Connected:
        if (event.type === "Authenticated" || event.type === "Ready") {
          throw `Unreachable code. Received ${event.type} in Connected state.`;
        } else {
          this.emit("event", event);
        }
        break;
      default:
        throw `Unreachable code. Received ${event.type} in state ${this.state()}.`;
    }
  }

  /**
   * Last error encountered by events client
   */
  get lastError():
    | {
        type: "socket";
        data: Event;
      }
    | {
        type: "revolt";
        data: StoatError;
      }
    | {
        type: "protocol";
        data: Error;
      }
    | undefined {
    return this.#lastError;
  }
}
