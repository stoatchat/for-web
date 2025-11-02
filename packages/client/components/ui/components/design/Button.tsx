import { Show, createRenderEffect, on, splitProps } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { AriaButtonProps, createButton } from "@solid-aria/button";
import { cva } from "styled-system/css/cva";

import { Ripple } from "./Ripple";
import { typography } from "./Text";

type Props = Omit<
  Parameters<typeof button>[0] &
    AriaButtonProps &
    JSX.DirectiveAttributes &
    Pick<
      JSX.ButtonHTMLAttributes<HTMLButtonElement>,
      "role" | "tabIndex" | "aria-selected"
    >,
  "onClick" | "_permitAnimation" | "disabled"
> & {
  groupActive?: boolean;
  bg?: string;
};

/**
 * Buttons prompt most actions in a UI
 *
 * If you wish to create standard button groups:
 *
 * ```tsx
 * <Row>
 *   <Button
 *     onPress={() => setActiveA()}
 *     groupActive={activeA()}
 *     group="standard"
 *   >
 *     Button A
 *   </Button>
 *   <Button
 *     onPress={() => setActiveB()}
 *     groupActive={activeB()}
 *     group="standard"
 *   >
 *     Button B
 *   </Button>
 *   <Button
 *     onPress={() => setActiveC()}
 *     groupActive={activeC()}
 *     group="standard"
 *   >
 *     Button C
 *   </Button>
 * </Row>
 * ```
 *
 * If you wish to create connected button groups:
 *
 * ```tsx
 * <Row>
 *   <Button
 *     onPress={() => setActiveA()}
 *     groupActive={activeA()}
 *     group="connected-start"
 *   >
 *     Button A
 *   </Button>
 *   <Button
 *     onPress={() => setActiveB()}
 *     groupActive={activeB()}
 *     group="connected"
 *   >
 *     Button B
 *   </Button>
 *   <Button
 *     onPress={() => setActiveC()}
 *     groupActive={activeC()}
 *     group="connected-end"
 *   >
 *     Button C
 *   </Button>
 * </Row>
 * ```
 *
 * @specification https://m3.material.io/components/buttons
 */
export function Button(props: Props) {
  const [passthrough, propsRest] = splitProps(props, [
    "aria-selected",
    "tabIndex",
    "role",
  ]);

  const [style, rest] = splitProps(propsRest, [
    "bg",
    "size",
    "shape",
    "variant",
    "group",
    "groupActive",
  ]);
  let ref: HTMLButtonElement | undefined;

  const shape = () =>
    style.group
      ? style.groupActive !== (style.group === "standard")
        ? "round"
        : "square"
      : style.shape;

  const variant = () =>
    style.group ? (style.groupActive ? "filled" : "tonal") : style.variant;

  let _permitAnimation = false;
  createRenderEffect(
    on(
      () => shape(),
      () => (_permitAnimation = true),
      { defer: true },
    ),
  );

  const { buttonProps } = createButton(rest, () => ref);
  return (
    <button
      {...passthrough}
      {...buttonProps}
      ref={ref}
      class={button({
        shape: shape(),
        variant: variant(),
        size: style.size,
        group: style.group,
        disabled: buttonProps.disabled,
        _permitAnimation,
      })}
      style={{
        "background-color": style.bg,
      }}
      // @codegen directives props=rest include=floating
    >
      <Show when={!buttonProps.disabled}>
        <Ripple />
      </Show>
      {rest.children}
    </button>
  );
}

const button = cva({
  base: {
    ...typography.raw(),

    // for <Ripple />:
    position: "relative",

    paddingInline: "var(--padding-inline)",

    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontWeight: 500,
    fontFamily: "inherit",

    cursor: "pointer",
    border: "none",
    transition: "var(--transitions-medium) all",

    color: "var(--color)",
    fill: "var(--color)",
  },
  variants: {
    /**
     * Variant is equivalent to 'color' in Material spec
     */
    variant: {
      elevated: {
        boxShadow: "0 0.5px 1.5px #0004",
        background: "var(--md-sys-color-surface-container-low)",
        "--color": "var(--md-sys-color-primary)",
      },
      filled: {
        background: "var(--md-sys-color-primary)",
        "--color": "var(--md-sys-color-on-primary)",
      },
      tonal: {
        background: "var(--md-sys-color-secondary-container)",
        "--color": "var(--md-sys-color-on-secondary-container)",
      },
      outlined: {
        border: "1px solid var(--md-sys-color-outline-variant)",
        "--color": "var(--md-sys-color-on-surface-variant)",
      },
      text: {
        "--color": "var(--md-sys-color-primary)",
      },
      _error: {
        background: "var(--md-sys-color-error)",
        "--color": "var(--md-sys-color-on-error)",
      },

      // Old entries:

      /**
       * @deprecated
       */
      success: {
        fill: "var(--unset-fg)",
        color: "var(--unset-fg)",
        background: "var(--unset-bg)",
      },
      /**
       * @deprecated
       */
      warning: {
        fill: "var(--unset-fg)",
        color: "var(--unset-fg)",
        background: "var(--unset-bg)",
      },
      /**
       * @deprecated
       */
      error: {
        fill: "var(--unset-fg)",
        color: "var(--unset-fg)",
        background: "var(--unset-bg)",
      },
      /**
       * @deprecated use filled
       */
      primary: {
        fill: "var(--unset-fg)",
        color: "var(--unset-fg)",
        background: "var(--unset-bg)",
      },
      /**
       * @deprecated use tonal
       */
      secondary: {
        fill: "var(--unset-fg)",
        color: "var(--unset-fg)",
        background: "var(--unset-bg)",
      },
      /**
       * @deprecated use text instead
       */
      plain: {
        fill: "var(--unset-fg)",
        color: "var(--unset-fg)",
        background: "var(--unset-bg)",
      },
    },
    /**
     * Expressive shapes
     */
    shape: {
      round: {
        borderRadius: "var(--borderRadius-full)",
      },
      square: {},
    },
    /**
     * Expressive button groups
     */
    group: {
      "connected-start": {},
      "connected-end": {},
      connected: {},
      standard: {},
    },
    /**
     * Internal helper for expressive button animation
     */
    _permitAnimation: {
      true: {},
      false: {},
    },
    /**
     * Expressive sizes
     */
    size: {
      xs: {
        height: "32px",
        "--padding-inline": "12px",
      },
      sm: {
        height: "40px",
        "--padding-inline": "16px",
      },
      md: {
        height: "56px",
        "--padding-inline": "24px",
      },
      lg: {
        height: "96px",
        "--padding-inline": "48px",
      },
      xl: {
        height: "136px",
        "--padding-inline": "64px",
      },

      // Old code:
      icon: {
        width: "36px",
        height: "36px",
      },
      /**
       * @deprecated
       */
      small: {
        height: "40px",
        paddingInline: "16px",
        borderRadius: "12px",

        ...typography.raw(),
      },
      /**
       * @deprecated
       */
      normal: {
        height: "38px",
        minWidth: "96px",
        padding: "2px 16px",
        fontSize: "0.8125rem",
      },
      /**
       * @deprecated
       */
      fab: {
        width: "42px",
        height: "42px",
        borderRadius: "var(--borderRadius-lg)",
      },
      /**
       * @deprecated
       */
      fluid: {
        borderRadius: "var(--borderRadius-md)",
      },
      /**
       * @deprecated
       */
      inline: {
        padding: "var(--gap-xs) var(--gap-md)",
        fontSize: "0.8125rem",
        borderRadius: "var(--borderRadius-md)",
      },
      /**
       * @deprecated
       */
      none: {
        borderRadius: "0",
      },
    },
    /**
     * Whether the button is disabled
     */
    disabled: {
      true: {
        cursor: "not-allowed",
      },
      false: {},
    },
  },
  defaultVariants: {
    size: "sm",
    shape: "round",
    variant: "filled",
    disabled: false,
  },
  compoundVariants: [
    // disabled styles
    {
      variant: ["elevated", "filled", "tonal", "outlined"],
      disabled: true,
      css: {
        "--color":
          "color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent)",
        background:
          "color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)",
      },
    },
    {
      variant: "text",
      disabled: true,
      css: {
        "--color":
          "color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent)",
        background:
          "color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)",
      },
    },

    // border radius for different squared sizes
    {
      shape: "square",
      size: ["sm", "xs"],
      css: {
        borderRadius: "var(--borderRadius-md)",
      },
    },
    {
      shape: "square",
      size: "md",
      css: {
        borderRadius: "var(--borderRadius-lg)",
      },
    },
    {
      shape: "square",
      size: ["xl", "lg"],
      css: {
        borderRadius: "var(--borderRadius-xl)",
      },
    },

    // hard-code values for rounded connected group shapes
    {
      shape: "round",
      size: ["sm", "xs"],
      css: {
        borderRadius: "48px",
      },
    },
    {
      shape: "round",
      size: ["md"],
      css: {
        borderRadius: "64px",
      },
    },
    {
      shape: "round",
      size: ["xl", "lg"],
      css: {
        borderRadius: "160px",
      },
    },

    // left-side connected group
    {
      shape: "square",
      size: ["sm", "xs"],
      group: "connected-start",
      css: {
        borderRadius: "48px var(--borderRadius-md) var(--borderRadius-md) 48px",
      },
    },
    {
      shape: "square",
      size: "md",
      group: "connected-start",
      css: {
        borderRadius: "64px var(--borderRadius-lg) var(--borderRadius-lg) 64px",
      },
    },
    {
      shape: "square",
      size: ["xl", "lg"],
      group: "connected-start",
      css: {
        borderRadius:
          "160px var(--borderRadius-xl) var(--borderRadius-xl) 160px",
      },
    },

    // right-side connected group
    {
      shape: "square",
      size: ["sm", "xs"],
      group: "connected-end",
      css: {
        borderRadius: "var(--borderRadius-md) 48px 48px var(--borderRadius-md)",
      },
    },
    {
      shape: "square",
      size: "md",
      group: "connected-end",
      css: {
        borderRadius: "var(--borderRadius-lg) 64px 64px var(--borderRadius-lg)",
      },
    },
    {
      shape: "square",
      size: ["xl", "lg"],
      group: "connected-end",
      css: {
        borderRadius:
          "var(--borderRadius-xl) 160px 160px var(--borderRadius-xl)",
      },
    },

    // run animation when group activates
    // connected doesn't actually animate:
    // {
    //   shape: "round",
    //   group: ["connected-start", "connected-end", "connected"],
    //   _permitAnimation: true,
    //   css: {
    //     animationName: "materialPhysicsButtonSelect",
    //     animationDuration: "0.3s",
    //     animationFillMode: "forwards",
    //   },
    // },
    {
      shape: "square",
      group: ["standard"],
      _permitAnimation: true,
      css: {
        animationName: "materialPhysicsButtonSelect",
        animationDuration: "0.3s",
        animationFillMode: "forwards",
      },
    },
  ],
});
