import { createSignal } from "solid-js";

import { i18n } from "@lingui/core";
import dayjs from "dayjs";
import locale_en_GB from "dayjs/esm/locale/en-gb.js";
import advancedFormat from "dayjs/plugin/advancedFormat";
import calendar from "dayjs/plugin/calendar";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

import { type LocaleOptions, LanguageEntry, Languages } from "./Languages";

dayjs.extend(calendar);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(updateLocale);

/**
 * Internal signal, don't try to use this unless you know what you're doing!
 */
const [timeLocale, setTimeLocale] = createSignal<[string, ILocale]>([
  null!,
  null!,
]);

export { dayjs, timeLocale };

export async function loadTimeLocale(
  language: LanguageEntry,
  localeOptions: LocaleOptions,
  useLocale?: ILocale,
) {
  const target = language.dayjs ?? language.i18n;
  const locale =
    useLocale ??
    LOCALE_OVERRIDES[target] ??
    ((await import(`../../node_modules/dayjs/esm/locale/${target}.js`).then(
      (module) => module.default,
    )) as ILocale);

  // merge options for calendar
  (locale as unknown as { calendar: Record<string, string> }).calendar = {
    lastDay: i18n._(`[Yesterday at] LT`),
    sameDay: i18n._(`[Today at] LT`),
    nextDay: i18n._(`[Tomorrow at] LT`),
    lastWeek: i18n._(`[Last] dddd [at] LT`),
    nextWeek: i18n._(`dddd [at] LT`),
    sameElse: "L",
  };

  // merge locale options
  const options = {
    ...language.localeOptions,
    ...localeOptions,
  };

  updateTimeLocaleOptions(options, target, locale);
}

/**
 * Update dayjs locale given locale options
 * @param options Options
 * @param target Target locale (uses current if none specified)
 * @param useLocale Override locale data
 */
export function updateTimeLocaleOptions(
  options: LocaleOptions,
  target?: string,
  useLocale?: ILocale,
) {
  const [currentTarget, currentLocale] = timeLocale();
  target = target ?? currentTarget;
  useLocale = useLocale ?? currentLocale;

  const locale = {
    ...useLocale,
    formats: {
      ...useLocale.formats,
      L: options.dateFormat ?? useLocale.formats.L,
      LT: options.timeFormat ?? useLocale.formats.LT,
    },
  };

  setTimeLocale([target, locale]);
}

/**
 * Initialisation function
 */
export function initTime() {
  loadTimeLocale(Languages.en, {}, locale_en_GB);
}

/**
 * Create dayjs time objects with locale and extensions
 * @returns Dayjs creator
 */
export function useTime() {
  // eslint-disable-next-line solid/reactivity
  return (date?: dayjs.ConfigType) => dayjs(date).locale(...timeLocale());
}

/**
 * Define a custom en_US locale because dayjs doesn't include an exhaustive definition
 */
const locale_en_US: ILocale & { yearStart: number } = {
  name: "en",
  weekdays: locale_en_GB["weekdays"],
  weekdaysShort: locale_en_GB["weekdaysShort"],
  weekdaysMin: locale_en_GB["weekdaysMin"],
  months: locale_en_GB["months"],
  monthsShort: locale_en_GB["monthsShort"],
  weekStart: locale_en_GB["weekStart"],
  yearStart: (locale_en_GB as never as { yearStart: number })["yearStart"],
  relativeTime: locale_en_GB["relativeTime"],
  formats: {
    LT: "h:mm A",
    LTS: "h:mm:ss A",
    L: "MM/DD/YYYY",
    LL: "MMMM D, YYYY",
    LLL: "MMMM D, YYYY h:mm A",
    LLLL: "dddd, MMMM D, YYYY h:mm A",
  },
  ordinal: locale_en_GB["ordinal"],
};

const LOCALE_OVERRIDES: Record<string, ILocale> = {
  "en-gb": locale_en_GB,
  en: locale_en_US,
};
