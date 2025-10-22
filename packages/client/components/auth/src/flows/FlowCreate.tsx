import { Trans } from "@lingui-solid/solid/macro";

import { CONFIGURATION } from "@revolt/common";
import { useNavigate } from "@revolt/routing";
import { Button, Row, iconSize } from "@revolt/ui";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { useApi } from "../../../client";

import { FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

/**
 * Flow for creating a new account
 */
export default function FlowCreate() {
  const api = useApi();
  const navigate = useNavigate();

  /**
   * Create an account
   * @param data Form Data
   */
  async function create(data: FormData) {
    const email = data.get("email") as string;
    const password = data.get("password") as string;
    const captcha = data.get("captcha") as string;

    await api.post("/auth/account/create", {
      email,
      password,
      captcha,
    });

    // FIXME: should tell client if email was sent
    //        or if email even needs to be confirmed

    // TODO: log straight in if no email confirmation?

    setFlowCheckEmail(email);
    navigate("/login/check", { replace: true });
  }

  return (
    <>
      <FlowTitle subtitle={<Trans>Create an account</Trans>} emoji="wave">
        <Trans>Hello!</Trans>
      </FlowTitle>
      <Form onSubmit={create} captcha={CONFIGURATION.HCAPTCHA_SITEKEY}>
        <Fields fields={["email", "password"]} />
        <Row justify>
          <a href="..">
            <Button variant="text">
              <MdArrowBack {...iconSize("1.2em")} /> <Trans>Back</Trans>
            </Button>
          </a>
          <Button type="submit">
            <Trans>Register</Trans>
          </Button>
        </Row>
      </Form>
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
            setFlowCheckEmail("insert@stoat.chat");
            navigate("/login/check", { replace: true });
          }}
        >
          Mock Submission
        </div>
      )}
    </>
  );
}
