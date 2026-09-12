import { styled } from "styled-system/jsx";

/**
 * Row layout
 */
export const Row = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    flexGrow: "initial",
    flexWrap: "initial",
    gap: "var(--space-100)",
    alignItems: "initial",
    justifyContent: "initial",
  },
  variants: {
    grow: {
      true: {
        flexGrow: 1,
      },
    },
    wrap: {
      true: {
        flexWrap: "wrap",
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
        "& *": {
          flex: 1,
        },
      },
    },
    gap: {
      xs: { gap: "var(--space-25)" },
      sm: { gap: "var(--space-50)" },
      md: { gap: "var(--space-100)" },
      lg: { gap: "var(--space-200)" },
      xl: { gap: "var(--space-400)" },
      none: { gap: "unset" },
    },
    minWidth: {
      0: {
        minWidth: 0,
      },
    },
  },
});
