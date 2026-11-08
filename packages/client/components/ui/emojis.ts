import emojiMapping from "./emojiMapping.json";

type EmojiDefinition = {
  emoji: string;
  shorthands: string[];
};

export const EMOJI_LIST: EmojiDefinition[] = [];
export const EMOJI_SET: EmojiDefinition[] = [];
export const CODEPOINT_TO_EMOJI: Record<string, EmojiDefinition> = {};
export const EMOJI_KEYS: Set<string> = new Set();
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
  EMOJI_LIST.push(ed);
  if (!EMOJI_SET.find((e) => e.emoji === ed.emoji)) {
    EMOJI_SET.push(ed);
  }
  CODEPOINT_TO_EMOJI[ed.emoji] = ed;
  for (let j = 0; j < shorthands.length; j++) {
    EMOJI_KEYS.add(shorthands[j]);
    SHORTHAND_TO_EMOJI[shorthands[j]] = ed;
    MAPPED_EMOJI_KEYS.push({ id: shorthands[j], name: shorthands[j] });
  }
}

export function getEmojiByShorthand(sh: string): EmojiDefinition | undefined {
  return SHORTHAND_TO_EMOJI[sh];
}

export function getEmojiByCodepoint(cp: string): EmojiDefinition | undefined {
  return CODEPOINT_TO_EMOJI[cp];
}
