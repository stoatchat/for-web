import { Trans } from "@lingui-solid/solid/macro";

import { useApi } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { Button } from "@revolt/ui";

import { FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";
import { useInstance } from "@revolt/instance";

/**
 * Flow for sending password reset
 */
export default function FlowReset() {
  const api = useApi();
  const navigate = useNavigate();
  const instance = useInstance();

  /**
   * Send password reset
   * @param data Form Data
   */
  async function reset(data: FormData) {
    const email = data.get("email") as string;
    const captcha = data.get("captcha") as string;

    await api.post("/auth/account/reset_password", {
      email,
      captcha,
    });

    setFlowCheckEmail(email);
    navigate("/login/check", { replace: true });
  }

  return (
    <>
      <FlowTitle>
        <Trans>Reset password</Trans>
      </FlowTitle>
      <Form onSubmit={reset} captcha={instance.hcaptcha_sitekey}>
        <Fields fields={["email"]} />
        <Button type="submit">
          <Trans>Reset</Trans>
        </Button>
      </Form>
      <a href="/login/auth">
        <Button variant="text">
          <Trans>Go back to login</Trans>
        </Button>
      </a>
      {import.meta.env.DEV && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            background: "white",
            color: "black",
            cursor: "pointer",
          }}
          onClick={() => {
            navigate("/login/reset/abc", { replace: true });
          }}
        >
          Mock Reset Screen
        </div>
      )}
    </>
  );
}
