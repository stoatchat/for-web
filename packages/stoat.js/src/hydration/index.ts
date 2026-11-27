import { botHydration } from "./bot.js";
import { channelHydration } from "./channel.js";
import { channelUnreadHydration } from "./channelUnread.js";
import { channelWebhookHydration } from "./channelWebhook.js";
import { emojiHydration } from "./emoji.js";
import { messageHydration } from "./message.js";
import { serverHydration } from "./server.js";
import { serverMemberHydration } from "./serverMember.js";
import { sessionHydration } from "./session.js";
import { userHydration } from "./user.js";

/**
 * Functions to map from one object to another
 */
export type MappingFns<Input, Output, Key extends keyof Output> = Record<
  Key,
  (value: Input, context: unknown) => Output[Key]
>;

/**
 * Key mapping information
 */
export type KeyMapping<Input, Output> = Record<keyof Input, keyof Output>;

/**
 * Hydration information
 */
export type Hydrate<Input, Output> = {
  keyMapping: Partial<KeyMapping<Input, Output>>;
  functions: MappingFns<Input, Output, keyof Output>;
  initialHydration: () => Partial<Output>;
};

/**
 * Hydrate some data
 * @param hydration Hydration data
 * @param input Input data
 * @returns Output data
 */
function hydrateInternal<Input extends object, Output>(
  hydration: Hydrate<Input, Output>,
  input: Input,
  context: unknown,
): Output {
  return (Object.keys(input) as (keyof Input)[]).reduce((acc, key) => {
    let targetKey, value;
    try {
      targetKey = hydration.keyMapping[key] ?? key;
      value = hydration.functions[targetKey as keyof Output](input, context);
    } catch {
      if (key === "partial") {
        return {
          ...acc,
          partial: input["partial" as never],
        };
      }
      if (key === "type") return acc;
      console.debug(`Skipping key ${String(key)} during hydration!`);
      return acc;
    }

    return {
      ...acc,
      [targetKey]: value,
    };
  }, {} as Output);
}

const hydrators = {
  bot: botHydration,
  channel: channelHydration,
  channelUnread: channelUnreadHydration,
  channelWebhook: channelWebhookHydration,
  emoji: emojiHydration,
  message: messageHydration,
  server: serverHydration,
  serverMember: serverMemberHydration,
  session: sessionHydration,
  user: userHydration,
};

export type Hydrators = typeof hydrators;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractInput<T> = T extends Hydrate<infer I, any> ? I : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractOutput<T> = T extends Hydrate<any, infer O> ? O : never;

/**
 * Hydrate some input with a given type
 * @param type Type
 * @param input Input Object
 * @param initial Whether this is the initial hydration
 * @returns Hydrated Object
 */
export function hydrate<T extends keyof Hydrators>(
  type: T,
  input: Partial<ExtractInput<Hydrators[T]>>,
  context: unknown,
  initial?: boolean,
): ExtractOutput<Hydrators[T]> {
  return hydrateInternal(
    hydrators[type] as never,
    initial ? { ...hydrators[type].initialHydration(), ...input } : input,
    context,
  ) as ExtractOutput<Hydrators[T]>;
}
