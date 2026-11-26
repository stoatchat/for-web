import { styled } from "styled-system/jsx";

/**
 * Dropdown element
 *
 * @deprecated Use FloatingSelect or Form2.Select instead
 */
export const ComboBox = styled("select", {
  base: {
    padding: "4px",
    height: "fit-content",

    fontWeight: 500,
    fontSize: "0.9375rem",
    fontFamily: "inherit",

    color: "var(--colours-component-combo-foreground)",
    background: "var(--colours-component-combo-background)",

    boxSizing: "border-box",
    borderRadius: "var(--borderRadius-md)",
    border: "2px solid var(--colours-component-combo-foreground)",

    outline: "none",
    cursor: "pointer",

    "&:focus-visible": {
      boxShadow: "0 0 0 1.5pt var(--colours-component-combo-focus)",
    },
  },
}); // TODO: re-do this and Input to work like Button
