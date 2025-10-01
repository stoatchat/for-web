import { ComponentProps, splitProps } from "solid-js";

import emojiRegex from "emoji-regex";

import { EmojiBase, toCodepoint } from ".";

export type UnicodeEmojiPacks =
  | "fluent-3d"
  | "fluent-color"
  | "fluent-flat"
  | "mutant"
  | "noto"
  | "openmoji"
  | "twemoji";

export const UNICODE_EMOJI_PACKS: UnicodeEmojiPacks[] = [
  "fluent-3d",
  "fluent-color",
  "fluent-flat",
  "mutant",
  "noto",
  "openmoji",
  "twemoji",
];

export const UNICODE_EMOJI_PACK_PUA: Record<string, string> = {
  // omit fluent-3d as it is the default (canonically \uE0E1)
  "fluent-flat": "\uE0E2",
  mutant: "\uE0E3",
  noto: "\uE0E4",
  openmoji: "\uE0E5",
  twemoji: "\uE0E6",
};

/**
 * Regex for matching emoji
 */
export const RE_UNICODE_EMOJI = new RegExp(
  "([\uE0E0-\uE0E6]?(?:" + emojiRegex().source + "))",
  "g",
);

export const UNICODE_EMOJI_MIN_PACK = "\uE0E0".codePointAt(0)!;
export const UNICODE_EMOJI_MAX_PACK = "\uE0E6".codePointAt(0)!;

export const UNICODE_EMOJI_PUA_PACK: Record<string, UnicodeEmojiPacks> = {
  ["\uE0E0"]: "fluent-3d", // default entry
  ["\uE0E1"]: "fluent-3d",
  ["\uE0E2"]: "fluent-flat",
  ["\uE0E3"]: "mutant",
  ["\uE0E4"]: "noto",
  ["\uE0E5"]: "openmoji",
  ["\uE0E6"]: "twemoji",
};

export function unicodeEmojiUrl(
  pack: UnicodeEmojiPacks = "fluent-3d",
  text: string,
) {
  return `https://static.stoat.chat/emoji/${pack}/${toCodepoint(text)}.svg?v=1`;
}

/**
 * Display Unicode emoji
 */
export function UnicodeEmoji(
  props: { emoji: string; pack?: UnicodeEmojiPacks } & Omit<
    ComponentProps<typeof EmojiBase>,
    "loading" | "class" | "alt" | "draggable" | "src"
  >,
) {
  const [local, remote] = splitProps(props, ["emoji"]);

  return (
    <EmojiBase
      {...remote}
      loading="lazy"
      class="emoji"
      alt={local.emoji}
      draggable={false}
      src={unicodeEmojiUrl(props.pack, props.emoji)}
    />
  );
}
