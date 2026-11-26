export enum Language {
  // English
  ENGLISH = "en",
  ENGLISH_STUPEFIED = "en-US",

  // Foreign Languages
  ARABIC = "ar",
  ASSAMESE = "as",
  AZERBAIJANI = "az",
  BELARUSIAN = "be",
  BULGARIAN = "bg",
  BENGALI = "bn",
  BRETON = "br",
  CATALONIAN = "ca",
  CEBUANO = "ceb",
  CENTRAL_KURDISH = "ckb",
  CZECH = "cs",
  DANISH = "da",
  GERMAN = "de",
  GREEK = "el",
  SPANISH = "es",
  SPANISH_LATIN_AMERICA = "es-419",
  ESTONIAN = "et",
  FINNISH = "fi",
  FILIPINO = "fil",
  FRENCH = "fr",
  IRISH = "ga",
  HINDI = "hi",
  CROATIAN = "hr",
  HUNGARIAN = "hu",
  ARMENIAN = "hy",
  INDONESIAN = "id",
  ICELANDIC = "is",
  ITALIAN = "it",
  JAPANESE = "ja",
  KOREAN = "ko",
  LUXEMBOURGISH = "lb",
  LITHUANIAN = "lt",
  MACEDONIAN = "mk",
  MALAY = "ms",
  NORWEGIAN_BOKMAL = "nb-NO",
  DUTCH = "nl",
  PERSIAN = "fa",
  POLISH = "pl",
  PORTUGUESE_BRAZIL = "pt-BR",
  PORTUGUESE_PORTUGAL = "pt-PT",
  ROMANIAN = "ro",
  RUSSIAN = "ru",
  SLOVAK = "sk",
  SLOVENIAN = "sl",
  ALBANIAN = "sq",
  SERBIAN = "sr",
  SINHALESE = "si",
  SWEDISH = "sv",
  TAMIL = "ta",
  THAI = "th",
  TURKISH = "tr",
  UKRANIAN = "uk",
  URDU = "ur",
  VENETIAN = "vec",
  VIETNAMESE = "vi",
  CHINESE_SIMPLIFIED = "zh-Hans",
  CHINESE_TRADITIONAL = "zh-Hant",
  LATVIAN = "lv",

  // Constructed Languages
  TOKIPONA = "tokipona",
  ESPERANTO = "esperanto",

  // Joke Languages
  OWO = "owo",
  PIRATE = "pr",
  BOTTOM = "bottom",
  LEET = "leet",
  PIGLATIN = "piglatin",
  ENCHANTMENT_TABLE = "enchantment",

  // Test Languages
  DEV = "dev",
}

export interface LocaleOptions {
  /**
   * Date format
   *
   * Example values: DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD
   */
  dateFormat?: string;

  /**
   * Time format
   *
   * Example values: h:mm A, hh:mm
   */
  timeFormat?: string;

  /**
   * Whether the UI should be right-to-left
   */
  rtl?: boolean;
}

export interface LanguageEntry {
  /**
   * What should appear in the UI as the name for the language
   */
  display: string;

  /**
   * What emoji should be displayed
   */
  emoji: string;

  /**
   * Filename of the related language file
   */
  i18n: string;

  /**
   * Dayjs locale file if different
   */
  dayjs?: string;

  /**
   * Locale options
   */
  localeOptions?: Pick<LocaleOptions, "rtl">;

  /**
   * Whether the language is a conlang (constructed language) or a joke
   */
  cat?: "const" | "alt";

  /**
   * Whether the language has a maintainer
   * (patched in)
   */
  verified?: boolean;

  /**
   * Whether the language is incomplete
   * (patched in)
   */
  incomplete?: boolean;
}

export const Languages: { [key in Language]: LanguageEntry } = {
  // English and "English"
  en: {
    display: "English (Traditional)",
    emoji: "🇬🇧",
    i18n: "en",
    dayjs: "en-gb",
  },
  "en-US": {
    display: "English (Simplified)",
    emoji: "🇺🇸",
    i18n: "en-US",
    dayjs: "en",
  },

  // Foreign languages
  ar: {
    display: "عربي",
    emoji: "🇸🇦",
    i18n: "ar",
    localeOptions: { rtl: true },
    verified: true,
  },
  as: {
    display: "অসমীয়া",
    emoji: "🇮🇳",
    i18n: "as",
  },
  az: { display: "Azərbaycan dili", emoji: "🇦🇿", i18n: "az" },
  be: { display: "Беларуская", emoji: "🇧🇾", i18n: "be" },
  bg: { display: "Български", emoji: "🇧🇬", i18n: "bg" },
  bn: { display: "বাংলা", emoji: "🇧🇩", i18n: "bn" },
  br: { display: "Brezhoneg", emoji: "br", i18n: "br", verified: true },
  ca: { display: "Català", emoji: "🇪🇸", i18n: "ca" },
  ceb: { display: "Bisaya", emoji: "🇵🇭", i18n: "ceb" },
  ckb: {
    display: "کوردی",
    emoji: "krd",
    i18n: "ckb",
    dayjs: "ku",
  },
  cs: { display: "Čeština", emoji: "🇨🇿", i18n: "cs" },
  da: { display: "Dansk", emoji: "🇩🇰", i18n: "da" },
  de: { display: "Deutsch", emoji: "🇩🇪", i18n: "de", verified: true },
  el: { display: "Ελληνικά", emoji: "🇬🇷", i18n: "el" },
  es: { display: "Español", emoji: "🇪🇸", i18n: "es" },
  "es-419": {
    display: "Español (América Latina)",
    emoji: "🇪🇸",
    i18n: "es-419",
    dayjs: "es",
  },
  et: { display: "eesti", emoji: "🇪🇪", i18n: "et", verified: true },
  fi: { display: "suomi", emoji: "🇫🇮", i18n: "fi" },
  fil: {
    display: "Filipino",
    emoji: "🇵🇭",
    i18n: "fil",
    dayjs: "tl-ph",
  },
  fr: { display: "Français", emoji: "🇫🇷", i18n: "fr", verified: true },
  ga: { display: "Gaeilge", emoji: "🇮🇪", i18n: "ga" },
  hi: { display: "हिन्दी", emoji: "🇮🇳", i18n: "hi" },
  hr: { display: "Hrvatski", emoji: "🇭🇷", i18n: "hr" },
  hu: { display: "Magyar", emoji: "🇭🇺", i18n: "hu", verified: true },
  hy: { display: "հայերեն", emoji: "🇦🇲", i18n: "hy" },
  id: { display: "Bahasa Indonesia", emoji: "🇮🇩", i18n: "id" },
  is: { display: "Íslenska", emoji: "🇮🇸", i18n: "is" },
  it: { display: "Italiano", emoji: "🇮🇹", i18n: "it" },
  ja: { display: "日本語", emoji: "🇯🇵", i18n: "ja" },
  ko: { display: "한국어", emoji: "🇰🇷", i18n: "ko" },
  lb: { display: "Lëtzebuergesch", emoji: "🇱🇺", i18n: "lb" },
  lt: { display: "Lietuvių", emoji: "🇱🇹", i18n: "lt" },
  lv: { display: "Latviešu", emoji: "🇱🇻", i18n: "lv", verified: true },
  mk: { display: "Македонски", emoji: "🇲🇰", i18n: "mk" },
  ms: { display: "Bahasa Melayu", emoji: "🇲🇾", i18n: "ms" },
  "nb-NO": { display: "Norsk bokmål", emoji: "🇳🇴", i18n: "nb-NO", dayjs: "nb" },
  nl: { display: "Nederlands", emoji: "🇳🇱", i18n: "nl" },
  fa: { display: "فارسی", emoji: "🇮🇷", i18n: "fa", verified: true },
  pl: { display: "Polski", emoji: "🇵🇱", i18n: "pl" },
  "pt-BR": {
    display: "Português (do Brasil)",
    emoji: "🇧🇷",
    i18n: "pt-BR",
    dayjs: "pt-br",
  },
  "pt-PT": {
    display: "Português (Portugal)",
    emoji: "🇵🇹",
    i18n: "pt-PT",
    dayjs: "pt",
  },
  ro: { display: "Română", emoji: "🇷🇴", i18n: "ro" },
  ru: { display: "Русский", emoji: "🇷🇺", i18n: "ru", verified: true },
  sk: { display: "Slovensky", emoji: "🇸🇰", i18n: "sk" },
  sl: { display: "Slovenščina", emoji: "🇸🇮", i18n: "sl" },
  sq: { display: "Shqip", emoji: "🇦🇱", i18n: "sq" },
  sr: { display: "Српски", emoji: "🇷🇸", i18n: "sr" },
  si: { display: "සිංහල", emoji: "🇱🇰", i18n: "si" },
  sv: { display: "Svenska", emoji: "🇸🇪", i18n: "sv", verified: true },
  ta: { display: "தமிழ்", emoji: "🇮🇳", i18n: "ta" },
  th: { display: "ไทย", emoji: "🇹🇭", i18n: "th" },
  tr: { display: "Türkçe", emoji: "🇹🇷", i18n: "tr" },
  ur: { display: "اردو", emoji: "🇵🇰", i18n: "ur" },
  uk: { display: "Українська", emoji: "🇺🇦", i18n: "uk", verified: true },
  vec: { display: "Vèneto", emoji: "vec", i18n: "vec", dayjs: "en-gb" },
  vi: { display: "Tiếng Việt", emoji: "🇻🇳", i18n: "vi" },
  "zh-Hans": {
    display: "简体中文",
    emoji: "🇨🇳",
    i18n: "zh-Hans",
    dayjs: "zh",
  },
  "zh-Hant": {
    display: "繁體中文",
    emoji: "🇹🇼",
    i18n: "zh-Hant",
    dayjs: "zh",
  },

  // Constructed languages
  tokipona: {
    display: "Toki Pona",
    emoji: "🙂",
    i18n: "tokipona",
    dayjs: "en-gb",
    cat: "const",
  },
  esperanto: {
    display: "Esperanto",
    emoji: "EO",
    i18n: "eo",
    dayjs: "eo",
    cat: "const",
  },

  // Joke languages
  owo: {
    display: "OwO",
    emoji: "😸",
    i18n: "owo",
    dayjs: "en-gb",
    cat: "alt",
  },
  pr: {
    display: "Pirate",
    emoji: "🏴‍☠️",
    i18n: "pr",
    dayjs: "en-gb",
    cat: "alt",
  },
  bottom: {
    display: "Bottom",
    emoji: "🥺",
    i18n: "bottom",
    dayjs: "en-gb",
    cat: "alt",
  },
  leet: {
    display: "1337",
    emoji: "💾",
    i18n: "leet",
    dayjs: "en-gb",
    cat: "alt",
  },
  enchantment: {
    display: "Enchantment Table",
    emoji: "🪄",
    i18n: "enchantment",
    dayjs: "en-gb",
    cat: "alt",
  },
  piglatin: {
    display: "Pig Latin",
    emoji: "🐖",
    i18n: "piglatin",
    dayjs: "en-gb",
    cat: "alt",
  },

  // Test Language
  dev: {
    display: "Developer Test",
    emoji: "🦝",
    i18n: "dev",
    dayjs: "en-gb",
    cat: "alt",
  },
};
