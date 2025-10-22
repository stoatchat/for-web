import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

// TODO: port the onboarding modal design

/**
 * Modal to pick a new username
 */
export function OnboardingModal(
  props: DialogProps & Modals & { type: "onboarding" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    username: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      await props.callback(group.controls.username.value);
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Choose username</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Good</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={Form2.submitHandler(group, onSubmit)}>
        <Column>
          <Form2.TextField
            name="username"
            control={group.controls.username}
            label={t`Username`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
