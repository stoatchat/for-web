import { Match, Show, Switch } from "solid-js";

import { css } from "styled-system/css";

import { useClientLifecycle } from "@revolt/client";
import { TransitionType } from "@revolt/client/Controller";
import { Navigate, useSearchParams } from "@revolt/routing";
import { Button, Column } from "@revolt/ui";

import Wordmark from "../../../../public/assets/web/wordmark.svg?component-solid";

/**
 * Flow for logging into an account
 */
export default function FlowHome() {
  const { lifecycle, isLoggedIn, isError } = useClientLifecycle();
  const [searchParams] = useSearchParams();
  const ssoError = () => searchParams.error as string | undefined;

  return (
    <Switch
      fallback={
        <>
          <Show when={isLoggedIn()}>
            <Navigate href="/app" />
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
                  Find your com
                  <wbr />
                  munity,
                  <br />
                  connect with the world.
                </span>
              </b>
              <span style={{ "text-align": "center", opacity: "0.5" }}>
                Stoat is one of the best ways to stay connected with your
                friends and community, anywhere, anytime.
              </span>
            </Column>

            <Show when={ssoError()}>
              <span
                style={{
                  color: "var(--md-sys-color-error)",
                  "text-align": "center",
                }}
              >
                {ssoError() === "sso_disabled"
                  ? "SSO login is currently unavailable."
                  : "SSO login failed. Please try again."}
              </span>
            </Show>

            <Column>
              <a href="/api/auth/sso/login">
                <Column>
                  <Button>
                    Log In with SSO
                  </Button>
                </Column>
              </a>
            </Column>
          </Column>
        </>
      }
    >
      <Match when={isError()}>
        <Switch fallback={"an unknown error occurred"}>
          <Match when={lifecycle.permanentError === "InvalidSession"}>
            <h1>
              You were logged out!
            </h1>
          </Match>
        </Switch>

        <Button
          variant="filled"
          onPress={() =>
            lifecycle.transition({
              type: TransitionType.Dismiss,
            })
          }
        >
          OK
        </Button>
      </Match>
    </Switch>
  );
}
