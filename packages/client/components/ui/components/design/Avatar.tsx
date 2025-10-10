import { JSXElement, Show } from "solid-js";

import { styled } from "styled-system/jsx";

import { Initials } from "../utils";

import { Ripple } from "./Ripple";

export type Props = {
  /**
   * Avatar size
   */
  size?: number;

  /**
   * Avatar shape
   */
  shape?: "circle" | "rounded-square";

  /**
   * Image source
   */
  src?: string;

  /**
   * Fallback if no source
   */
  fallback?: string | JSXElement;

  /**
   * If this avatar falls back, use primary contrasting colours
   */
  primaryContrast?: boolean;

  /**
   * Punch a hole through the avatar
   */
  holepunch?:
    | "bottom-right"
    | "top-right"
    | "right"
    | "overlap"
    | "overlap-subtle"
    | "none"
    | false;

  /**
   * Specify overlay component
   */
  overlay?: JSXElement;

  /**
   * Whether this icon is interactive
   */
  interactive?: boolean;

  /**
   * Click handler
   */
  onClick?: (e: MouseEvent) => void;

  /**
   * HTML Web Component slot
   */
  slot?: string;
};

/**
 * Avatar image
 */
const Image = styled("img", {
  base: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

/**
 * Text fallback container
 */
const FallbackBase = styled("div", {
  base: {
    width: "100%",
    height: "100%",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontWeight: 600,
    fontSize: "0.75rem",
  },
  variants: {
    contrast: {
      true: {
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",
      },
      false: {
        fill: "var(--md-sys-color-on-surface)",
        color: "var(--md-sys-color-on-surface)",
        background: "var(--md-sys-color-surface-container-low)",
      },
    },
  },
  defaultVariants: {
    contrast: false,
  },
});

/**
 * Generic Avatar component
 *
 * Partially inspired by Adw.Avatar API, we allow users to specify a fallback component (usually just text) to display in case the URL is invalid.
 */
export function Avatar(props: Props) {
  return (
    <ParentBase
      // @ts-expect-error not typed for some reason
      slot={props.slot}
      style={{
        width: props.size + "px",
        height: props.size + "px",
      }}
      viewBox="0 0 32 32"
      interactive={props.interactive}
      onClick={props.onClick}
    >
      <ForeignObject
        x="0"
        y="0"
        width="32px"
        height="32px"
        holepunch={props.holepunch}
      >
        <Shape shape={props.shape}>
          <Show when={props.interactive}>
            <Ripple />
          </Show>
          <Show
            when={props.src}
            keyed
            fallback={
              <FallbackBase contrast={props.primaryContrast}>
                {typeof props.fallback === "string" ? (
                  <Initials input={props.fallback} maxLength={2} />
                ) : (
                  props.fallback
                )}
              </FallbackBase>
            }
          >
            <Image src={props.src} draggable={false} />
          </Show>
        </Shape>
      </ForeignObject>
      {props.overlay}
    </ParentBase>
  );
}

/**
 * Avatar parent container
 */
const ParentBase = styled("svg", {
  base: {
    flexShrink: 0,
    userSelect: "none",
    cursor: "inherit",
  },
  variants: {
    interactive: {
      true: {
        cursor: "pointer",
      },
      false: {},
    },
  },
  defaultVariants: {
    interactive: false,
  },
});

/**
 * Shape container (for Ripple support)
 */
const Shape = styled("div", {
  base: {
    overflow: "hidden",
    width: "100%",
    height: "100%",
  },
  variants: {
    shape: {
      circle: {
        borderRadius: "var(--borderRadius-circle)",
      },
      "rounded-square": {
        borderRadius: "var(--borderRadius-md)",
      },
    },
  },
  defaultVariants: {
    shape: "circle",
  },
});

/**
 * Inner SVG container
 */
const ForeignObject = styled("foreignObject", {
  base: {
    overflow: "hidden",
    transition: "var(--transitions-fast) filter",
  },
  variants: {
    holepunch: {
      "bottom-right": {
        mask: "url(#holepunch-bottom-right)",
      },
      "top-right": {
        mask: "url(#holepunch-top-right)",
      },
      right: {
        mask: "url(#holepunch-right)",
      },
      overlap: {
        mask: "url(#holepunch-overlap)",
      },
      "overlap-subtle": {
        mask: "url(#holepunch-overlap-subtle)",
      },
      none: {},
      false: {},
    },
  },
});
