import { Match, Show, Switch, createSignal } from "solid-js";
import { Motion, Presence } from "solid-motionone";

import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { Button, Ripple, symbolSize, typography } from "@revolt/ui";

import MdBuild from "@material-symbols/svg-400/outlined/build.svg?component-solid";
import MdClose from "@material-symbols/svg-400/outlined/close.svg?component-solid";
import MdCollapseContent from "@material-symbols/svg-400/outlined/collapse_content.svg?component-solid";
import MdExpandContent from "@material-symbols/svg-400/outlined/expand_content.svg?component-solid";
import MdMinimize from "@material-symbols/svg-400/outlined/minimize.svg?component-solid";

import Wordmark from "../../../../public/assets/web/wordmark.svg?component-solid";
import { pendingUpdate } from "../../../../src/serviceWorkerInterface";

export function Titlebar() {
  const [isMaximised, setIsMaximised] = createSignal(
    window.native ? window.desktopConfig.get().windowState.isMaximised : false,
  );
  const { lifecycle } = useClientLifecycle();

  function isDisconnected() {
    return [
      State.Connecting,
      State.Disconnected,
      State.Reconnecting,
      State.Offline,
    ].includes(lifecycle.state());
  }

  function maximise() {
    window.native.maximise();
    setIsMaximised((t) => !t);
  }

  return (
    <Presence>
      <Show
        when={
          (window.native && window.desktopConfig?.get().customFrame) ||
          isDisconnected()
        }
      >
        <Motion.div
          initial={{ height: 0 }}
          animate={{ height: "29px" }}
          exit={{ height: 0 }}
        >
          <Base disconnected={isDisconnected()}>
            <Title
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
                <MdBuild {...symbolSize(16)} />
              </Show>
            </Title>
            <DragHandle
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
                  <a
                    onClick={() =>
                      lifecycle.transition({
                        type: TransitionType.Retry,
                      })
                    }
                  >
                    <strong> (reconnect now)</strong>
                  </a>
                </Match>
                <Match when={lifecycle.state() === State.Reconnecting}>
                  Reconnecting
                </Match>
                <Match when={lifecycle.state() === State.Offline}>
                  Device is offline
                  <a
                    onClick={() =>
                      lifecycle.transition({
                        type: TransitionType.Retry,
                      })
                    }
                    style={{
                      "-webkit-app-region": "no-drag",
                    }}
                  >
                    <strong> (reconnect now)</strong>
                  </a>
                </Match>
              </Switch>
              <Show when={pendingUpdate()}>
                {" "}
                <div
                  style={{
                    "-webkit-app-region": "no-drag",
                  }}
                >
                  <Button size="sm" onPress={pendingUpdate()}>
                    Update
                  </Button>
                </div>
              </Show>
            </DragHandle>
            <Show when={window.native}>
              <Action onClick={window.native.minimise}>
                <Ripple />
                <MdMinimize {...symbolSize(20)} />
              </Action>
              <Action onClick={maximise}>
                <Ripple />
                <Show
                  when={isMaximised()}
                  fallback={<MdExpandContent {...symbolSize(20)} />}
                >
                  <MdCollapseContent {...symbolSize(20)} />
                </Show>
              </Action>
              <Action onClick={window.native.close}>
                <Ripple />
                <MdClose {...symbolSize(20)} />
              </Action>
            </Show>
          </Base>
        </Motion.div>
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
  },
  variants: {
    disconnected: {
      true: {
        color: "var(--md-sys-color-on-primary-container)",
        background: "var(--md-sys-color-primary-container)",
      },
      false: {
        color: "var(--md-sys-color-outline)",
        background: "var(--md-sys-color-surface-container-high)",
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
