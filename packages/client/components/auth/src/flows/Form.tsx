import HCaptcha, { HCaptchaFunctions } from "solid-hcaptcha";
import { createSignal, For, JSX, Show } from "solid-js";

import { useLingui } from "@lingui/solid/macro";

import { Checkbox, Column, iconSize, Text, TextField } from "@revolt/ui";
import { styled } from "styled-system/jsx";

import MdError from "@material-design-icons/svg/filled/error.svg?component-solid";
import { TranslatedError } from "@revolt/i18n/errors";

import { useFlowBubble } from "./Flow";

const ErrorContainer = styled("span", {
  base: {
    color: "var(--md-sys-color-error)",
    display: "flex",
    alignItems: "center",
    gap: "0.25em",

    "& a": {
      color: "var(--md-sys-color-primary)",
    },
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
      "toggle-password": true,
      showPasswordIcon: "visibility",
      hidePasswordIcon: "visibility_off",
      autocomplete: "current-password",
      name: () => t`Password`,
      placeholder: () => t`Enter your current password.`,
    },
    "new-password": {
      minLength: 8,
      type: "password" as const,
      autocomplete: "new-password",
      "toggle-password": true,
      showPasswordIcon: "visibility",
      hidePasswordIcon: "visibility_off",
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
  /**
   * Shown in a small pop-up above the field while it has focus (above, so it
   * doesn't clash with password manager suggestions below the field)
   */
  hint?: JSX.Element;
}

const HintAnchor = styled("div", {
  base: {
    position: "relative",
    width: "100%",
  },
});

const HintCard = styled("div", {
  base: {
    position: "absolute",
    zIndex: 5,
    bottom: "calc(100% + 10px)",
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 14px",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-highest)",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
    fontSize: "0.85rem",
    lineHeight: 1.45,
    animation: "authHintIn 160ms cubic-bezier(0.2, 0, 0, 1)",

    // little arrow pointing down at the field
    "&::before": {
      content: '""',
      position: "absolute",
      bottom: "-5px",
      left: "24px",
      width: "10px",
      height: "10px",
      background: "inherit",
      transform: "rotate(45deg)",
      borderRadius: "2px",
    },

    "& strong": {
      display: "block",
      marginBottom: "2px",
      fontWeight: 650,
    },

    "& p": {
      margin: 0,
      color: "var(--md-sys-color-on-surface-variant)",
    },

    "& a": {
      display: "inline-block",
      marginTop: "6px",
      fontWeight: 650,
    },

    "@media (prefers-reduced-motion: reduce)": {
      animation: "none",
    },
  },
});

/**
 * Wraps a field so its hint pops up above it while the field (or the hint
 * itself, e.g. a link in it) has focus
 */
function FieldWithHint(props: { hint: JSX.Element; children: JSX.Element }) {
  let anchor: HTMLDivElement | undefined;
  const [open, setOpen] = createSignal(false);

  return (
    <HintAnchor
      ref={anchor}
      onFocusIn={() => setOpen(true)}
      onFocusOut={(event) => {
        if (!anchor?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      {props.children}
      {/* announce to screen readers */}
      <div aria-live="polite">
        <Show when={open()}>
          <HintCard role="note">{props.hint}</HintCard>
        </Show>
      </div>
    </HintAnchor>
  );
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
        const preset: FieldPreset =
          typeof field === "string" ? { field } : field;

        if (preset.field === "log-out") {
          return (
            <Checkbox name={preset.field}>
              {fieldConfiguration[preset.field].name()}
            </Checkbox>
          );
        }

        const input = (
          <TextField
            required
            {...fieldConfiguration[preset.field]}
            name={preset.field}
            label={fieldConfiguration[preset.field].name()}
            placeholder={fieldConfiguration[preset.field].placeholder()}
            disabled={preset.disabled}
            value={preset.value}
          />
        );

        return preset.hint ? (
          <FieldWithHint hint={preset.hint}>{input}</FieldWithHint>
        ) : (
          input
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
   *
   * Resolve to false when nothing was actually submitted, so no success is shown
   */
  onSubmit: (data: FormData) => Promise<void | boolean> | void | boolean;
}

/**
 * Small wrapper for HTML form
 */
export function Form(props: Props) {
  const [error, setError] = createSignal();
  const bubble = useFlowBubble();
  let hcaptcha: HCaptchaFunctions | undefined;

  /**
   * Handle submission
   * @param event Form Event
   */
  async function onSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;

    // mdui text fields aren't native form controls, so the browser doesn't
    // stop the submission when they're empty or invalid; check them here
    const invalidField = [...form.querySelectorAll("mdui-text-field")].find(
      (field) => !field.checkValidity(),
    );

    if (invalidField) {
      invalidField.reportValidity();
      invalidField.focus();
      bubble?.flashError();
      return;
    }

    const formData = new FormData(form);
    const finishSubmit = bubble?.beginSubmit();

    try {
      if (props.captcha) {
        if (!hcaptcha) return alert("hCaptcha not loaded!");
        const response = await hcaptcha.execute();
        formData.set("captcha", response!.response);
      }

      try {
        if ((await props.onSubmit(formData)) !== false) bubble?.flashSuccess();
      } catch (err) {
        console.error(err);
        setError(err);
        bubble?.flashError();
      }
    } finally {
      finishSubmit?.();
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
              <TranslatedError error={error()} />
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
