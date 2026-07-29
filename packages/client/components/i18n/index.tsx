import type { JSX } from "solid-js";

import { I18nProvider as LinguiProvider } from "@lingui-solid/solid";
import { i18n } from "@lingui/core";

import { type LocaleOptions, Language, Languages } from "./Languages";
import { messages as en } from "./catalogs/en/messages";
import { initTime, loadTimeLocale } from "./dayjs";

export function I18nProvider(props: { children: JSX.Element }) {
  i18n.load({
    en,
  });

  i18n.activate("en");

  initTime();

  return <LinguiProvider i18n={i18n}>{props.children}</LinguiProvider>;
}

export { Language, Languages } from "./Languages";
export { timeLocale, useTime } from "./dayjs";
export { useError } from "./errors";

export async function loadAndSwitchLocale(
  key: Language,
  localeOptions: LocaleOptions,
) {
  if (key !== i18n.locale) {
    const data =
      Languages[key].i18n === "en"
        ? en
        : (await import(`./catalogs/${Languages[key].i18n}/messages.ts`))
            .messages;

    i18n.load({
      [key]: data,
    });

    i18n.activate(key);

    loadTimeLocale(Languages[key], localeOptions);
  }
}

/**
 * Preferred language as reported by the browser
 * @returns Preferred language
 */
export function browserPreferredLanguage() {
  const languages = Object.keys(Languages).map(
    (x) => [x, Languages[x as keyof typeof Languages]] as const,
  );

  // Get the user's system language. Check for exact
  // matches first, otherwise check for partial matches
  return (
    navigator.languages
      .map((lang) => languages.find((l) => l[0].replace(/_/g, "-") == lang))
      .filter((lang) => lang)[0]?.[0] ??
    navigator.languages
      .map((x) => x.split("-")[0])
      .map((lang) => languages.find((l) => l[0] == lang))
      .filter((lang) => lang)[0]?.[0] ??
    Language.ENGLISH
  );
}
