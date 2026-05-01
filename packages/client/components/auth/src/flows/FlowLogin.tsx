import { Match, Switch } from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { Navigate } from "@revolt/routing";
import { Button, CircularProgress, Row, iconSize } from "@revolt/ui";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { useState } from "@revolt/state";
import { FlowTitle } from "./Flow";
import { Fields, Form } from "./Form";

/**
 * Flow for logging into an account
 */
export default function FlowLogin() {
  const state = useState();
  const { lifecycle, isLoggedIn, selectUsername } = useClientLifecycle();

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
            <FlowTitle subtitle="Sign into Stoat" emoji="wave">
              Welcome!
            </FlowTitle>
            <Row align justify>
              <a href="..">
                <Button variant="text">
                  <MdArrowBack {...iconSize("1.2em")} /> Back
                </Button>
              </a>
              <a href="/api/auth/sso/login">
                <Button>
                  SSO
                </Button>
              </a>
            </Row>
          </>
        }
      >
        <Match when={isLoggedIn()}>
          <Navigate href={state.layout.popNextPath() ?? "/app"} />
        </Match>
        <Match when={lifecycle.state() === State.LoggingIn}>
          <CircularProgress />
        </Match>
        <Match when={lifecycle.state() === State.Onboarding}>
          <FlowTitle>
            Choose a username
          </FlowTitle>
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
                <MdArrowBack {...iconSize("1.2em")} /> Cancel
              </Button>
              <Button type="submit">
                Confirm
              </Button>
            </Row>
          </Form>
        </Match>
      </Switch>
    </>
  );
}
