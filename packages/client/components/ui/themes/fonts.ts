export const FONTS = {
  Inter: {
    load: async () => {
      // default
    },
  },

  "Open Sans": {
    load: async () => {
      await import("@fontsource/open-sans/300.css");
      await import("@fontsource/open-sans/400.css");
      await import("@fontsource/open-sans/500.css");
      await import("@fontsource/open-sans/600.css");
      await import("@fontsource/open-sans/700.css");
      await import("@fontsource/open-sans/400-italic.css");
    },
  },

  OpenDyslexic: {
    load: async () => {
      await import("@fontsource/opendyslexic/400.css");
      await import("@fontsource/opendyslexic/700.css");
      await import("@fontsource/opendyslexic/400-italic.css");
    },
  },

  "Atkinson Hyperlegible": {
    load: async () => {
      await import("@fontsource/atkinson-hyperlegible/400.css");
      await import("@fontsource/atkinson-hyperlegible/700.css");
      await import("@fontsource/atkinson-hyperlegible/400-italic.css");
    },
  },
  Roboto: {
    load: async () => {
      await import("@fontsource/roboto/400.css");
      await import("@fontsource/roboto/700.css");
      await import("@fontsource/roboto/400-italic.css");
    },
  },
  "Noto Sans": {
    load: async () => {
      await import("@fontsource/noto-sans/400.css");
      await import("@fontsource/noto-sans/700.css");
      await import("@fontsource/noto-sans/400-italic.css");
    },
  },
  Bitter: {
    load: async () => {
      await import("@fontsource/bitter/300.css");
      await import("@fontsource/bitter/400.css");
      await import("@fontsource/bitter/600.css");
      await import("@fontsource/bitter/700.css");
    },
  },
  Lato: {
    load: async () => {
      await import("@fontsource/lato/300.css");
      await import("@fontsource/lato/400.css");
      await import("@fontsource/lato/700.css");
      await import("@fontsource/lato/400-italic.css");
    },
  },
  Lexend: {
    load: async () => {
      await import("@fontsource/lexend/300.css");
      await import("@fontsource/lexend/400.css");
      await import("@fontsource/lexend/700.css");
    },
  },
  Montserrat: {
    load: async () => {
      await import("@fontsource/montserrat/300.css");
      await import("@fontsource/montserrat/400.css");
      await import("@fontsource/montserrat/600.css");
      await import("@fontsource/montserrat/700.css");
      await import("@fontsource/montserrat/400-italic.css");
    },
  },
  Poppins: {
    load: async () => {
      await import("@fontsource/poppins/300.css");
      await import("@fontsource/poppins/400.css");
      await import("@fontsource/poppins/600.css");
      await import("@fontsource/poppins/700.css");
      await import("@fontsource/poppins/400-italic.css");
    },
  },
  Raleway: {
    load: async () => {
      await import("@fontsource/raleway/300.css");
      await import("@fontsource/raleway/400.css");
      await import("@fontsource/raleway/600.css");
      await import("@fontsource/raleway/700.css");
      await import("@fontsource/raleway/400-italic.css");
    },
  },
  Ubuntu: {
    load: async () => {
      await import("@fontsource/ubuntu/300.css");
      await import("@fontsource/ubuntu/400.css");
      await import("@fontsource/ubuntu/500.css");
      await import("@fontsource/ubuntu/700.css");
      await import("@fontsource/ubuntu/400-italic.css");
    },
  },
  "Comic Neue": {
    load: async () => {
      await import("@fontsource/comic-neue/300.css");
      await import("@fontsource/comic-neue/400.css");
      await import("@fontsource/comic-neue/700.css");
      await import("@fontsource/comic-neue/400-italic.css");
    },
  },
  "IBM Plex Sans Variable": {
    load: async () => {
      await import("@fontsource-variable/ibm-plex-sans/index.css");
    },
  },
  "Plus Jakarta Sans Variable": {
    load: async () => {
      await import("@fontsource-variable/plus-jakarta-sans/index.css");
    },
  },
  "Google Sans Flex Variable": {
    load: async () => {
      await import("@fontsource-variable/google-sans-flex/full.css");
    },
  },
};

export const MONOSPACE_FONTS = {
  "JetBrains Mono": {
    load: () => {
      /* default */
    },
  },
  "Fira Code": {
    load: () => import("@fontsource/fira-code/400.css"),
  },
  "Roboto Mono": {
    load: () => import("@fontsource/roboto-mono/400.css"),
  },
  "Source Code Pro": {
    load: () => import("@fontsource/source-code-pro/400.css"),
  },
  "Space Mono": {
    load: () => import("@fontsource/space-mono/400.css"),
  },
  "Ubuntu Mono": {
    load: () => import("@fontsource/ubuntu-mono/400.css"),
  },
  "IBM Plex Mono": {
    load: () => import("@fontsource/ibm-plex-mono/400.css"),
  },
};

export type Fonts = keyof typeof FONTS;
export type MonospaceFonts = keyof typeof MONOSPACE_FONTS;

export const FONT_KEYS = Object.keys(FONTS).sort();
export const MONOSPACE_FONT_KEYS = Object.keys(MONOSPACE_FONTS).sort();

export const DEFAULT_FONT = "Open Sans";
export const DEFAULT_MONO_FONT = "Fira Code";
