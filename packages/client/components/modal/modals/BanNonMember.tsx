import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { Avatar, Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Ban a server non-member with reason
 */
export function BanNonMemberModal(
  props: DialogProps & Modals & { type: "ban_non_member" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    reason: createFormControl(""),
  });

  async function onSubmit() {
    try {
      await props.server.banUser(props.user.id, {
        reason: group.controls.reason.value,
      });

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Ban User</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Ban</Trans>,
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
        <Column align>
          <Avatar src={props.user?.animatedAvatarURL} size={64} />
          <Text>
            <Trans>You are about to ban {props.user?.username}</Trans>
          </Text>
          <Text>
            <Trans>
              This user is not part of the server and may already be banned
            </Trans>
          </Text>
          <Form2.TextField
            name="reason"
            control={group.controls.reason}
            label={t`Reason`}
            placeholder={t`User broke a certain rule…`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
