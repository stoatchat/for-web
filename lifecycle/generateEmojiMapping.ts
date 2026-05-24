import { resolve } from "jsr:@std/path";
import emojiExtensions from "./emoji-extensions.json" with { type: "json" };

const ordering = await fetch(
  "https://raw.githubusercontent.com/googlefonts/emoji-metadata/main/emoji_17_0_ordering.json",
).then((res) => res.json());

// Add our custom regional indicators
for (const group of Object.keys(emojiExtensions.extensions)) {
  for (const emote of emojiExtensions.extensions[group].emoji) {
    ordering[group].emoji.push(emote);
  }
}

const Mapping: Record<string, string> = {};

const RE_SHORTCODE = /^:[\w\-+]+:$/;

for (const group of Object.keys(ordering)) {
  for (const emote of ordering[group].emoji) {
    emote.base = (emote.base as number[]).filter(
      (codePoint) => codePoint !== 65039,
    );

    const emoji = String.fromCodePoint(...emote.base);

    for (const shortcode of emote.shortcodes) {
      if (!RE_SHORTCODE.test(shortcode)) continue;

      Mapping[shortcode.substring(1, shortcode.length - 1).toLowerCase()] =
        emoji;

      // Check for aliases
      const aliases =
        emojiExtensions.aliases[
          shortcode.substring(1, shortcode.length - 1).toLowerCase()
        ];
      if (aliases) {
        for (const alias of aliases) {
          if (!RE_SHORTCODE.test(":" + alias + ":")) continue;
          Mapping[alias.toLowerCase()] = emoji;
        }
      }
      break;
    }
  }
}

Deno.writeTextFile(
  resolve(
    import.meta.dirname!,
    "../packages/client/components/ui/emojiMapping.json",
  ),
  JSON.stringify(Mapping),
);
