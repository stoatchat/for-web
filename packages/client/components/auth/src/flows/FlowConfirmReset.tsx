import { Trans } from "@lingui/solid/macro";

import { useApi } from "@revolt/client";
import { A, useNavigate, useParams } from "@revolt/routing";
import { Button } from "@revolt/ui";

import { FlowTitle } from "./Flow";
import { Fields, Form } from "./Form";

/**
 * Flow for confirming a new password
 */
export default function FlowConfirmReset() {
  const api = useApi();
  const { token } = useParams();
  const navigate = useNavigate();

  /**
   * Confirm new password
   * @param data Form Data
   */
  async function reset(data: FormData) {
    const password = data.get("new-password") as string;
    const remove_sessions = !!(data.get("log-out") as "on" | undefined);

    await api.patch("/auth/account/reset_password", {
      password,
      token,
      remove_sessions,
    });

    navigate("/login/auth", { replace: true });
  }

  return (
    <>
      <FlowTitle
        subtitle={<Trans>Choose a new password for your Stoat account.</Trans>}
      >
        <Trans>Reset password</Trans>
      </FlowTitle>
      <Form onSubmit={reset}>
        <Fields fields={["new-password", "log-out"]} />
        <Button type="submit" size="md">
          <Trans>Reset</Trans>
        </Button>
      </Form>
      <A href="/login/auth">
        <Button variant="text">
          <Trans>Go back to login</Trans>
        </Button>
      </A>
    </>
  );
}
