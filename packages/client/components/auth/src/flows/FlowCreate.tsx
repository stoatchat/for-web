import { Trans } from "@lingui/solid/macro";
import { Show } from "solid-js";
import { styled } from "styled-system/jsx";

import { useApi, useClientLifecycle } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { A, useNavigate, useParams } from "@revolt/routing";
import { Button, iconSize } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

const BackAction = styled("div", {
  base: {
    width: "100%",

    "& a, & button": {
      width: "100%",
    },

    "& button": {
      gap: "4px",
    },
  },
});

/**
 * Reassurance shown while typing an email address to sign up with
 */
function EmailPrivacyHint() {
  return (
    <>
      <Symbol size={20}>lock</Symbol>
      <div>
        <strong>
          <Trans>Your email stays private</Trans>
        </strong>
        <p>
          <Trans>
            We only use it to verify your account and help you get back in if
            you're ever locked out. We'll never sell it or send you spam.
          </Trans>
        </p>
        <a
          href="https://stoat.chat/privacy"
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1} // redundant for kb nav -> another link in footer
        >
          <Trans>Privacy policy</Trans>
        </a>
      </div>
    </>
  );
}

/**
 * Flow for creating a new account
 */
export default function FlowCreate() {
  const api = useApi();
  const navigate = useNavigate();
  const { code } = useParams();
  const modals = useModals();
  const { login } = useClientLifecycle();
  const { config, isStoat } = useInstance();

  /**
   * Create an account
   * @param data Form Data
   */
  async function create(data: FormData) {
    const email = data.get("email") as string;
    const password = data.get("new-password") as string;
    const captcha = data.get("captcha") as string;
    const invite = data.get("invite") as string;

    await api.post("/auth/account/create", {
      email,
      password,
      captcha,
      ...(invite ? { invite } : {}),
    });

    if (!config.features.email) {
      await login(
        {
          email,
          password,
        },
        modals,
      );
      navigate("/login/auth", { replace: true });
    } else {
      setFlowCheckEmail(email);
      navigate("/login/check", { replace: true });
    }
  }

  return (
    <>
      <FlowTitle
        subtitle={<Trans>Set up your account and make yourself at home.</Trans>}
      >
        <Trans>Join Stoat</Trans>
      </FlowTitle>
      <Form onSubmit={create} captcha={config.features.captcha.key}>
        <Fields
          fields={[
            // Stoat's privacy policy doesn't cover third party instances
            isStoat ? { field: "email", hint: <EmailPrivacyHint /> } : "email",
            "new-password",
          ]}
        />
        <Show when={config.features.invite_only}>
          <Fields fields={[{ field: "invite", value: code }]} />
        </Show>
        <Button type="submit" size="md">
          <Trans>Create account</Trans>
        </Button>
        <BackAction>
          <A href="..">
            <Button variant="text">
              <MdArrowBack {...iconSize("1.2em")} /> <Trans>Back</Trans>
            </Button>
          </A>
        </BackAction>
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
