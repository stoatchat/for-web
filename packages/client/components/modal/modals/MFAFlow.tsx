import { createFormControl, createFormGroup } from "solid-forms";
import { BiRegularArchive, BiSolidKey, BiSolidKeyboard } from "solid-icons/bi";
import {
  For,
  Match,
  Switch,
  createEffect,
  createSignal,
  onMount,
} from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import type { API } from "stoat.js";

import {
  CategoryButton,
  CircularProgress,
  Column,
  Dialog,
  DialogProps,
  Form2,
  Text,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to create an MFA ticket
 */
export function MFAFlowModal(
  props: DialogProps & Modals & { type: "mfa_flow" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  // Keep track of available methods
  const [methods, setMethods] = createSignal<API.MFAMethod[] | undefined>(
    // eslint-disable-next-line solid/reactivity
    props.state === "unknown" ? props.available_methods : undefined,
  );

  // Current state of the modal
  const [selectedMethod, setSelected] = createSignal<API.MFAMethod>();

  const group = createFormGroup({
    password: createFormControl(""),
    totp_code: createFormControl(""),
    recovery_code: createFormControl(""),
  });

  // Fetch available methods if they have not been provided.
  onMount(() => {
    if (!methods() && props.state === "known") {
      setMethods(props.mfa.availableMethods);
    }
  });

  // Always select first available method if only one available.
  createEffect(() => {
    const list = methods();
    if (list) {
      setSelected(list.find((entry) => entry !== "Recovery"));
    }
  });

  /**
   * Callback to generate a new ticket or send response back up the chain
   */
  async function onSubmit() {
    try {
      const method = selectedMethod();
      if (!method) return;

      let mfa_response: API.MFAResponse;

      switch (method) {
        case "Password":
          mfa_response = { password: group.controls.password.value };
          break;
        case "Totp":
          mfa_response = { totp_code: group.controls.totp_code.value };
          break;
        case "Recovery":
          mfa_response = { recovery_code: group.controls.recovery_code.value };
          break;
        default:
          return;
      }

      if (props.state === "known") {
        const ticket = await props.mfa.createTicket(mfa_response);
        props.callback(ticket);
      } else {
        props.callback(mfa_response);
      }

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  function onCancel() {
    props.callback();
    props.onClose();
  }

  function onBack() {
    if (methods()!.length === 1) {
      onCancel();
    } else {
      setSelected(undefined);

      // Clear form values
      group.controls.password.setValue("");
      group.controls.totp_code.setValue("");
      group.controls.recovery_code.setValue("");
    }
  }

  function canSubmit() {
    return (
      Form2.canSubmit(group) &&
      (group.controls.password.value ||
        group.controls.totp_code.value ||
        group.controls.recovery_code.value)
    );
  }

  const getActions = () => {
    if (selectedMethod()) {
      return [
        {
          text: (
            <Switch fallback={<Trans>Back</Trans>}>
              <Match when={methods()!.length === 1}>
                <Trans>Cancel</Trans>
              </Match>
            </Switch>
          ),
          onClick: () => {
            onBack();
            return false;
          },
        },
        {
          text: <Trans>Confirm</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !canSubmit(),
        },
      ];
    }

    return [
      {
        text: <Trans>Cancel</Trans>,
        onClick: () => {
          onCancel();
          return false;
        },
      },
    ];
  };

  return (
    <Dialog
      show={props.show}
      onClose={() =>
        props.state === "unknown" || selectedMethod()
          ? undefined
          : props.onClose()
      }
      title={<Trans>Confirm action</Trans>}
      actions={getActions()}
      isDisabled={group.isPending}
    >
      <form onSubmit={Form2.submitHandler(group, onSubmit)}>
        <Column>
          <Text>
            <Switch
              fallback={
                <Trans>
                  Please select a method to authenticate your request.
                </Trans>
              }
            >
              <Match when={selectedMethod()}>
                <Trans>
                  Please confirm this action using the selected method.
                </Trans>
              </Match>
            </Switch>
          </Text>

          <Switch fallback={<CircularProgress />}>
            <Match when={selectedMethod()}>
              <Switch>
                <Match when={selectedMethod() === "Password"}>
                  <Form2.TextField
                    name="password"
                    control={group.controls.password}
                    type="password"
                    label={t`Password`}
                  />
                </Match>
                <Match when={selectedMethod() === "Totp"}>
                  <Form2.TextField
                    name="totp_code"
                    control={group.controls.totp_code}
                    type="text"
                    label={t`Authenticator App`}
                  />
                </Match>
                <Match when={selectedMethod() === "Recovery"}>
                  <Form2.TextField
                    name="recovery_code"
                    control={group.controls.recovery_code}
                    type="text"
                    label={t`Recovery Code`}
                  />
                </Match>
              </Switch>
            </Match>
            <Match when={methods()}>
              <For each={methods()}>
                {(method) => (
                  <CategoryButton
                    action="chevron"
                    icon={
                      <Switch>
                        <Match when={method === "Password"}>
                          <BiSolidKeyboard size={24} />
                        </Match>
                        <Match when={method === "Totp"}>
                          <BiSolidKey size={24} />
                        </Match>
                        <Match when={method === "Recovery"}>
                          <BiRegularArchive size={24} />
                        </Match>
                      </Switch>
                    }
                    onClick={() => {
                      setSelected(method);
                      // Clear form values when switching methods
                      group.controls.password.setValue("");
                      group.controls.totp_code.setValue("");
                      group.controls.recovery_code.setValue("");
                    }}
                  >
                    <Switch>
                      <Match when={method === "Password"}>
                        <Trans>Password</Trans>
                      </Match>
                      <Match when={method === "Totp"}>
                        <Trans>Authenticator App</Trans>
                      </Match>
                      <Match when={method === "Recovery"}>
                        <Trans>Recovery Code</Trans>
                      </Match>
                    </Switch>
                  </CategoryButton>
                )}
              </For>
            </Match>
          </Switch>
        </Column>
      </form>
    </Dialog>
  );
}
