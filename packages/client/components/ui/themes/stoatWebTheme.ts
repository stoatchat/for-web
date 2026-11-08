import { SelectedTheme } from "@revolt/state/stores/Theme";

/**
 * Generate Stoat for Web variables
 * @param theme Theme
 * @returns CSS Variables
 */
export function createStoatWebVariables(theme: SelectedTheme) {
  return {
    // helper variables
    "--unset-fg": "red",
    "--unset-bg": "linear-gradient(to right, red, blue)",

    // message size
    "--message-size": `${theme.messageSize}px`,
    "--message-group-spacing": `${theme.messageGroupSpacing}px`,

    // emoji size
    "--emoji-size": "1.4em",
    "--emoji-size-medium": "48px",
    "--emoji-size-large": "96px",

    // effects
    "--effects-blur-md": theme.blur ? "blur(20px)" : "unset",
    "--effects-invert-black": theme.darkMode ? "invert(100%)" : "invert(0%)",
    "--effects-invert-light": theme.darkMode ? "invert(0%)" : "invert(1000%)",

    // transitions
    "--transitions-fast": ".1s ease-in-out",
    "--transitions-medium": ".2s ease",

    // brand
    "--brand-presence-online": "#3ABF7E",
    "--brand-presence-idle": "#F39F00",
    "--brand-presence-busy": "#F84848",
    "--brand-presence-focus": "#4799F0",
    "--brand-presence-invisible": "#A5A5A5",

    // font
    "--fonts-primary": `"${theme.interfaceFont}", "Inter", sans-serif`,
    "--fonts-monospace": `"${theme.monospaceFont}", "Jetbrains Mono", sans-serif`,

    // load constants
    ...reduceWithPrefix(themeConstants.borderRadius, "--borderRadius-"),
    ...reduceWithPrefix(themeConstants.gap, "--gap-"),
    ...reduceWithPrefix(themeConstants.layout, "--layout-"),
    ...reduceWithPrefix(themeConstants.elevation, "--md-sys-elevation-"),
  };
}

/**
 * Add prefix to all keys in an object
 * @param object Object
 * @param prefix Prefix
 * @returns New object
 */
function reduceWithPrefix(object: Record<string, string>, prefix: string) {
  return Object.entries(object).reduce(
    (d, [k, v]) => ({ ...d, [`${prefix}${k}`]: v }),
    {},
  );
}

const themeConstants = {
  borderRadius: {
    // Material 3 Expressive ten-level shape scale
    // https://m3.material.io/styles/shape/corner-radius-scale
    none: "0px",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    li: "20px",
    xl: "28px",
    xli: "32px",
    xxl: "48px",
    full: "calc(infinity * 1px)",
    circle: "100%",
  },
  /**
   * @deprecated decide this at a component level
   */
  gap: {
    none: "0",
    xxs: "1px",
    xs: "2px",
    s: "6px",
    sm: "4px",
    md: "8px",
    l: "12px",
    lg: "15px",
    x: "28px",
    xl: "32px",
    xxl: "64px",
  },
  /**
   * Material shadow elevation tokens
   *
   * {@link https://m3.material.io/styles/elevation/applying-elevation}
   */
  elevation: {
    0: "unset",
    1: "rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 2px 1px -1px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 1px 1px 0px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 1px 3px 0px",
    2: "rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 3px 3px -2px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 3px 4px 0px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 1px 8px 0px",
    3: "rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 3px 5px -1px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 6px 10px 0px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 1px 18px 0px",
    4: "rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 5px 5px -3px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 8px 10px 1px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 3px 14px 2px",
    5: "rgba(from var(--md-sys-color-shadow) r g b / 0.2) 0px 7px 8px -4px, rgba(from var(--md-sys-color-shadow) r g b / 0.14) 0px 12px 17px 2px, rgba(from var(--md-sys-color-shadow) r g b / 0.12) 0px 5px 22px 4px",
  },
  layout: {
    "width-channel-sidebar": "248px",
    "width-user-context-menu-truncate": "300px",
    "height-message-box": "32vh",
  },
};
