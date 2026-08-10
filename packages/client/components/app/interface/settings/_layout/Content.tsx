import { Accessor, JSX, Setter, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";

import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { Breadcrumbs, IconButton, Text } from "@revolt/ui";

import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";

import { SettingsList } from "..";
import { useSettingsNavigation } from "../Settings";

/**
 * Content portion of the settings menu
 */
export function SettingsContent(props: {
  onClose?: () => void;
  children: JSX.Element;
  list: Accessor<SettingsList<unknown>>;
  title: (ctx: SettingsList<never>, key: string) => string;
  page: Accessor<string | undefined>;
  ref: Setter<HTMLDivElement | undefined>;
  action: Accessor<(() => JSX.Element) | undefined>;
}) {
  const { navigate } = useSettingsNavigation();
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div ref={props.ref} use:scrollable={{ class: base }}>
      <Show when={props.page()}>
        <InnerContent class="settings_cont">
          <InnerColumn>
            <Show when={props.page() !== "account"}>
              <Text class="title" size="large">
                <Breadcrumbs
                  elements={props.page()!.split("/")}
                  renderElement={(key) =>
                    props.title(props.list() as SettingsList<never>, key)
                  }
                  navigate={(keys) => navigate(keys.join("/"))}
                />
              </Text>
            </Show>
            {props.children}
            <div class={css({ minHeight: "80px" })} />
          </InnerColumn>
        </InnerContent>
      </Show>
      <ActionRail>
        <Show when={props.onClose}>
          <CloseAction class="close">
            <IconButton variant="tonal" onPress={props.onClose}>
              <MdClose />
            </IconButton>
          </CloseAction>
        </Show>
        <FloatingActions>
          <Presence>
            <Show when={props.action()} keyed>
              {(renderAction) => (
                <Motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: {
                      duration: reduceMotion ? 0 : 0.2,
                      easing: [0.3, 0, 0.8, 0.15],
                    },
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.3,
                    easing: [0.05, 0.7, 0.1, 1],
                  }}
                  style={{ "transform-origin": "center" }}
                >
                  {renderAction()}
                </Motion.div>
              )}
            </Show>
          </Presence>
        </FloatingActions>
      </ActionRail>
    </div>
  );
}

/**
 * Base styles
 */
const base = css({
  minWidth: 0,
  flex: "1 1 800px",
  flexDirection: "row",
  display: "flex",
  background: "var(--md-sys-color-surface-container-low)",
  borderStartStartRadius: "30px",
  borderEndStartRadius: "30px",

  "& > a": {
    textDecoration: "none",
  },

  _phone: {
    borderRadius: 0,
  },

  _tablet: {
    // prevent the fixed action rail from scroll with this element instead of the viewport
    willChange: "auto !important",
  },
});

/**
 * Settings pane
 */
const InnerContent = styled("div", {
  base: {
    gap: "13px",
    minWidth: 0,
    width: "100%",
    display: "flex",
    maxWidth: "740px",
    padding: "80px 32px",
    justifyContent: "stretch",
    zIndex: 1,

    _tablet: { padding: "12px" },
    _phone: { height: "100vh" },
  },
});

/**
 * Pane content column
 */
const InnerColumn = styled("div", {
  base: {
    width: "100%",
    gap: "var(--gap-md)",
    display: "flex",
    flexDirection: "column",
    marginBlockEnd: "80px",
  },
});

/**
 * Viewport-height rail for settings controls
 */
const ActionRail = styled("div", {
  base: {
    height: "100vh",
    minWidth: "56px",
    padding: "80px 8px calc(var(--gap-xl) + env(safe-area-inset-bottom))",

    zIndex: 2,
    flexGrow: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,

    _tablet: {
      position: "fixed",
      insetInlineEnd: 0,
      height: "100dvh",
      padding: "12px",
      paddingBlockEnd: "calc(12px + env(safe-area-inset-bottom))",
      alignItems: "flex-end",
      justifyContent: "flex-end",
      pointerEvents: "none",

      "& > *": {
        pointerEvents: "auto",
      },
    },
  },
});

/**
 * Bottom-end anchor for actions belonging to the current settings page
 */
const FloatingActions = styled("div", {
  base: {
    height: "fit-content",
  },
});

/**
 * Positioning for close button
 */
const CloseAction = styled("div", {
  base: {
    visibility: "visible",

    "&:after": {
      content: '"ESC"',
      marginTop: "4px",
      display: "flex",
      justifyContent: "center",
      width: "40px",
      fontWeight: 600,
      color: "var(--md-sys-color-on-surface)",
      fontSize: "0.75rem",
    },

    _tablet: {
      display: "none",
    },
  },
});
