import { Match, Show, Switch, createSignal, onMount } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import { useApi, useClientLifecycle } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useNavigate, useParams } from "@revolt/routing";
import { Button, CircularProgress } from "@revolt/ui";

import { FlowTitle } from "./Flow";

type State =
  | {
      state: "verifying";
    }
  | {
      state: "error";
      error: unknown;
    }
  | {
      state: "success";
      mfa_ticket?: string;
    };

/**
 * Flow for confirming email
 */
export default function FlowVerify() {
  const api = useApi();
  const params = useParams();
  const modals = useModals();
  const navigate = useNavigate();
  const { login } = useClientLifecycle();

  const [state, setState] = createSignal<State>({
    state: "verifying",
  });

  onMount(async () => {
    try {
      if (import.meta.env.DEV) {
        if (confirm("Mock verification?")) {
          if (confirm("Successful verification?")) {
            setState({ state: "success", mfa_ticket: "token" });
          } else {
            setState({ state: "error", error: "InvalidToken" });
          }

          return;
        }
      }

      const data = (await api.post(`/auth/account/verify/${params.token}`)) as {
        ticket?: { token: string };
      };

      setState({ state: "success", mfa_ticket: data.ticket?.token });
    } catch (err) {
      setState({ state: "error", error: err });
    }
  });

  /**
   * Use MFA ticket to login
   */
  async function performLogin() {
    const v = state();
    if (v.state === "success" && v.mfa_ticket) {
      await login(
        {
          mfa_ticket: v.mfa_ticket,
        },
        modals,
      );

      navigate("/login/auth", { replace: true });
    }
  }

  return (
    <Switch>
      <Match when={state().state === "verifying"}>
        <FlowTitle>
          <Trans>Verifying your account…</Trans>
        </FlowTitle>
        <CircularProgress />
      </Match>
      <Match when={state().state === "error"}>
        <FlowTitle>
          <Trans>Failed to verify!</Trans>
        </FlowTitle>
        {/* <Text class="body" size="small">
          {t(
            `error.${(state() as State & { state: "error" }).error}` as any,
            undefined,
            (state() as State & { state: "error" }).error
          )}
        </Text> TODO */}
        <a href="/login/auth">
          <Button variant="text">
            <Trans>Go back to login</Trans>
          </Button>
        </a>
      </Match>
      <Match when={state().state === "success"}>
        <FlowTitle>
          <Trans>Your account has been verified!</Trans>
        </FlowTitle>
        <Show when={"mfa_ticket" in state()}>
          <Button onPress={performLogin}>
            <Trans>Continue to app</Trans>
          </Button>
        </Show>
        <a href="/login/auth">
          <Button variant="text">
            <Trans>Go back to login</Trans>
          </Button>
        </a>
      </Match>
    </Switch>
  );
}
