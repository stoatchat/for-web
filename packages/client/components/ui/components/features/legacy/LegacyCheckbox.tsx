import { BiRegularCheck } from "solid-icons/bi";
import { JSX, Show, createSignal, splitProps } from "solid-js";

import { styled } from "styled-system/jsx";

const Base = styled("label", {
  base: {
    gap: "var(--space-125)",
    padding: "4px",
    display: "flex",
    cursor: "pointer",
    userSelect: "none",
    alignItems: "center",
    borderRadius: "var(--borderRadius-md)",
    transition: "0.1s ease background-color",

    "& input": {
      display: "none",
    },

    "&:hover .check": {
      visibility: "visible",
      opacity: 1,
    },

    "& [disabled]": {
      opacity: 0.8,
      cursor: "not-allowed",
    },
  },
});

const Content = styled("div", {
  base: {
    flexDirection: "column",
    display: "flex",
    flexGrow: 1,
    gap: "var(--space-50)",
  },
});

const TitleContent = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-100)",
    color: "var(--colours-foreground)",
  },
});

const Title = styled("div", {
  base: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    display: "-webkit-box",
    // WebkitBoxOrient: "vertical",
    // WebkitLineClamp: 2,
    overflow: "hidden",
  },
});

const Description = styled("div", {
  base: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--foreground)",
    display: "-webkit-box",
    // WebkitBoxOrient: "vertical",
    // WebkitLineClamp: 3,
    overflow: "hidden",
  },
});

const Checkmark = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    border: "2px solid var(--foreground)",
    borderRadius: "var(--borderRadius-md)",
    flexShrink: 0,
    margin: "4px",
    transition: "0.1s ease-in-out all",

    "& .check": {
      transition: "inherit",
      color: "var(--foreground)",
      visibility: "hidden",
      opacity: 0,
    },
  },
  variants: {
    value: {
      true: {
        borderColor: "var(--foreground)",

        ".check": {
          visibility: "visible",
          opacity: 1,
          color: "var(--accent-contrast)",
        },
      },
    },
  },
});

type Props = {
  readonly disabled?: boolean;

  readonly title?: JSX.Element;
  readonly description?: JSX.Element;

  readonly name?: string;
  readonly value?: boolean;
  readonly onChange?: (state: boolean) => void;
} & Omit<
  JSX.LabelHTMLAttributes<HTMLLabelElement>,
  "value" | "children" | "onChange" | "title"
>;

/**
 * @deprecated Use Checkbox instead
 */
export function LegacyCheckbox(props: Props) {
  const [local, others] = splitProps(props, [
    "disabled",
    "title",
    "description",
    "name",
    "value",
    "onChange",
  ]);

  const [controlledValue, setControlledValue] = createSignal(false);
  const checked = () => local.value ?? controlledValue();

  return (
    <Base {...others}>
      <Content>
        <Show when={local.title}>
          <TitleContent>
            <Title>{local.title}</Title>
          </TitleContent>
        </Show>
        <Show when={local.description}>
          <Description>{local.description}</Description>
        </Show>
      </Content>
      <input
        name={local.name}
        type="checkbox"
        checked={checked()}
        onChange={() =>
          typeof local.value !== "undefined"
            ? !local.disabled && local.onChange?.(!local.value)
            : setControlledValue((v) => !v)
        }
      />
      <Checkmark value={checked()} class="checkmark">
        <BiRegularCheck size={20} class="check" />
      </Checkmark>
    </Base>
  );
}
