import { resolve } from "jsr:@std/path";
import emojiExtensions from "./emoji-extensions.json" with { type: "json" };

const ordering = (await fetch(
  "https://raw.githubusercontent.com/googlefonts/emoji-metadata/main/emoji_17_0_ordering.json",
).then((res) => res.json())) as typeof emojiExtensions.extensions;

// Add our custom regional indicators
for (const group of emojiExtensions.extensions) {
  const orderingGroup = ordering.find((og) => og.group === group.group)!;
  for (const emote of group.emoji) orderingGroup.emoji.push(emote);
}

type AliasKey = keyof typeof emojiExtensions.aliases;

const Mapping: string[][] = [];
const ShorthandAggregator: Map<string, Set<string>> = new Map();

const RE_SHORTCODE = /^:[\p{L}\w!\-+]+:$/u;

for (const group of ordering) {
  for (const emote of group.emoji) {
    // Bug fix: game-die is the wrong emoji, so we've added it manually. Might as well as do a generic removal system?
    let isRemoved = false;
    for (const code of emote.shortcodes) {
      if (emojiExtensions.removals.includes(code)) {
        isRemoved = true;
        break;
      }
    }
    if (isRemoved) {
      continue;
    }

    const emoji = String.fromCodePoint(...emote.base);
    const emojiShortHands: Set<string> = ShorthandAggregator.getOrInsert(
      emoji,
      new Set(),
    );

    for (let code of emote.shortcodes) {
      code = code.replaceAll(" ", "-");
      // To fix the rescue worker helmet, why is that a ’???
      code = code.replaceAll("’", "");
      // To fix a few emojis with & in the name like St. Kitts & Nevis Flag
      code = code.replaceAll("-&-", "-");
      code = code.replaceAll("&", "");
      // To fix `St.`
      code = code.replaceAll(".", "");
      if (!RE_SHORTCODE.test(code)) continue;

      const name = code.substring(1, code.length - 1).toLowerCase();
      emojiShortHands.add(name);

      // Check for aliases
      const aliases = emojiExtensions.aliases[name as AliasKey];
      if (aliases) {
        for (const alias of aliases) {
          if (!RE_SHORTCODE.test(`:${alias}:`)) continue;
          emojiShortHands.add(alias.toLowerCase());
        }
        delete emojiExtensions.aliases[name as AliasKey];
      }
    }
    ShorthandAggregator.set(emoji, emojiShortHands);
  }
}

for (const group of ordering) {
  for (const emote of group.emoji) {
    // Bug fix: game-die is the wrong emoji, so we've added it manually. Might as well as do a generic removal system?
    let isRemoved = false;
    for (const code of emote.shortcodes) {
      if (emojiExtensions.removals.includes(code)) {
        isRemoved = true;
        break;
      }
    }
    if (isRemoved) {
      continue;
    }

    const emoji = String.fromCodePoint(...emote.base);
    const emojiDef = [emoji];

    const emojiShortHands: Set<string> = ShorthandAggregator.getOrInsert(
      emoji,
      new Set(),
    );

    emojiDef.push(...emojiShortHands);

    Mapping.push(emojiDef);
  }
}

//Test for unused aliases
const unused = Object.keys(emojiExtensions.aliases);
if (unused.length) {
  throw "The following emoji aliases were not found: " + unused.join(", ");
}

Deno.writeTextFile(
  resolve(
    import.meta.dirname!,
    "../packages/client/components/ui/emojiMapping.json",
  ),
  JSON.stringify(Mapping),
);
