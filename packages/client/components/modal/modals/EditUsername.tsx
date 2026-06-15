import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { Column, Dialog, DialogProps, Form2, Row, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Change account username
 */
export function EditUsernameModal(
  props: DialogProps & Modals & { type: "edit_username" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    // we don't expect it to change nor want it to
    // eslint-disable-next-line solid/reactivity
    username: createFormControl(props.client.user!.username, {
      required: true,
    }),
    currentPassword: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      const previousDiscriminator = props.client.user!.discriminator;
      await props.client.user!.changeUsername(
        group.controls.username.value,
        group.controls.currentPassword.value,
      );

      props.onClose();

      if (props.client.user!.discriminator !== previousDiscriminator) {
        // open modal alerting user that discirminator changed
        // or just open a modal anyways with new uname?
        alert(
          // temporary solution
          `Your discriminator changed to ${props.client.user!.discriminator}`,
        );
      }
    } catch (err) {
      showError(err);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Change username</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Change</Trans>,
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
          <Row align>
            <Form2.TextField
              minlength={1}
              maxlength={32}
              counter
              name="username"
              control={group.controls.username}
              label={t`Username`}
            />
            <Text class="label">#{props.client.user!.discriminator}</Text>
          </Row>
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
