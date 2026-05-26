import emojiMapping from "./emojiMapping.json";

type EmojiDefinition = {
  emoji: string;
  shorthands: string[];
};

export const EMOJI_MAP: EmojiDefinition[] = [];
export const EMOJI_KEYS: string[] = [];
export const SHORTHAND_TO_EMOJI: Record<string, EmojiDefinition> = {};
export const MAPPED_EMOJI_KEYS: {
  id: string;
  name: string;
}[] = [];

for (let i = 0; i < emojiMapping.length; i++) {
  const shorthands = emojiMapping[i].slice(1);
  const ed: EmojiDefinition = {
    emoji: emojiMapping[i][0],
    shorthands: shorthands,
  };
  EMOJI_MAP.push(ed);
  for (let j = 0; j < shorthands.length; j++) {
    EMOJI_KEYS.push(shorthands[j]);
    SHORTHAND_TO_EMOJI[shorthands[j]] = ed;
    MAPPED_EMOJI_KEYS.push({ id: shorthands[j], name: shorthands[j] });
  }
}

export function getEmojiByShorthand(sh: string): EmojiDefinition {
  return SHORTHAND_TO_EMOJI[sh];
}
