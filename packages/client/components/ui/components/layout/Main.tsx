import { cva } from "styled-system/css";

/**
 * Styles for the main content of a page
 *
 * This creates a surface on the lowest level with appropriate padding and separation.
 */
export const main = cva({
  base: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,

    display: "flex",
    overflow: "hidden",
    flexDirection: "column",

    paddingInline: "var(--gap-md)",
    margin: "0 var(--gap-md) var(--gap-md) 0",
    borderRadius: "var(--borderRadius-xl)",
    background: "var(--md-sys-color-surface-container-lowest)",
    paddingBottom: "env(keyboard-inset-height)",

    _tablet: {
      margin: 0,
      borderRadius: "var(--borderRadius-xl) 0 0 0",
    },

    _phone: {
      margin: 0,
      borderRadius: 0,
    },
  },
});
