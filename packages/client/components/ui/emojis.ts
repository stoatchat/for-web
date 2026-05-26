import emojiMapping from "./emojiMapping.json";

type EmojiDefinition = {
  emoji: string;
  shorthands: string[];
};

export const EMOJI_MAP: EmojiDefinition[] = emojiMapping;
export const EMOJI_KEYS: string[] = [];
export const SHORTHAND_TO_EMOJI: Record<string, EmojiDefinition> = {};
export const MAPPED_EMOJI_KEYS: {
  id: string;
  name: string;
}[] = [];

EMOJI_MAP.forEach((ed) => {
  ed.shorthands.forEach((sh) => {
    EMOJI_KEYS.push(sh);
    SHORTHAND_TO_EMOJI[sh] = ed;
    MAPPED_EMOJI_KEYS.push({ id: sh, name: sh });
  });
});

export function getEmojiByShorthand(sh: string): EmojiDefinition {
  return SHORTHAND_TO_EMOJI[sh];
}
