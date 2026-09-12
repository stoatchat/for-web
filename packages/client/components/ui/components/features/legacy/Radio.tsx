import { FaSolidCircle as CircleIcon } from "solid-icons/fa";
import { JSX, Show, createSignal, splitProps } from "solid-js";

import { styled } from "styled-system/jsx";

interface Props {
  title?: JSX.Element;
  description?: JSX.Element;
  disabled?: boolean;
  value?: boolean;
  onSelect?: (state: boolean) => void;
}

const Base = styled("label", {
  base: {
    border: "2px solid var(--foreground)",
    padding: "10px",
    gap: "var(--space-125)",
    display: "flex",
    cursor: "pointer",
    userSelect: "none",
    transition: "var(--transitions-fast)",
    borderRadius: "var(--borderRadius-md)",

    "& input": {
      display: "none",
    },

    "&:hover svg": {
      visibility: "visible",
      opacity: 1,
    },
  },
  variants: {
    selected: {
      true: {
        color: "var(--foreground)",
        cursor: "default",

        div: {
          svg: {
            color: "var(--foreground)",
            visibility: "visible",
            opacity: 1,
          },
        },
      },
    },
  },
});

const RadioCircle = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "var(--borderRadius-lg)",
    height: "20px",
    width: "20px",
    transition: "inherit",

    "& svg": {
      transition: "inherit",
      color: "var(--foreground)",
      flexShrink: 0,
      visibility: "hidden",
      opacity: 0,
    },
  },
});

const Content = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    wordBreak: "break-word",
    transition: "inherit",
  },
});

const Title = styled("div", {
  base: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--colours-foreground)",
    transition: "inherit",

    lineClamp: 2,
    overflow: "hidden",
  },
  variants: {
    selected: {
      true: {
        color: "var(--foreground)",
      },
    },
  },
});

const Description = styled("div", {
  base: {
    fontSize: "0.6875rem",
    fontWeight: 500,
    color: "var(--foreground)",
    transition: "inherit",

    lineClamp: 3,
    overflow: "hidden",
  },
  variants: {
    selected: {
      true: {
        color: "var(--foreground)",
      },
    },
  },
});

/**
 * @deprecated no alternative yet
 */
export function Radio(props: Props) {
  const [local, others] = splitProps(props, [
    "disabled",
    "title",
    "description",
    "value",
    "onSelect",
  ]);

  const [controlledValue, setControlledValue] = createSignal(false);
  const selected = () => local.value ?? controlledValue();

  return (
    <Base {...others} selected={selected()}>
      <RadioCircle>
        <CircleIcon size={12} />
      </RadioCircle>
      <input
        type="radio"
        checked={selected()}
        onChange={() =>
          typeof local.value !== "undefined"
            ? !local.disabled && local.onSelect?.(!local.value)
            : setControlledValue((v) => !v)
        }
      />
      <Content>
        <Show when={props.title}>
          <Title selected={selected()}>{props.title}</Title>
        </Show>
        <Show when={props.description}>
          <Description selected={selected()}>{props.description}</Description>
        </Show>
      </Content>
    </Base>
  );
}
