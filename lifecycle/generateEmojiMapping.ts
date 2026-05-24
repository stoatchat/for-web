import { resolve } from "jsr:@std/path";

const ordering = await fetch(
  "https://raw.githubusercontent.com/googlefonts/emoji-metadata/main/emoji_17_0_ordering.json",
).then((res) => res.json());

const Mapping: Record<string, string> = {};

const RE_SHORTCODE = /^:[\w-]+:$/;

/** Mapping of long names -> shortcut names */
const altCodes = {
  copyright: "c",
  registered: "r",
  "trade-mark": "tm",
  "a-button": "a",
  "b-button": "b",
  "o-button": "o",
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
};

for (const group of Object.keys(ordering)) {
  for (const emote of ordering[group].emoji) {
    emote.base = (emote.base as number[]).filter(
      (codePoint) => codePoint !== 65039,
    );

    const emoji = String.fromCodePoint(...emote.base);
    let code;

    for (code of emote.shortcodes) {
      if (!RE_SHORTCODE.test(code)) continue;
      code = code.substring(1, code.length - 1).toLowerCase();
      Mapping[code] = emoji;

      //Check for altCode
      const altKey = code as keyof typeof altCodes;
      code = altCodes[altKey];
      if (code) {
        Mapping[code] = emoji;
        delete altCodes[altKey];
      }

      break;
    }
  }
}

const unusedAlts = Object.keys(altCodes);
if (unusedAlts.length) {
  throw "The following emoji altCodes were not found: " + unusedAlts.join(", ");
}

Deno.writeTextFile(
  resolve(
    import.meta.dirname!,
    "../packages/client/components/ui/emojiMapping.json",
  ),
  JSON.stringify(Mapping),
);
