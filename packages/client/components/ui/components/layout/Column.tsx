import { styled } from "styled-system/jsx";

/**
 * Column layout
 */
export const Column = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    flexGrow: "initial",
    margin: "0",
    alignItems: "initial",
    justifyContent: "initial",
  },
  variants: {
    grow: {
      true: {
        flexGrow: 1,
      },
    },
    group: {
      true: {
        margin: "16px 0",
      },
    },
    align: {
      true: {
        alignItems: "center",
      },
      stretch: {
        alignItems: "stretch",
      },
    },
    justify: {
      true: {
        justifyContent: "center",
      },
      stretch: {
        justifyContent: "stretch",
      },
    },
    gap: {
      xs: { gap: "var(--space-25)" },
      s: { gap: "var(--space-75)" },
      sm: { gap: "var(--space-50)" },
      md: { gap: "var(--space-100)" },
      lg: { gap: "var(--space-200)" },
      xl: { gap: "var(--space-400)" },
      none: {},
    },
  },
  defaultVariants: {
    gap: "md",
  },
});
