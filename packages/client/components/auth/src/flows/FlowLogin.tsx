import { Match, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { useModals } from "@revolt/modal";
import { A, Navigate } from "@revolt/routing";
import { Button, Column, Row, Text, iconSize } from "@revolt/ui";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { useState } from "@revolt/state";
import { FlowTitle } from "./Flow";
import { Fields, Form } from "./Form";

/**
 * Flow for logging into an account
 */
export default function FlowLogin() {
  const state = useState();
  const modals = useModals();
  const { lifecycle, isLoggedIn, isError, login, selectUsername } =
    useClientLifecycle();

  /**
   * Log into account
   * @param data Form Data
   */
  async function performLogin(data: FormData) {
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    if (!email || !password) return false;

    return login(
      {
        email,
        password,
      },
      modals,
    );
  }

  /**
   * Leave the error state so the login form works again
   */
  function dismissError() {
    lifecycle.transition({
      type: TransitionType.Dismiss,
    });
  }

  /**
   * Select a new username
   * @param data Form Data
   */
  async function select(data: FormData) {
    const username = data.get("username") as string;
    await selectUsername(username);
  }

  return (
    <>
      <Switch
        fallback={
          <>
            <FlowTitle
              subtitle={
                <Trans>Log in to pick up right where you left off.</Trans>
              }
            >
              <Trans>Welcome back</Trans>
            </FlowTitle>
            <Form onSubmit={performLogin}>
              <Fields fields={["email", "password"]} />
              <Column gap="sm" align class="auth-help-links">
                <A href="/login/reset">
                  <Button variant="text">
                    <Trans>Forgot password?</Trans>
                  </Button>
                </A>
                <A href="/login/resend">
                  <Button variant="text">
                    <Trans>Resend verification</Trans>
                  </Button>
                </A>
              </Column>
              <Button type="submit" size="md">
                <Trans>Log in</Trans>
              </Button>
            </Form>
          </>
        }
      >
        <Match when={isLoggedIn()}>
          <Navigate href={state.layout.popNextPath() ?? "/app"} />
        </Match>
        <Match
          when={isError() && lifecycle.permanentError === "InvalidSession"}
        >
          <FlowTitle
            subtitle={
              <Trans>
                Your session ended, possibly because you logged out on another
                device. Log in again to continue.
              </Trans>
            }
          >
            <Trans>You've been logged out</Trans>
          </FlowTitle>

          <Button variant="filled" onPress={dismissError}>
            <Trans>Log in again</Trans>
          </Button>
        </Match>
        <Match when={isError()}>
          <FlowTitle
            subtitle={
              <Trans>
                We couldn't finish logging you in. Try again, and if it keeps
                happening, check Stoat's status.
              </Trans>
            }
          >
            <Trans>Something went wrong</Trans>
          </FlowTitle>

          <Button variant="filled" onPress={dismissError}>
            <Trans>Try again</Trans>
          </Button>
        </Match>
        <Match when={lifecycle.state() === State.LoggingIn}>
          {/* the shared bubble shows the loading state */}
          <FlowTitle>
            <Trans>Logging you in…</Trans>
          </FlowTitle>
        </Match>
        <Match when={lifecycle.state() === State.Onboarding}>
          <FlowTitle>
            <Trans>Choose a username</Trans>
          </FlowTitle>

          <Text>
            <Trans>
              Pick a username that you want people to be able to find you by.
              This can be changed later in your user settings.
            </Trans>
          </Text>

          <Form onSubmit={select}>
            <Fields fields={["username"]} />
            <Row align justify>
              <Button
                variant="text"
                onPress={() =>
                  lifecycle.transition({
                    type: TransitionType.Cancel,
                  })
                }
              >
                <MdArrowBack {...iconSize("1.2em")} /> <Trans>Cancel</Trans>
              </Button>
              <Button type="submit" size="md">
                <Trans>Confirm</Trans>
              </Button>
            </Row>
          </Form>
        </Match>
      </Switch>
    </>
  );
}
