import { Handler } from "mdast-util-to-hast";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { UnicodeEmoji } from "../emoji";
import {
  RE_UNICODE_EMOJI,
  UNICODE_EMOJI_MAX_PACK,
  UNICODE_EMOJI_MIN_PACK,
  UNICODE_EMOJI_PUA_PACK,
  UnicodeEmojiPacks,
} from "../emoji/UnicodeEmoji";

/**
 * Render Unicode emoji
 */
export function RenderUnicodeEmoji(props: {
  str: string;
  pack: UnicodeEmojiPacks;
}) {
  return <UnicodeEmoji emoji={props.str} pack={props.pack} />;
}

export function parseUnicodeEmoji(str: string): {
  str: string;
  pack?: UnicodeEmojiPacks;
} {
  const selectorChar = str[0];
  const selector = selectorChar.codePointAt(0);
  if (
    selector &&
    selector >= UNICODE_EMOJI_MIN_PACK &&
    selector <= UNICODE_EMOJI_MAX_PACK
  ) {
    return {
      str: str.substring(1),
      pack: UNICODE_EMOJI_PUA_PACK[selectorChar],
    };
  } else {
    return {
      str,
    };
  }
}

export const remarkUnicodeEmoji: Plugin = () => (tree) => {
  visit(
    tree,
    "text",
    (
      node: { type: "text"; value: string },
      idx,
      parent: { children: any[] },
    ) => {
      const elements = node.value.split(RE_UNICODE_EMOJI);
      if (elements.length === 1) return; // no matches

      // Generate initial node
      const newNodes: (
        | { type: "text"; value: string }
        | {
            type: "unicodeEmoji";
            str: string;
            pack?: UnicodeEmojiPacks;
          }
      )[] = [
        {
          type: "text",
          value: elements.shift()!,
        },
      ];

      // Process all timestamps
      for (let i = 0; i < elements.length / 2; i++) {
        newNodes.push({
          type: "unicodeEmoji",
          ...parseUnicodeEmoji(elements[i * 2]),
        });

        newNodes.push({
          type: "text",
          value: elements[i * 2 + 1],
        });
      }

      parent.children.splice(idx, 1, ...newNodes);
      return idx + newNodes.length;
    },
  );
};

export const unicodeEmojiHandler: Handler = (h, node) => {
  return {
    type: "element" as const,
    tagName: "unicodeEmoji",
    children: [],
    properties: {
      str: node.str,
      pack: node.pack,
    },
  };
};
