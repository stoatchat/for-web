import { BiRegularCheck, BiRegularX } from "solid-icons/bi";

import { styled } from "styled-system/jsx";

import { Ripple } from "./Ripple";

export const Switch = {
  Override: OverrideSwitch,
};

type State = "allow" | "neutral" | "deny";

interface Props {
  readonly value: State;
  readonly disabled?: boolean;
  readonly onChange: (state: State) => void;
}

/**
 * Override Switch
 */
function OverrideSwitch(props: Props) {
  return (
    <SwitchContainer
      role="radiogroup"
      aria-orientiation="horizontal"
      aria-disabled={props.disabled}
    >
      <Override
        type="allow"
        selected={props.value}
        onClick={() => !props.disabled && props.onChange("allow")}
        role="radio"
      >
        <Ripple />
        <BiRegularCheck size={24} />
      </Override>
      <Override
        type="neutral"
        selected={props.value}
        onClick={() => !props.disabled && props.onChange("neutral")}
        role="radio"
      >
        <Ripple />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24"
          width="24"
          viewBox="0 96 960 960"
        >
          <path d="M120 936v-60h60v60h-60Zm0-148v-83h60v83h-60Zm0-171v-83h60v83h-60Zm0-170v-83h60v83h-60Zm0-171v-60h60v60h-60Zm148 660v-60h83v60h-83Zm0-660v-60h83v60h-83Zm171 660v-60h83v60h-83Zm0-660v-60h83v60h-83Zm170 660v-60h83v60h-83Zm0-660v-60h83v60h-83Zm171 660v-60h60v60h-60Zm0-148v-83h60v83h-60Zm0-171v-83h60v83h-60Zm0-170v-83h60v83h-60Zm0-171v-60h60v60h-60Z" />
        </svg>
      </Override>
      <Override
        type="deny"
        selected={props.value}
        onClick={() => !props.disabled && props.onChange("deny")}
        role="radio"
      >
        <Ripple />
        <BiRegularX size={24} />
      </Override>
    </SwitchContainer>
  );
}

const SwitchContainer = styled("div", {
  base: {
    flexShrink: 0,
    width: "fit-content",
    // height: 'fit-content',

    display: "flex",
    margin: "4px 0",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    // "&[aria-disabled]": {
    //   pointerEvents: "none",
    //   opacity: 0.6,
    // },

    transition: "var(--transitions-fast) all",
    background: "var(--md-sys-color-surface-variant)",
  },
});

const Override = styled("div", {
  base: {
    // for <Ripple />:
    position: "relative",

    padding: "6px",
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    transition: "var(--transitions-fast) all",
    color: "var(--switch-fg, var(--md-sys-color-on-surface-variant))",
    fill: "var(--switch-fg, var(--md-sys-color-on-surface-variant))",
    background: "var(--switch-bg, transparent)",

    "&:hover": {
      // filter: "brightness(0.8)",
      background: "var(--switch-bg-hover, color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent))",
    },

    "& svg": {
      stroke: "5px solid red",
    },
  },
  variants: {
    selected: {
      allow: {},
      neutral: {},
      deny: {},
    },
    type: {
      allow: {},
      neutral: {},
      deny: {},
    },
  },
  compoundVariants: [
    {
      type: "allow",
      selected: "allow",
      css: {
        "--switch-fg": "var(--switch-on-success, #fff)",
        "--switch-bg": "var(--switch-success, #008545)",
        "--switch-bg-hover": "color-mix(in srgb, var(--switch-success, #008545), black 15%)",
      },
    },
    {
      type: "neutral",
      selected: "neutral",
      css: {
        "--switch-fg": "var(--md-sys-color-inverse-on-surface)",
        "--switch-bg": "var(--md-sys-color-inverse-surface)",
        "--switch-bg-hover": "color-mix(in srgb, var(--md-sys-color-inverse-surface), black 15%)",
      },
    },
    {
      type: "deny",
      selected: "deny",
      css: {
        "--switch-fg": "var(--switch-on-error, #fff)",
        "--switch-bg": "var(--switch-error, #D22D39)",
        "--switch-bg-hover": "color-mix(in srgb, var(--switch-error, #D22D39), black 15%)",
      },
    },
  ],
});
