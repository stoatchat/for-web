import { Show, splitProps } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { AriaButtonProps, createButton } from "@solid-aria/button";
import { cva } from "styled-system/css/cva";

import { Ripple } from "./Ripple";
import { typography } from "./Text";

type Props = Omit<
  Parameters<typeof iconButton2>[0] &
    AriaButtonProps &
    JSX.DirectiveAttributes &
    Pick<
      JSX.ButtonHTMLAttributes<HTMLButtonElement>,
      "role" | "tabIndex" | "aria-selected"
    >,
  "onClick" | "disabled"
>;

/**
 * Icon buttons help people take minor actions with one tap
 *
 * @specification https://m3.material.io/components/icon-buttons
 */
export function IconButton(props: Props) {
  const [passthrough, propsRest] = splitProps(props, [
    "aria-selected",
    "tabIndex",
    "role",
  ]);

  const [style, rest] = splitProps(propsRest, [
    "size",
    "shape",
    "width",
    "variant",
    "_compositionSendMessage",
  ]);
  let ref: HTMLButtonElement | undefined;

  const { buttonProps } = createButton(rest, () => ref);
  return (
    <button
      {...passthrough}
      {...buttonProps}
      ref={ref}
      class={iconButton2({
        ...style,
        disabled: buttonProps.disabled,
      })}
      // @codegen directives props=rest include=floating
    >
      <Show when={!buttonProps.disabled}>
        <Ripple />
      </Show>
      {rest.children}
    </button>
  );
}

const iconButton2 = cva({
  base: {
    ...typography.raw(),

    // for <Ripple />:
    position: "relative",

    // ensure it's always 1:1
    aspectRatio: "1/1",

    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontWeight: 500,
    fontFamily: "inherit",

    cursor: "pointer",
    border: "none",
    transition: "var(--transitions-fast) all",

    color: "var(--colour)",
    fill: "var(--colour)",
  },
  variants: {
    variant: {
      filled: {
        background: "var(--md-sys-color-primary)",
        "--colour": "var(--md-sys-color-on-primary)",
      },
      tonal: {
        background: "var(--md-sys-color-secondary-container)",
        "--colour": "var(--md-sys-color-on-secondary-container)",
      },
      outlined: {
        border: "1px solid var(--md-sys-color-outline-variant)",
        "--colour": "var(--md-sys-color-on-surface-variant)",
      },
      standard: {
        "--colour": "var(--md-sys-color-on-surface-variant)",
      },

      _header: {
        "--colour": "white",
      },
    },
    size: {
      xs: {
        height: "32px",
      },
      sm: {
        height: "40px",
      },
      md: {
        height: "56px",
      },
      lg: {
        height: "96px",
      },
      xl: {
        height: "136px",
      },
    },
    shape: {
      round: {
        borderRadius: "var(--borderRadius-full)",
      },
      square: {},
    },
    width: {
      narrow: {},
      default: {},
      wide: {},
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
    _compositionSendMessage: {
      true: {
        width: "48px",
        aspectRatio: "unset",
        height: "100% !important",
        borderEndRadius: "var(--borderRadius-xl)",
      },
    },
  },
  defaultVariants: {
    variant: "standard",
    width: "default",
    shape: "round",
    size: "sm",
    disabled: false,
    _compositionSendMessage: false,
  },
  compoundVariants: [
    // disabled styles
    {
      variant: ["filled", "tonal", "outlined"],
      disabled: true,
      css: {
        // todo: check these are correct
        "--color":
          "color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent)",
        background:
          "color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)",
      },
    },
    {
      variant: "standard",
      disabled: true,
      css: {
        // todo: check these are correct
        "--color":
          "color-mix(in srgb, 38% var(--md-sys-color-on-surface), transparent)",
        background:
          "color-mix(in srgb, 10% var(--md-sys-color-on-surface), transparent)",
      },
    },

    {
      size: ["xs", "sm"],
      width: "narrow",
      css: {
        paddingInline: "4px",
      },
    },
    {
      size: "xs",
      width: "default",
      css: {
        paddingInline: "6px",
      },
    },
    {
      size: "xs",
      width: "wide",
      css: {
        paddingInline: "10px",
      },
    },
    {
      size: "sm",
      width: "default",
      css: {
        paddingInline: "8px",
      },
    },
    {
      size: "sm",
      width: "wide",
      css: {
        paddingInline: "14px",
      },
    },
    {
      size: "md",
      width: "narrow",
      css: {
        paddingInline: "12px",
      },
    },
    {
      size: "md",
      width: "default",
      css: {
        paddingInline: "16px",
      },
    },
    {
      size: "md",
      width: "wide",
      css: {
        paddingInline: "24px",
      },
    },
    {
      size: "lg",
      width: "narrow",
      css: {
        paddingInline: "16px",
      },
    },
    {
      size: "lg",
      width: "default",
      css: {
        paddingInline: "32px",
      },
    },
    {
      size: "lg",
      width: "wide",
      css: {
        paddingInline: "48px",
      },
    },
    {
      size: "xl",
      width: "narrow",
      css: {
        paddingInline: "32px",
      },
    },
    {
      size: "xl",
      width: "default",
      css: {
        paddingInline: "48px",
      },
    },
    {
      size: "xl",
      width: "wide",
      css: {
        paddingInline: "72px",
      },
    },
    {
      size: ["xs", "sm"],
      shape: "square",
      css: {
        borderRadius: "var(--borderRadius-md)",
      },
    },
    {
      size: "md",
      shape: "square",
      css: {
        borderRadius: "var(--borderRadius-lg)",
      },
    },
    {
      size: ["lg", "xl"],
      shape: "square",
      css: {
        borderRadius: "var(--borderRadius-xl)",
      },
    },
  ],
});
