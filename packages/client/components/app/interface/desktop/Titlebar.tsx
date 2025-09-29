import { Match, Show, Switch, createSignal } from "solid-js";

import { styled } from "styled-system/jsx";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { Button, Ripple, symbolSize, typography } from "@revolt/ui";

import MdBuild from "@material-symbols/svg-400/outlined/build.svg?component-solid";
import MdClose from "@material-symbols/svg-400/outlined/close.svg?component-solid";
import MdCollapseContent from "@material-symbols/svg-400/outlined/collapse_content.svg?component-solid";
import MdExpandContent from "@material-symbols/svg-400/outlined/expand_content.svg?component-solid";
import MdMinimize from "@material-symbols/svg-400/outlined/minimize.svg?component-solid";

import { pendingUpdate } from "../../../../src/serviceWorkerInterface";

declare global {
  interface Window {
    native: {
      minimise(): void;
      maximise(): void;
      close(): void;
    };
  }
}

export function Titlebar() {
  const [isMaximised, setIsMaximised] = createSignal(false);
  const { lifecycle } = useClientLifecycle();

  // async function onResize() {
  //   setIsMaximised(await window.isMaximized());
  // }

  // onMount(async () => {
  //   setIsMaximised(await window.isMaximized());

  //   const unlisten = await window?.onResized(onResize);

  //   if (unlisten) {
  //     onCleanup(unlisten);
  //   }
  // });

  function isDisconnected() {
    return [
      State.Connecting,
      State.Disconnected,
      State.Reconnecting,
      State.Offline,
    ].includes(lifecycle.state());
  }

  return (
    <Base disconnected={isDisconnected()}>
      <Title
        style={{
          "-webkit-user-select": "none",
          "-webkit-app-region": "drag",
        }}
      >
        My Cool Chat App{" "}
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
            Disconnected{" "}
            <a
              onClick={() =>
                lifecycle.transition({
                  type: TransitionType.Retry,
                })
              }
            >
              (reconnect now)
            </a>
          </Match>
          <Match when={lifecycle.state() === State.Reconnecting}>
            Reconnecting
          </Match>
          <Match when={lifecycle.state() === State.Offline}>
            Device is offline
          </Match>
        </Switch>
        <Show when={pendingUpdate()}>
          {" "}
          <Button size="sm" onPress={pendingUpdate()}>
            Update
          </Button>
        </Show>
      </DragHandle>
      <Show when={window.native}>
        <Action onClick={window.native.minimise}>
          <Ripple />
          <MdMinimize {...symbolSize(20)} />
        </Action>
        <Action onClick={window.native.maximise}>
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
  );
}

const Base = styled("div", {
  base: {
    flexShrink: 0,
    height: "29px",
    userSelect: "none",

    display: "flex",
    alignItems: "center",
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
    alignItems: "center",
    paddingInlineStart: "var(--gap-md)",
    ...typography.raw({ class: "title", size: "small" }),
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
