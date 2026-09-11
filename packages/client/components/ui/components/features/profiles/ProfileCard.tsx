import { styled } from "styled-system/jsx";

export const ProfileCard = styled("div", {
  base: {
    // for <Ripple />:
    position: "relative",

    minWidth: 0,
    height: "100%",
    width: "100%",
    userSelect: "none",

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-low)",

    padding: "var(--gap-lg)",
    borderRadius: "var(--borderRadius-lg)",

    display: "flex",
    gap: "var(--gap-sm)",
    flexDirection: "column",

    transition:
      "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
  },
  variants: {
    width: {
      1: {
        overflow: "hidden",
        aspectRatio: "1/1",
      },
      2: {
        gridColumn: "1 / 3",
      },
      3: {
        gridColumn: "1 / 4",
      },
      /**
       * Full width, height fits content — for use outside of the profile
       * grid (e.g. the floating user card, which stacks sections).
       */
      full: {
        width: "100%",
        height: "auto",
        aspectRatio: "auto",
        padding: "0",
        gap: "var(--gap-xs)",
        background: "transparent",
        borderRadius: "0",
      },
    },
    constraint: {
      half: {
        overflow: "hidden",
        aspectRatio: "2/1",
      },
    },
    isLink: {
      true: {
        cursor: "pointer",
        _hover: {
          background: "var(--md-sys-color-surface-container)",
          boxShadow: "0 8px 20px -8px rgba(0, 0, 0, 0.45)",
          transform: "translateY(-2px)",
        },
      },
    },
  },
  compoundVariants: [
    {
      width: "full",
      isLink: true,
      css: {
        _hover: {
          background: "transparent",
          boxShadow: "none",
          transform: "none",
        },
      },
    },
  ],
  defaultVariants: {
    width: 1,
  },
});
