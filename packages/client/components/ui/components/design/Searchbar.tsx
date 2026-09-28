import { JSX, Show } from "solid-js";

import { styled } from "styled-system/jsx";

export type Props = {
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  leadingIcon?: JSX.Element;
  autofocus?: boolean;
  ref?: (el: HTMLInputElement) => void;
};

/**
 * MD3-style search field
 */
export function Searchbar(props: Props) {
  return (
    <Container>
      <Show when={!!props.leadingIcon}>
        <IconSlot>{props.leadingIcon}</IconSlot>
      </Show>
      <Input
        ref={props.ref}
        autofocus={props.autofocus}
        value={props.value}
        placeholder={props.placeholder}
        onInput={(e) => props.onInput(e.currentTarget.value)}
      />
    </Container>
  );
}

const Container = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    height: "56px",
    padding: "0 16px",
    borderRadius: "var(--borderRadius-full)",
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-on-surface)",
  },
});

const IconSlot = styled("div", {
  base: {
    display: "flex",
    color: "var(--md-sys-color-on-surface-variant)",
    flexShrink: 0,
  },
});

const Input = styled("input", {
  base: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "inherit",
    fontSize: "1rem",
    "&::placeholder": {
      color: "var(--md-sys-color-on-surface-variant)",
    },
  },
});
