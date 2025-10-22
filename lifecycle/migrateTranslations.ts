// deno run -A lifecycle/migrateTranslations.ts
import { Languages } from "../packages/client/components/i18n/Languages.ts";

// 1. construct STRING -> OBJECT PATH mapping
const source = JSON.parse(
  await Deno.readTextFile("/home/insert/Projects/revolt-translations/en.json"),
);

const STRING_MAPPING = {};

function recurseSource(obj: any, path = "") {
  if (typeof obj === "string") {
    STRING_MAPPING[obj] = path;
    return;
  }

  for (const key of Object.keys(obj)) {
    recurseSource(obj[key], path + "." + key);
  }
}

recurseSource(source);

// 2. read STRINGs we need from source gettext
const source_gettext = await Deno.readTextFile(
  "/home/insert/Projects/stoat-frontend/packages/client/components/i18n/catalogs/en/messages.po",
);

const RE_GETTEXT = /msgid "([^"]+)"/g;
const STRINGs = [...source_gettext.matchAll(RE_GETTEXT)].map((r) => r[1]);

// -- debug
console.info(
  `There are ${Object.keys(STRING_MAPPING).length} original strings with ${STRINGs.length} targets. We can re-use ${STRINGs.filter((x) => STRING_MAPPING[x]).length} strings.`,
);

// 3. copy STRINGs into new gettext
for (const { i18n } of Object.values(Languages)) {
  if (i18n === "dev") break;

  const source = JSON.parse(
    await Deno.readTextFile(
      `/home/insert/Projects/revolt-translations/${i18n}.json`,
    ),
  );

  let source_gettext = await Deno.readTextFile(
    `/home/insert/Projects/stoat-frontend/packages/client/components/i18n/catalogs/${i18n}/messages.po`,
  );

  for (const string of STRINGs) {
    const path = STRING_MAPPING[string];
    if (path) {
      const components = path.split(".").filter((x) => x);
      const value = components.reduce((d, k) => d[k] ?? {}, source);
      if (typeof value === "string") {
        source_gettext = source_gettext.replace(
          new RegExp(`msgid "${string}"
msgstr ""`),
          `msgid "${string}"
msgstr "${value}"`,
        );
      }
    }
  }

  await Deno.writeTextFile(
    `/home/insert/Projects/stoat-frontend/packages/client/components/i18n/catalogs/${i18n}/messages.po`,
    source_gettext,
  );
}
