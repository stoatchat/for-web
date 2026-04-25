import {
  ComponentProps,
  For,
  JSX,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  splitProps,
} from "solid-js";

import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import MdChevronRight from "@material-design-icons/svg/outlined/chevron_right.svg?component-solid";
import MdContentCopy from "@material-design-icons/svg/outlined/content_copy.svg?component-solid";
import MdKeyboardDown from "@material-design-icons/svg/outlined/keyboard_arrow_down.svg?component-solid";
import MdOpenInNew from "@material-design-icons/svg/outlined/open_in_new.svg?component-solid";

import { OverflowingText, iconSize } from "../utils";

import { Radio2 } from "./Radio";
import { Ripple } from "./Ripple";
import { typography } from "./Text";

/**
 * Permissible actions
 */
type Action =
  | "chevron"
  | "collapse"
  | "external"
  | "edit"
  | "copy"
  | JSX.Element;

export interface Props {
  readonly icon?: JSX.Element | "blank";
  readonly children?: JSX.Element;
  readonly description?: JSX.Element;

  readonly disabled?: boolean;
  readonly onClick?: () => void;
  readonly action?: Action | Action[];

  readonly roundedIcon?: boolean;

  readonly variant?: "filled" | "tonal" | "tertiary" | "tertiaryAlt";
}

/**
 * Category Button
 */
export function CategoryButton(props: Props) {
  return (
    <Base
      variant={props.variant}
      isLink={!!props.onClick}
      disabled={props.disabled}
      aria-disabled={props.disabled}
      onClick={props.disabled ? undefined : props.onClick}
    >
      <Ripple />

      <Show when={props.icon !== "blank"}>
        <IconWrapper rounded={props.roundedIcon}>{props.icon}</IconWrapper>
      </Show>

      <Show when={props.icon === "blank"}>
        <BlankIconWrapper />
      </Show>

      <Content>
        <Show when={props.children}>
          <OverflowingText>{props.children}</OverflowingText>
        </Show>
        <Show when={props.description}>
          <Description>{props.description}</Description>
        </Show>
      </Content>
      <For each={Array.isArray(props.action) ? props.action : [props.action]}>
        {(action) => (
          <Switch fallback={action}>
            <Match when={action === "chevron"}>
              <Action>
                <MdChevronRight {...iconSize(18)} />
              </Action>
            </Match>
            <Match when={action === "collapse"}>
              <Action>
                <MdKeyboardDown {...iconSize(18)} />
              </Action>
            </Match>
            <Match when={action === "external"}>
              <Action>
                <MdOpenInNew {...iconSize(18)} />
              </Action>
            </Match>
            <Match when={action === "copy"}>
              <Action>
                <MdContentCopy {...iconSize(18)} />
              </Action>
            </Match>
          </Switch>
        )}
      </For>
    </Base>
  );
}

/**
 * Base container for button
 */
const Base = styled("a", {
  base: {
    // for <Ripple />:
    position: "relative",

    gap: "16px",
    padding: "13px",
    borderRadius: "var(--borderRadius-md)",

    userSelect: "none",
    cursor: "pointer",
    transition: "background-color 0.1s ease-in-out",

    display: "flex",
    alignItems: "center",
    flexDirection: "row",

    color: "var(--color)",
    fill: "var(--color)",
  },
  variants: {
    variant: {
      filled: {
        background: "var(--md-sys-color-primary)",
        "--color": "var(--md-sys-color-on-primary)",
      },
      tonal: {
        background: "var(--md-sys-color-secondary-container)",
        "--color": "var(--md-sys-color-on-secondary-container)",
      },
      tertiary: {
        background: "var(--md-sys-color-tertiary-container)",
        "--color": "var(--md-sys-color-on-tertiary-container)",
        "--mdui-color-primary": "var(--color)",
      },
      tertiaryAlt: {
        background: "var(--md-sys-color-tertiary)",
        "--color": "var(--md-sys-color-on-tertiary)",
        "--mdui-color-primary": "var(--color)",
      },
    },
    isLink: {
      true: {
        cursor: "pointer",
      },
      false: {
        cursor: "initial",
      },
    },
    disabled: {
      true: {
        cursor: "not-allowed",
      },
    },
  },
  defaultVariants: {
    variant: "tonal",
  },
});

/**
 * Title and description styles
 */
const Content = styled("div", {
  base: {
    display: "flex",
    flexGrow: 1,
    flexDirection: "column",

    fontWeight: 500,
    fontSize: "14px",
    gap: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

/**
 * Accented wrapper for the category button icons
 */
const IconWrapper = styled("div", {
  base: {
    fill: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-dim)",

    width: "36px",
    height: "36px",
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  variants: {
    rounded: {
      true: {
        borderRadius: "var(--borderRadius-full)",
      },
      false: {
        borderRadius: "var(--borderRadius-md)",
      },
    },
  },
  defaultVariants: {
    rounded: true,
  },
});

/**
 * Category button icon wrapper for the blank state
 */
const BlankIconWrapper = styled(IconWrapper, {
  base: {
    background: "transparent",
  },
});

/**
 * Description shown below title
 */
const Description = styled("span", {
  base: {
    ...typography.raw({ class: "label" }),

    textWrap: "wrap",

    "& a:hover": {
      textDecoration: "underline",
    },
  },
});

/**
 * Container for action icons
 */
const Action = styled("div", {
  base: {
    width: "24px",
    height: "24px",
    flexShrink: 0,

    display: "grid",
    placeItems: "center",
  },
});

/**
 * Group a set of category buttons
 */
CategoryButton.Group = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-xs)",

    borderRadius: "var(--borderRadius-xl)",
    overflow: "hidden",
  },
});

type CollapseProps = Omit<
  ComponentProps<typeof CategoryButton>,
  "onClick" | "children"
> & {
  children?: JSX.Element;
  title?: JSX.Element;

  scrollable?: boolean;
};

const MAX_HEIGHT = 340;

/**
 * Category button with collapsed children
 */
CategoryButton.Collapse = (props: CollapseProps) => {
  const [_, remote] = splitProps(props, ["action", "children"]);

  const [opened, setOpened] = createSignal(false);
  let column: HTMLDivElement | undefined;

  //Toggle the opened state and scroll to the beginning of contents
  const toggleOpened = () => {
    const open = !opened();
    if (open) column?.scroll({ top: 0 });
    setOpened(open);
  };

  //Recalculate the column height for transition
  const updatedHeight = createMemo(() => {
    const height = opened()
      ? Math.min(column?.scrollHeight || 0, MAX_HEIGHT)
      : 0;
    return `${height}px`;
  });

  return (
    <Details onClick={toggleOpened} class={opened() ? "open" : undefined}>
      <summary>
        <CategoryButton
          {...remote}
          action={[props.action, "collapse"].flat()}
          onClick={() => void 0}
        >
          {props.title}
        </CategoryButton>
      </summary>
      <Switch
        fallback={
          <div
            class={innerColumn({ static: true })}
            ref={column!}
            style={{ height: updatedHeight() }}
          >
            {props.children}
          </div>
        }
      >
        <Match when={props.scrollable}>
          <div
            ref={column!}
            style={{ height: updatedHeight() }}
            use:scrollable={{ class: innerColumn() }}
          >
            {props.children}
          </div>
        </Match>
      </Switch>
    </Details>
  );
};

export type CategorySelectOption = Omit<
  ComponentProps<typeof CategoryButton>,
  "onClick" | "children"
> &
  (
    | {
        title: JSX.Element;
        shortDesc?: JSX.Element;
      }
    | {
        title?: JSX.Element;
        shortDesc: JSX.Element;
      }
  );

type SelectProps<T extends string> = Omit<
  ComponentProps<typeof CategoryButton>,
  "onClick" | "children" | "description"
> & {
  title?: JSX.Element;
  options: { [k in T]: CategorySelectOption };
  value?: T;
  onUpdate: (v: T) => void;
};

/**
 * Select dropdown with options from a dictionary
 */
CategoryButton.Select = <T extends string>(props: SelectProps<T>) => {
  const [_, remote] = splitProps(props, [
    "action",
    "options",
    "value",
    "onUpdate",
  ]);

  const [opened, setOpened] = createSignal(false);
  let column: HTMLDivElement | undefined, lastVal: T;

  const opts = createMemo(() => Object.keys(props.options) as T[]);

  const [value, setValue] = createSignal(undefined as unknown as T);

  //Update if props.value changes, but don't run onUpdate
  createRenderEffect(() => {
    //@ts-expect-error Type check breaks
    setValue((lastVal = props.value ?? opts()[0]));
  });

  //Send user input to onUpdate
  createEffect(() => {
    const val = value();
    if (val !== lastVal) props.onUpdate((lastVal = val));
  });

  //Toggle the opened state and scroll to the beginning of contents
  const toggleOpened = () => {
    const open = !opened();
    if (open && column && column.scrollHeight > MAX_HEIGHT)
      column.children[opts().indexOf(value())]?.scrollIntoView();
    setOpened(open);
  };

  //Recalculate the column height for transition
  const updatedHeight = createMemo(() => {
    const height = opened()
      ? Math.min(column?.scrollHeight || 0, MAX_HEIGHT)
      : 0;
    return `${height}px`;
  });

  return (
    <Details onClick={toggleOpened} class={opened() ? "open" : undefined}>
      <summary>
        <CategoryButton
          {...remote}
          description={(() => {
            const opt = props.options[value()];
            if (opt) return opt.shortDesc ?? opt.description ?? opt.title;
          })()}
          action={[props.action, "collapse"].flat()}
          onClick={() => void 0}
        >
          {props.title}
        </CategoryButton>
      </summary>
      <div
        ref={column!}
        style={{ height: updatedHeight() }}
        use:scrollable={{ class: innerColumn() }}
      >
        <For each={opts()}>
          {(val) => (
            <CategoryButton
              icon="blank"
              variant={value() === val ? "tertiaryAlt" : "tertiary"}
              action={<Radio2.Option checked={value() === val} />}
              //@ts-expect-error Type check breaks
              onClick={() => setValue(val)}
              {...props.options[val]}
            >
              {props.options[val].title ?? props.options[val].shortDesc}
            </CategoryButton>
          )}
        </For>
      </div>
    </Details>
  );
};

/**
 * Column with inner content
 */
const innerColumn = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-xs)",

    borderRadius: "var(--borderRadius-md)",
    transition: "0.3s",

    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  variants: {
    static: {
      true: {
        overflow: "hidden",
      },
    },
  },
});

/**
 * Parent base component
 */
const Details = styled("div", {
  base: {
    "&:not(.open) .InnerColumn": {
      opacity: 0,
      pointerEvents: "none",
    },

    /* add transition to the icon */
    "& summary div:last-child svg": {
      transition: "0.3s",
    },

    /* rotate chevron when it is open */
    "&.open summary div:last-child svg": {
      transform: "rotate(180deg)",
    },

    /* add additional padding between top button and children when it is open */
    "&.open summary": {
      marginBottom: "var(--gap-xs)",
    },

    /* hide the default details component marker */
    "& summary": {
      transition: "0.3s",
      listStyle: "none",
    },

    "& summary::marker, summary::-webkit-details-marker": {
      display: "none",
    },

    /* connect elements vertically */
    // "& > :not(summary) .CategoryButton": {
    //   /* and set child backgrounds */
    //   background: "var(--unset-bg)",
    // },
  },
});
