import {
  type JSX,
  createContext,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";

import { Channel, Client, Message } from "revolt.js";

type ChannelState = {
  messages: Message[];
  atStart: boolean;
  atEnd: boolean;
  scrollTop?: number;
};

const CacheContext = createContext<{
  manage(channel: Channel, state: ChannelState): void;
  unmanage(channel: Channel): ChannelState | void;
  // preload(channel: Channel): void; :: future optimisation feature
}>();

/**
 * Persistent message & channel state cache
 */
export function MessageCache(props: { client: Client; children: JSX.Element }) {
  const cache: Record<string, ChannelState> = {};

  /**
   * Handle incoming messages
   * @param message Message object
   */
  function onMessage(message: Message) {
    const entry = cache[message.channelId];
    if (entry?.atEnd) {
      entry.messages = [message, ...entry.messages].slice(0, 50);
    }
  }

  /**
   * Handle deleted messages
   */
  function onMessageDelete(message: { id: string; channelId: string }) {
    const entry = cache[message.channelId];
    if (entry) {
      entry.messages = entry.messages.filter((msg) => msg.id !== message.id);
    }
  }

  // Add listener for messages
  onMount(() => {
    props.client.addListener("messageCreate", onMessage);
    props.client.addListener("messageDelete", onMessageDelete);
  });

  onCleanup(() => {
    props.client.removeListener("messageCreate", onMessage);
    props.client.removeListener("messageDelete", onMessageDelete);
  });

  return (
    <CacheContext.Provider
      value={{
        manage(channel, state) {
          cache[channel.id] = state;
        },
        unmanage(channel) {
          if (cache[channel.id]) {
            const state = cache[channel.id];
            delete cache[channel.id];
            return state;
          }
        },
      }}
    >
      {props.children}
    </CacheContext.Provider>
  );
}

export function useMessageCache() {
  return useContext(CacheContext);
}
