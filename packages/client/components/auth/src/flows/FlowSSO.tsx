import { Match, Switch, createSignal, onMount } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import { useClientLifecycle } from "@revolt/client";
import { TransitionType } from "@revolt/client/Controller";
import { useNavigate, useSearchParams } from "@revolt/routing";
import { Button, CircularProgress } from "@revolt/ui";
import { useState } from "@revolt/state";

import { FlowTitle } from "./Flow";

type State =
  | {
      state: "processing";
    }
  | {
      state: "error";
      error: unknown;
    }
  | {
      state: "success";
    };

export default function FlowSSO() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lifecycle } = useClientLifecycle();
  const state = useState();

  const [flowState, setFlowState] = createSignal<State>({
    state: "processing",
  });

  onMount(async () => {
    try {
      const token = searchParams.token;
      if (!token) {
        setFlowState({ state: "error", error: "MissingToken" });
        return;
      }

      const createdSession = {
        _id: "",
        token,
        userId: "",
        valid: false,
      };

      state.auth.setSession(createdSession);

      lifecycle.transition({
        type: TransitionType.LoginUncached,
        session: createdSession,
      });

      setFlowState({ state: "success" });
    } catch (err) {
      setFlowState({ state: "error", error: err });
    }
  });

  return (
    <Switch>
      <Match when={flowState().state === "processing"}>
        <FlowTitle>
          <Trans>Signing you in via SSO…</Trans>
        </FlowTitle>
        <CircularProgress />
      </Match>
      <Match when={flowState().state === "error"}>
        <FlowTitle>
          <Trans>SSO login failed!</Trans>
        </FlowTitle>
        <a href="/login/auth">
          <Button variant="text">
            <Trans>Go back to login</Trans>
          </Button>
        </a>
      </Match>
      <Match when={flowState().state === "success"}>
        <FlowTitle>
          <Trans>Signed in!</Trans>
        </FlowTitle>
      </Match>
    </Switch>
  );
}
