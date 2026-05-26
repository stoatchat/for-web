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

const RE_SHORTCODE = /^:[\w\-+]+:$/;

for (const group of ordering) {
  for (const emote of group.emoji) {
    emote.base = (emote.base as number[]).filter(
      (codePoint) => codePoint !== 65039,
    );

    const emoji = String.fromCodePoint(...emote.base);
    const emojiDef = [emoji];

    for (const code of emote.shortcodes) {
      if (!RE_SHORTCODE.test(code)) continue;

      const name = code.substring(1, code.length - 1).toLowerCase();
      emojiDef.push(name);

      // Check for aliases
      const aliases = emojiExtensions.aliases[name as AliasKey];
      if (aliases) {
        for (const alias of aliases) {
          if (!RE_SHORTCODE.test(`:${alias}:`)) continue;
          emojiDef.push(alias.toLowerCase());
        }
        delete emojiExtensions.aliases[name as AliasKey];
      }
    }
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
