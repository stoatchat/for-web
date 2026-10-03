import { RE_CUSTOM_EMOJI } from "stoat.js";

import emojiRegex from "emoji-regex";

import { MarkdownProps } from "..";

const UNICODE_EMOJI_REGIONAL_INDICATORS =
  "\u{1f1e6}|\u{1f1e7}|\u{1f1e8}|\u{1f1e9}|\u{1f1ea}|\u{1f1eb}|\u{1f1ec}|\u{1f1ed}|\u{1f1ee}|\u{1f1ef}|\u{1f1f0}|\u{1f1f1}|\u{1f1f2}|\u{1f1f3}|\u{1f1f4}|\u{1f1f5}|\u{1f1f6}|\u{1f1f7}|\u{1f1f8}|\u{1f1f9}|\u{1f1fa}|\u{1f1fb}|\u{1f1fc}|\u{1f1fd}|\u{1f1fe}|\u{1f1ff}";
export const UNICODE_ZWNJ = "\u200C";

export const RE_UNICODE_EMOJI_REGIONAL_INDICATOR = new RegExp(
  `^(?:${UNICODE_EMOJI_REGIONAL_INDICATORS})$`,
);

/**
 * Regex for matching emoji
 */
export const RE_UNICODE_EMOJI = new RegExp(
  `([\uE0E0-\uE0E6]?(?:${emojiRegex().source}|(?:${UNICODE_ZWNJ}?(?:${UNICODE_EMOJI_REGIONAL_INDICATORS}))))`,
  "g",
);

/**
 * Regex for any emoji
 */
export const RE_ANY_EMOJI = new RegExp(
  RE_CUSTOM_EMOJI.source + "|" + RE_UNICODE_EMOJI.source,
  "g",
);

/**
 * Check if a piece of text is only comprised of emoji
 * @param text Text
 * @returns Whether it is only emoji
 */
export function isOnlyEmoji(text: string) {
  return text.replaceAll(RE_ANY_EMOJI, "").trim().length === 0;
}

/**
 * Inject emoji size information into a hast node
 * @param props Pass-through Markdown props
 * @param hastNode Target hast node
 */
export function injectEmojiSize(
  props: MarkdownProps,
  hastNode: { children?: { properties: Record<string, string> }[] },
) {
  const content = props.content ?? "";

  // inject emoji size information
  // (there is no first child when content renders to nothing,
  //  such as a message containing only link reference definitions)
  const properties = (
    hastNode as { children?: { properties: Record<string, string> }[] }
  ).children?.[0]?.properties;

  // inject custom property
  if (properties) {
    if (!props.disallowBigEmoji && isOnlyEmoji(content)) {
      // will always match at least one
      RE_ANY_EMOJI.lastIndex = 0;
      RE_ANY_EMOJI.exec(content);

      // large by default
      let size = "large";

      // check if we match more than one
      // if so, make it slightly smaller
      if (RE_ANY_EMOJI.exec(content)) {
        size = "medium";
      }

      properties["emojiSize"] = size;
    }
  }
}

/**
 * Function provided under the MIT License
 * Copyright (c) 2016-20 Ionică Bizău <bizauionica@gmail.com> (https://ionicabizau.net)
 * https://github.com/IonicaBizau/emoji-unicode/blob/master/LICENSE
 */
export function toCodepoint(input: string) {
  if (input.length === 1) {
    return input.charCodeAt(0).toString(16);
  } else if (input.length > 1) {
    const pairs = [];
    for (let i = 0; i < input.length; i++) {
      if (
        // high surrogate
        input.charCodeAt(i) >= 0xd800 &&
        input.charCodeAt(i) <= 0xdbff
      ) {
        if (
          input.charCodeAt(i + 1) >= 0xdc00 &&
          input.charCodeAt(i + 1) <= 0xdfff
        ) {
          // low surrogate
          pairs.push(
            (input.charCodeAt(i) - 0xd800) * 0x400 +
              (input.charCodeAt(i + 1) - 0xdc00) +
              0x10000,
          );
        }
      } else if (input.charCodeAt(i) < 0xd800 || input.charCodeAt(i) > 0xdfff) {
        // modifiers and joiners
        pairs.push(input.charCodeAt(i));
      }
    }

    return pairs.map((char) => char.toString(16)).join("-");
  }

  return "";
}
