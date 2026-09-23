import { Symbol } from "../utils/Symbol";

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
        <Symbol size={20}>check</Symbol>
      </Override>
      <Override
        type="neutral"
        selected={props.value}
        onClick={() => !props.disabled && props.onChange("neutral")}
        role="radio"
      >
        <Ripple />
        <Symbol size={20}>remove</Symbol>
      </Override>
      <Override
        type="deny"
        selected={props.value}
        onClick={() => !props.disabled && props.onChange("deny")}
        role="radio"
      >
        <Ripple />
        <Symbol size={20}>close</Symbol>
      </Override>
    </SwitchContainer>
  );
}

const SwitchContainer = styled("div", {
  base: {
    flexShrink: 0,
    display: "inline-flex",
    margin: "4px 0",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-md)",

    // "&[aria-disabled]": {
    //   pointerEvents: "none",
    //   opacity: 0.6,
    // },

    transition: "var(--transitions-fast) all",
    background: "var(--md-sys-color-primary-container)",
  },
});

const Override = styled("div", {
  base: {
    // for <Ripple />:
    position: "relative",

    width: "36px",
    height: "36px",
    flex: "0 0 36px",
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    transition: "var(--transitions-fast) all",
    background: "var(--md-sys-color-surface-container-high)",

    "&:hover": {
      // filter: "brightness(0.8)",
    },

    "& > span": {
      lineHeight: 1,
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
        color: "var(--md-sys-color-primary-container)",
        background: "var(--md-sys-color-on-primary-container)",
      },
    },
    {
      type: "neutral",
      selected: "neutral",
      css: {
        fill: "var(--md-sys-color-secondary)",
        background: "var(--md-sys-color-on-secondary)",
      },
    },
    {
      type: "deny",
      selected: "deny",
      css: {
        color: "var(--md-sys-color-error-container)",
        background: "var(--md-sys-color-on-error-container)",
      },
    },
  ],
});
