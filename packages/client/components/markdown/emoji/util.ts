import emojiRegex from "emoji-regex";

import { MarkdownProps } from "..";

/**
 * Regex for custom emoji
 */
export const RE_CUSTOM_EMOJI = /:([0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}):/g;

/**
 * Regex for any emoji
 */
export const RE_ANY_EMOJI = new RegExp(
  RE_CUSTOM_EMOJI.source + "|[\uE0E0-\uE0E6]?(?:" + emojiRegex().source + ")",
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
