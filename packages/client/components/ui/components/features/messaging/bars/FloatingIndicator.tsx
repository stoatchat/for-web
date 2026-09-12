import { styled } from "styled-system/jsx";

import { typography } from "@revolt/ui/components/design";

/**
 * Common styles for the floating indicators
 */
export const FloatingIndicator = styled("div", {
  base: {
    // for <Ripple />:
    position: "relative",

    display: "flex",
    userSelect: "none",
    alignItems: "center",

    width: "100%",
    gap: "var(--space-100)",
    padding: "var(--space-100)",
    borderRadius: "var(--borderRadius-lg)",

    cursor: "pointer",
    backdropFilter: "var(--effects-blur-md)",

    ...typography.raw({ size: "small" }),

    fill: "var(--md-sys-color-on-primary)",
    color: "var(--md-sys-color-on-primary)",
    backgroundColor:
      "color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent)",

    animation: "slideIn 340ms cubic-bezier(0.2, 0.9, 0.5, 1.16) forwards",
  },
  variants: {
    position: {
      top: {
        "--translateY": "-33px",
      },
      bottom: {
        "--translateY": "33px",
      },
    },
  },
});
