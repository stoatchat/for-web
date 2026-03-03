import { Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { css } from "styled-system/css";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { Navigate } from "@revolt/routing";
import { Button, CircularProgress, Column } from "@revolt/ui";

import { useState } from "@revolt/state";
import Wordmark from "../../../../public/assets/web/wordmark.svg?component-solid";

/**
 * Flow for logging into an account
 */
export default function FlowHome() {
  const state = useState();
  const { lifecycle, isLoggedIn, isError } = useClientLifecycle();

  return (
    <Switch
      fallback={
        <>
          <Show when={isLoggedIn()}>
            <Navigate href={state.layout.popNextPath() ?? "/app"} />
          </Show>

          <Column gap="xl">
            <Wordmark
              class={css({
                width: "60%",
                margin: "auto",
                fill: "var(--md-sys-color-on-surface)",
              })}
            />

            <Column>
              <b
                style={{
                  "font-weight": 800,
                  "font-size": "1.4em",
                  display: "flex",
                  "flex-direction": "column",
                  "align-items": "center",
                  "text-align": "center",
                }}
              >
                <span>
                  <Trans>
                    Find your com
                    <wbr />
                    munity,
                    <br />
                    connect with the world.
                  </Trans>
                </span>
              </b>
              <span style={{ "text-align": "center", opacity: "0.5" }}>
                <Trans>
                  Stoat is one of the best ways to stay connected with your
                  friends and community, anywhere, anytime.
                </Trans>
              </span>
            </Column>

            <Column>
              <a href="/login/auth">
                <Column>
                  <Button>
                    <Trans>Log In</Trans>
                  </Button>
                </Column>
              </a>
              <a href="/login/create">
                <Column>
                  <Button variant="tonal">
                    <Trans>Sign Up</Trans>
                  </Button>
                </Column>
              </a>
            </Column>
          </Column>
        </>
      }
    >
      <Match when={lifecycle.state() === State.LoggingIn}>
        <CircularProgress />
      </Match>
      <Match when={isError()}>
        <Show
          when={lifecycle.permanentError === "InvalidSession"}
          fallback={lifecycle.permanentError || "An unknown error occurred."}
        >
          <Trans>You were logged out!</Trans>
        </Show>
        <Button
          variant="filled"
          onPress={() =>
            lifecycle.transition({
              type: TransitionType.Dismiss,
            })
          }
        >
          <Trans>OK</Trans>
        </Button>
      </Match>
    </Switch>
  );
}
