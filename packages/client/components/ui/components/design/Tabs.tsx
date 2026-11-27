import { Component, createSignal, For, JSX, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { css, cva } from "styled-system/css";
import { typography } from "./Text";

type ID = string;

type TabOptions = {
  title: string;
  children: Component;

  hidden?: boolean;
  icon?: JSX.Element;
};

/**
 * Tabs organize content across different screens and views
 *
 * @specification https://m3.material.io/components/tabs
 */
export function TabGroup<T extends Record<ID, TabOptions>>(props: {
  /** Initial starting view */
  startingAt?: keyof T;
  type?: "primary" | "secondary";
  pages: T;
}) {
  const availablePages = () =>
    Object.fromEntries(
      Object.entries(props.pages).filter(([_, p]) => !p.hidden),
    );
  const initialPage = () => {
    const pageIDs: ID[] = Object.keys(availablePages());
    if (props.startingAt && pageIDs.includes(props.startingAt as ID)) {
      return props.startingAt;
    }

    return pageIDs[0] ?? "";
  };
  const [currentPage, setCurrentPage] = createSignal<keyof T>(initialPage());
  const tabType = () => props.type ?? "primary";

  return (
    <div
      class={css({
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      })}
    >
      <Show when={Object.keys(availablePages()).length > 1}>
        <nav>
          <ul
            class={css({
              display: "inline-flex",
              justifyContent: "stretch",
              width: "100%",
              backgroundColor: "var(--md-sys-color-surface)",
            })}
          >
            <For each={Object.entries(props.pages)}>
              {([id, page]) => (
                <Show when={!page.hidden}>
                  <Tab
                    type={tabType()}
                    title={page.title}
                    icon={page.icon}
                    active={currentPage() === id}
                    onPress={() => setCurrentPage(id)}
                  />
                </Show>
              )}
            </For>
          </ul>
        </nav>
      </Show>{" "}
      <div class={groupSurface()}>
        <Dynamic
          component={
            props.pages[currentPage() as keyof typeof props.pages]!.children
          }
        />
      </div>{" "}
    </div>
  );
}

function Tab(props: {
  title: string;
  type: "primary" | "secondary";
  active?: boolean;
  icon?: JSX.Element;
  onPress?: () => void;
}) {
  return (
    <li
      class={tabContainer({
        active: props.active,
        hasIcon: !!props.icon,
        type: props.type,
      })}
      data-title={props.title}
      // eslint-disable-next-line solid/reactivity
      onClick={props.onPress}
    >
      <md-ripple />
      <Show when={props.icon}>{props.icon}</Show>
      <span class={typography({ class: "title", size: "small" })}>
        {props.title}
      </span>
    </li>
  );
}

const groupSurface = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    padding: "var(--gap-md) 0 0 0",
    overflow: "hidden",
    width: "100%",
    minHeight: "0",
    height: "100%",
  },
});

const tabContainer = cva({
  base: {
    "&::after": {
      position: "absolute",
      bottom: 0,
      display: "block",
      content: "attr(data-title)",
      width: "100%",
      minWidth: "24px",
      height: "3px",
      borderRadius: "var(--borderRadius-full) var(--borderRadius-full) 0 0",
      color: "transparent",
      whiteSpace: "nowrap",
      opacity: 0,
      transform: "scaleX(0)",
      transformOrigin: "center",
      transition: "transform 180ms ease, opacity 180ms ease",
    },
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "3rem",
    paddingBottom: "2px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
  variants: {
    hasIcon: {
      true: {
        height: "4rem",
      },
    },
    type: {
      primary: {
        "&::after": {
          left: "50%",
          width: "max-content",
          minWidth: "0",
          transform: "translateX(-50%) scaleX(var(--indicator-scale, 0))",
        },
      },
      secondary: {
        "&::after": {
          content: "''",
          left: 0,
          width: "100%",
          height: "2px",
          transform: "scaleX(var(--indicator-scale, 0))",
          borderRadius: "unsert",
        },
      },
    },
    active: {
      true: {
        "&::after": {
          backgroundColor: "var(--md-sys-color-primary)",
          opacity: 1,
          "--indicator-scale": 1,
        },
        color: "var(--md-sys-color-primary)",
      },
    },
  },
  defaultVariants: {
    type: "primary",
  },
});
