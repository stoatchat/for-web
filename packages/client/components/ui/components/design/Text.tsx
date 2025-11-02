import { splitProps } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";

import { cva } from "styled-system/css";

/**
 * Simple span Text wrapper to apply Typography styles
 *
 * @specification https://m3.material.io/styles/typography/type-scale-tokens
 */
export function Text(
  props: Parameters<typeof typography>[0] & { children: JSX.Element },
) {
  const [local, remote] = splitProps(props, ["children"]);
  return <span class={typography(remote)}>{local.children}</span>;
}

/**
 * Apply styles for chosen typography
 *
 * @specification https://m3.material.io/styles/typography/type-scale-tokens
 */
export const typography = cva({
  variants: {
    class: {
      display: {},
      headline: {},
      title: {},
      body: {},
      label: {},

      _messages: {
        fontWeight: 400,
        fontSize: "var(--message-size)",
      },

      _status: {
        fontWeight: 400,
        fontSize: "11px",
      },
    },
    size: {
      large: {},
      medium: {},
      small: {},
    },
  },
  compoundVariants: [
    // Values derived from:
    // https://m3.material.io/styles/typography/type-scale-tokens
    // https://www.mdui.org/en/docs/2/styles/design-tokens
    {
      class: "display",
      size: "large",
      css: {
        lineHeight: "4rem",
        fontSize: "3.5625rem",
        letterSpacing: "0",
        fontWeight: 400,
      },
    },
    {
      class: "display",
      size: "medium",
      css: {
        lineHeight: "3.25rem",
        fontSize: "2.8125rem",
        letterSpacing: "0",
        fontWeight: 400,
      },
    },
    {
      class: "display",
      size: "small",
      css: {
        lineHeight: "2.75rem",
        fontSize: "2.25rem",
        letterSpacing: "0",
        fontWeight: 400,
      },
    },
    {
      class: "headline",
      size: "large",
      css: {
        lineHeight: "2.5rem",
        fontSize: "2rem",
        letterSpacing: "0",
        fontWeight: 400,
      },
    },
    {
      class: "headline",
      size: "medium",
      css: {
        lineHeight: "2.25rem",
        fontSize: "1.75rem",
        letterSpacing: "0",
        fontWeight: 400,
      },
    },
    {
      class: "headline",
      size: "small",
      css: {
        lineHeight: "2rem",
        fontSize: "1.5rem",
        letterSpacing: "0",
        fontWeight: 400,
      },
    },
    {
      class: "title",
      size: "large",
      css: {
        lineHeight: "1.75rem",
        fontSize: "1.375rem",
        letterSpacing: "0",
        fontWeight: 550,
      },
    },
    {
      class: "title",
      size: "medium",
      css: {
        lineHeight: "1.5rem",
        fontSize: "1rem",
        letterSpacing: "0.009375rem",
        fontWeight: 550,
      },
    },
    {
      class: "title",
      size: "small",
      css: {
        lineHeight: "1.25rem",
        fontSize: "0.875rem",
        letterSpacing: "0.00625rem",
        fontWeight: 550,
      },
    },
    {
      class: "body",
      size: "large",
      css: {
        lineHeight: "1.5rem",
        fontSize: "1rem",
        letterSpacing: "0.009375rem",
        fontWeight: 400,
      },
    },
    {
      class: "body",
      size: "medium",
      css: {
        lineHeight: "1.25rem",
        fontSize: "0.875rem",
        letterSpacing: "0.015625rem",
        fontWeight: 400,
      },
    },
    {
      class: "body",
      size: "small",
      css: {
        lineHeight: "1rem",
        fontSize: "0.75rem",
        letterSpacing: "0.025rem",
        fontWeight: 400,
      },
    },
    {
      class: "label",
      size: "large",
      css: {
        lineHeight: "1.25rem",
        fontSize: "0.875rem",
        letterSpacing: "0.00625rem",
        fontWeight: 500,
      },
    },
    {
      class: "label",
      size: "medium",
      css: {
        lineHeight: "1rem",
        fontSize: "0.75rem",
        letterSpacing: "0.03125rem",
        fontWeight: 500,
      },
    },
    {
      class: "label",
      size: "small",
      css: {
        lineHeight: "0.875rem",
        fontSize: "0.6875rem",
        letterSpacing: "0.03125rem",
        fontWeight: 500,
      },
    },
  ],
  defaultVariants: {
    class: "body",
    size: "medium",
  },
});
