import { writeFile } from "node:fs/promises";

const ordering = await fetch(
  "https://raw.githubusercontent.com/googlefonts/emoji-metadata/main/emoji_17_0_ordering.json",
).then((res) => res.json());

const Mapping = {};

const RE_SHORTCODE = /^[\w-]+$/;

for (const group of Object.keys(ordering)) {
  for (const emote of ordering[group].emoji) {
    const emoji = String.fromCodePoint(...emote.base);

    for (const shortcode of emote.shortcodes) {
      if (!RE_SHORTCODE.test(shortcode)) continue;

      Mapping[
        shortcode
          .substring(1, shortcode.length - 1)
          .replace(/ /g, "-")
          .toLowerCase()
      ] = emoji;

      break;
    }
  }
}

writeFile(
  "packages/client/components/ui/emojiMapping.json",
  JSON.stringify(Mapping),
  "utf8",
);
