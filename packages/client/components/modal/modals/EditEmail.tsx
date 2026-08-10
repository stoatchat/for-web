import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui/solid/macro";

import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";

import { MFATicket } from "stoat.js";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Change account email address
 */
export function EditEmailModal(
  props: DialogProps & Modals & { type: "edit_email" },
) {
  const { t } = useLingui();
  const { showError, mfaFlow } = useModals();

  const group = createFormGroup({
    email: createFormControl("", { required: true }),
    currentPassword: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      const mfa = await props.client.account.mfa();

      let ticket: MFATicket | undefined;
      if (mfa.authenticatorEnabled) {
        ticket = await mfaFlow(mfa);
        // User canceled the MFA flow.
        if (!ticket) {
          return;
        }
      }

      await props.client.account.changeEmail(
        group.controls.email.value,
        group.controls.currentPassword.value,
        ticket,
      );

      props.onClose();
    } catch (err) {
      showError(err);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Change login email</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Send email</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column>
          <Form2.TextField
            name="email"
            type="email"
            label={t`Email`}
            control={group.controls.email}
            placeholder={t`someone@example.com`}
          />
          <Form2.TextField
            name="currentPassword"
            control={group.controls.currentPassword}
            label={t`Current Password`}
            type="password"
            placeholder={t`Enter your current password...`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
