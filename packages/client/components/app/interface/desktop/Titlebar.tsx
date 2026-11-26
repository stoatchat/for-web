import {
  createSignal,
  JSX,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { Motion, Presence } from "solid-motionone";

import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { Button, Ripple, Symbol, typography } from "@revolt/ui";

import Wordmark from "../../../../public/assets/web/wordmark.svg?component-solid";
import { pendingUpdate } from "../../../../src/serviceWorkerInterface";

const isMacOS = navigator.platform.startsWith("Mac");
const isNative = !!window.native;

const noDrag = {
  "app-region": "no-drag",
  "-webkit-app-region": "no-drag",
} as JSX.CSSProperties;

const wcoStyle = {
  position: "fixed",
  left: "env(titlebar-area-x, 0px)",
  top: "env(titlebar-area-y, 0px)",
  width: "env(titlebar-area-width, 100%)",
  height: "env(titlebar-area-height, 29px)",
  zIndex: "9999",
  "app-region": "drag",
  "-webkit-app-region": "drag",
} as JSX.CSSProperties;

const DISCONNECTED_STATES = new Set([
  State.Connecting,
  State.Disconnected,
  State.Reconnecting,
  State.Offline,
]);

function isDisconnected(state: State) {
  return DISCONNECTED_STATES.has(state);
}

function Bar(props: { pwa: boolean }) {
  const { lifecycle } = useClientLifecycle();

  const [isMaximised, setIsMaximised] = createSignal(
    isNative
      ? (window.desktopConfig.get()?.windowState?.isMaximised ?? false)
      : false,
  );

  function maximise() {
    window.native.maximise();
    setIsMaximised((t) => !t);
  }

  const ReconnectLink = () => (
    <a
      onClick={() =>
        lifecycle.transition({
          type: TransitionType.Retry,
        })
      }
      style={noDrag}
    >
      <strong> (reconnect now)</strong>
    </a>
  );

  return (
    <Base disconnected={isDisconnected(lifecycle.state())} pwa={props.pwa}>
      <Title
        macos={isMacOS}
        style={{
          "-webkit-user-select": "none",
          "-webkit-app-region": "drag",
        }}
      >
        <Wordmark
          class={css({
            height: "18px",
            marginBlockStart: "1px",
          })}
        />{" "}
        <Show when={import.meta.env.DEV}>
          <Symbol size={16}>build</Symbol>
        </Show>
      </Title>
      <DragHandle
        macos={isMacOS && isNative}
        style={{
          "-webkit-user-select": "none",
          "-webkit-app-region": "drag",
        }}
      >
        <Switch>
          <Match when={lifecycle.state() === State.Connecting}>
            Connecting
          </Match>
          {/* <Match when={lifecycle.state() === State.Connected}>Connected</Match> */}
          <Match when={lifecycle.state() === State.Disconnected}>
            Disconnected
            <ReconnectLink />
          </Match>
          <Match when={lifecycle.state() === State.Reconnecting}>
            Reconnecting
          </Match>
          <Match when={lifecycle.state() === State.Offline}>
            Device is offline
            <ReconnectLink />
          </Match>
        </Switch>
        <Show when={pendingUpdate()}>
          {" "}
          <div style={noDrag}>
            <Button size="sm" onPress={pendingUpdate()}>
              Update
            </Button>
          </div>
        </Show>
      </DragHandle>
      <Show when={isNative && !isMacOS}>
        <Action onClick={window.native.minimise}>
          <Ripple />
          <Symbol size={20}>minimize</Symbol>
        </Action>
        <Action onClick={maximise}>
          <Ripple />
          <Show
            when={isMaximised()}
            fallback={<Symbol size={20}>expand_content</Symbol>}
          >
            <Symbol size={20}>collapse_content</Symbol>
          </Show>
        </Action>
        <Action onClick={window.native.close}>
          <Ripple />
          <Symbol size={20}>close</Symbol>
        </Action>
      </Show>
    </Base>
  );
}

export function Titlebar() {
  const [isWCO, setIsWCO] = createSignal(
    matchMedia("(display-mode: window-controls-overlay)").matches,
  );

  const { lifecycle } = useClientLifecycle();

  onMount(() => {
    const query = matchMedia("(display-mode: window-controls-overlay)");
    const update = () => setIsWCO(query.matches);
    query.addEventListener("change", update);
    onCleanup(() => query.removeEventListener("change", update));
  });

  return (
    <Presence>
      <Show
        when={
          isWCO() ||
          (isNative && window.desktopConfig?.get()?.customFrame) ||
          isDisconnected(lifecycle.state())
        }
      >
        <Show
          when={isWCO()}
          fallback={
            <Motion.div
              initial={{ height: 0 }}
              animate={{ height: "29px" }}
              exit={{ height: 0 }}
            >
              <Bar pwa={false} />
            </Motion.div>
          }
        >
          <div style={wcoStyle}>
            <Bar pwa={true} />
          </div>
        </Show>
      </Show>
    </Presence>
  );
}

const Base = styled("div", {
  base: {
    flexShrink: 0,
    height: "29px",
    userSelect: "none",

    display: "flex",
    alignItems: "center",

    fill: "var(--md-sys-color-on-surface)",
    background:
      "var(--stoat-titlebar-color, var(--md-sys-color-surface-container-high))",
  },
  variants: {
    disconnected: {
      true: {
        color: "var(--md-sys-color-on-primary-container)",
        background:
          "var(--stoat-titlebar-color, var(--md-sys-color-primary-container))",
      },
      false: {
        color: "var(--md-sys-color-outline)",
      },
    },
    pwa: {
      true: {
        height: "100%",
      },
    },
  },
});

const Title = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    alignItems: "center",
    paddingInlineStart: "var(--gap-md)",

    color: "var(--md-sys-color-on-surface)",
    ...typography.raw({ class: "title", size: "small" }),
  },
  variants: {
    macos: {
      true: {
        order: 1,
        paddingInlineEnd: "var(--gap-md)",
      },
    },
  },
});

const DragHandle = styled("div", {
  base: {
    flexGrow: 1,
    height: "100%",

    display: "flex",
    gap: "var(--gap-md)",
    alignItems: "center",
    paddingInlineStart: "var(--gap-md)",

    ...typography.raw({ class: "label", size: "large" }),
  },
  variants: {
    macos: {
      true: {
        marginInlineStart: "70px",
      },
    },
  },
});

const Action = styled("a", {
  base: {
    cursor: "pointer",
    position: "relative",

    display: "grid",
    placeItems: "center",

    height: "100%",
    aspectRatio: "3/2",
  },
});

const ControlsOverlay = styled("div", {
  base: {
    position: "fixed",
    left: "env(titlebar-area-x, 0px)",
    top: "env(titlebar-area-y, 0px)",
    width: "env(titlebar-area-width, 100%)",
    height: "env(titlebar-area-height, 29px)",
    zIndex: "9999",
    "app-region": "drag",
    "-webkit-app-region": "drag",
  },
});
