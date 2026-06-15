import HCaptcha, { HCaptchaFunctions } from "solid-hcaptcha";
import { createSignal, For, JSX, Show } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";

import { useError } from "@revolt/i18n";
import { Checkbox, Column, iconSize, Text, TextField } from "@revolt/ui";
import { styled } from "styled-system/jsx";

import MdError from "@material-design-icons/svg/filled/error.svg?component-solid";

const ErrorContainer = styled("span", {
  base: {
    color: "var(--md-sys-color-error)",
    display: "flex",
    alignItems: "center",
    gap: "0.25em",
  },
});

/**
 * Available field types
 */
type Field =
  | "email"
  | "password"
  | "new-password"
  | "log-out"
  | "username"
  | "invite";

/**
 * Properties to apply to fields
 */
const useFieldConfiguration = () => {
  const { t } = useLingui();

  return {
    email: {
      type: "email" as const,
      name: () => t`Email`,
      placeholder: () => t`Please enter your email.`,
      autocomplete: "email",
    },
    password: {
      minLength: 8,
      type: "password" as const,
      name: () => t`Password`,
      placeholder: () => t`Enter your current password.`,
    },
    "new-password": {
      minLength: 8,
      type: "password" as const,
      autocomplete: "new-password",
      name: () => t`New Password`,
      placeholder: () => t`Enter a new password.`,
    },
    "log-out": {
      name: () => t`Log out of all other sessions`,
    },
    username: {
      minLength: 2,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Username`,
      placeholder: () => t`Enter your preferred username.`,
    },
    invite: {
      minLength: 1,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Invite Code`,
      placeholder: () => t`Enter your invite code.`,
    },
  };
};

interface FieldProps {
  /**
   * Fields to gather
   */
  fields: (Field | FieldPreset)[];
}

interface FieldPreset {
  field: Field;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  disabled?: boolean;
}

/**
 * Render a bunch of fields with preset values
 */
export function Fields(props: FieldProps) {
  const fieldConfiguration = useFieldConfiguration();

  return (
    <For each={props.fields}>
      {(field) => {
        // If field is just a Field value, convert it to a FieldPreset
        if (typeof field === "string") {
          field = { field: field };
        }
        return (
          <label>
            {field.field === "log-out" ? (
              <Checkbox name={field.field}>
                {fieldConfiguration[field.field].name()}
              </Checkbox>
            ) : (
              <TextField
                required
                {...fieldConfiguration[field.field]}
                name={field.field}
                label={fieldConfiguration[field.field].name()}
                placeholder={fieldConfiguration[field.field].placeholder()}
                disabled={field.disabled}
                value={field.value}
              />
            )}
          </label>
        );
      }}
    </For>
  );
}

interface Props {
  /**
   * Form children
   */
  children: JSX.Element;

  /**
   * Whether to include captcha token
   */
  captcha?: string;

  /**
   * Submission handler
   */
  onSubmit: (data: FormData) => Promise<void> | void;
}

/**
 * Small wrapper for HTML form
 */
export function Form(props: Props) {
  const [error, setError] = createSignal();
  const err = useError();
  let hcaptcha: HCaptchaFunctions | undefined;

  /**
   * Handle submission
   * @param event Form Event
   */
  async function onSubmit(event: Event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);

    if (props.captcha) {
      if (!hcaptcha) return alert("hCaptcha not loaded!");
      const response = await hcaptcha.execute();
      formData.set("captcha", response!.response);
    }

    try {
      await props.onSubmit(formData);
    } catch (err) {
      console.error(err);
      setError(err);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Column gap="lg">
        {props.children}
        <Show when={error()}>
          <ErrorContainer>
            <MdError
              {...iconSize("1rem")}
              fill="currentColor"
              style={{ "flex-shrink": 0 }}
            />
            <Text class="label" size="small">
              {err(error())}
            </Text>
          </ErrorContainer>
        </Show>
      </Column>
      <Show when={props.captcha}>
        <HCaptcha
          sitekey={props.captcha!}
          onLoad={(instance) => (hcaptcha = instance)}
          size="invisible"
        />
      </Show>
    </form>
  );
}
