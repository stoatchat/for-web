import { styled } from "styled-system/jsx";

export interface Props {
  readonly placement: "primary" | "secondary";

  readonly topBorder?: boolean;
  readonly bottomBorder?: boolean;
}

/**
 * Header component
 */
export const Header = styled("div", {
  base: {
    gap: "10px",
    flex: "0 auto",
    display: "flex",
    flexShrink: 0,
    padding: "0 16px",
    alignItems: "center",
    fontWeight: 600,
    userSelect: "none",
    overflow: "hidden",
    height: "48px",
    borderRadius: "var(--borderRadius-lg)",

    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",

    backgroundSize: "cover !important",
    backgroundPosition: "center !important",
    "& svg": {
      flexShrink: 0,
    },

    _tablet: {
      paddingRight: 0,
    },
  },
  variants: {
    placement: {
      primary: {
        margin: "var(--gap-md) var(--gap-md) var(--gap-md) 0",
      },
      secondary: {
        margin: "var(--gap-md)",
        backgroundColor: "var(--md-sys-color-surface-variant)",
      },
    },
    image: {
      true: {
        color: "white",
        fill: "white",

        padding: 0,
        alignItems: "flex-end",
        justifyContent: "stretch",
        textShadow: "0px 0px 1px var(--md-sys-color-shadow)",
        height: "120px",

        "& > div": {
          flexGrow: 1,
          padding: "6px 14px",
          background: "linear-gradient(0deg, black, transparent)",
        },
      },
      false: {},
    },
    transparent: {
      true: {
        width: "calc(100% - var(--gap-md))",
        zIndex: "10",
      },
      false: {},
    },
  },
  defaultVariants: {
    placement: "primary",
    image: false,
    transparent: false,
  },
});

/**
 * Position an element below a floating header
 *
 * Ensure you place a div inside to make the positioning work
 */
export const BelowFloatingHeader = styled("div", {
  base: {
    position: "relative",
    zIndex: "10",

    // i guess this works, probably refactor this later
    "& > div > div": {
      width: "100%",
      position: "absolute",
      top: "var(--gap-md)",
    },
  },
});
