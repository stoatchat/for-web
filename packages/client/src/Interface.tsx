import { JSX, Match, Show, Switch, createEffect } from "solid-js";

import { Server } from "revolt.js";
import { styled } from "styled-system/jsx";

import { ChannelContextMenu, ServerContextMenu } from "@revolt/app";
import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { NotificationsWorker } from "@revolt/client/NotificationsWorker";
import { useModals } from "@revolt/modal";
import { Navigate, useBeforeLeave } from "@revolt/routing";
import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import { Button, CircularProgress } from "@revolt/ui";

import { Sidebar } from "./interface/Sidebar";
import { pendingUpdate } from "./serviceWorkerInterface";

/**
 * Application layout
 */
const Interface = (props: { children: JSX.Element }) => {
  const state = useState();
  const { openModal } = useModals();
  const { isLoggedIn, lifecycle } = useClientLifecycle();

  useBeforeLeave((e) => {
    if (!e.defaultPrevented) {
      if (e.to === "/settings") {
        e.preventDefault();
        openModal({
          type: "settings",
          config: "user",
        });
      } else if (typeof e.to === "string") {
        state.layout.setLastActivePath(e.to);
      }
    }
  });

  createEffect(() => {
    if (!isLoggedIn()) {
      console.info("WAITING... currently", lifecycle.state());
    }
  });

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        height: "calc(100% - 29px)", // todo: un hard-code (see <Titlebar />)
      }}
    >
      <Notice>
        ⚠️ Beta software, things will break!{" "}
        {/*<strong class={css({ color: "var(--md-sys-color-on-surface)" })}>
          <a href="#" target="_blank">
            📣 Click here to give us feedback!
          </a>
        </strong>{" "}*/}
        State:{" "}
        <Switch>
          <Match when={lifecycle.state() === State.Connecting}>
            Connecting
          </Match>
          <Match when={lifecycle.state() === State.Connected}>Connected</Match>
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
      </Notice>
      <Switch fallback={<CircularProgress />}>
        <Match when={!isLoggedIn()}>
          <Navigate href="/login" />
        </Match>
        <Match when={lifecycle.loadedOnce()}>
          <Layout
            style={{ "flex-grow": 1, "min-height": 0 }}
            onDragOver={(e) => {
              if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
            }}
            onDrop={(e) => e.preventDefault()}
          >
            <Sidebar
              menuGenerator={(target) => ({
                contextMenu: () => {
                  return (
                    <>
                      {target instanceof Server ? (
                        <ServerContextMenu server={target} />
                      ) : (
                        <ChannelContextMenu channel={target} />
                      )}
                    </>
                  );
                },
              })}
            />
            <Content
              sidebar={state.layout.getSectionState(
                LAYOUT_SECTIONS.PRIMARY_SIDEBAR,
                true,
              )}
            >
              {props.children}
            </Content>
          </Layout>
        </Match>
      </Switch>

      <NotificationsWorker />
    </div>
  );
};

const Notice = styled("div", {
  base: {
    textAlign: "center",
    fontSize: "0.8em",
    padding: "8px",
    color: "var(--md-sys-color-outline)",
    background: "var(--md-sys-color-surface-container-high)",
    // borderRadius: "var(--borderRadius-md)",
  },
});

/**
 * Parent container
 */
const Layout = styled("div", {
  base: {
    display: "flex",
    height: "100%",
    background: "var(--md-sys-color-surface-container-high)",
    minWidth: 0,
  },
});

/**
 * Main content container
 */
const Content = styled("div", {
  base: {
    background: "var(--md-sys-color-surface-container-low)",

    display: "flex",
    width: "100%",
    minWidth: 0,
  },
  variants: {
    sidebar: {
      false: {
        borderTopLeftRadius: "var(--borderRadius-lg)",
        borderBottomLeftRadius: "var(--borderRadius-lg)",
        overflow: "hidden",
      },
    },
  },
});

export default Interface;
