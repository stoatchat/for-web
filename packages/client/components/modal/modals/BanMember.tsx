import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui/solid/macro";

import { useDurationFormat } from "@revolt/i18n/durations";
import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Form2,
  MenuItem,
  Text,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Ban a server member with reason
 */
export function BanMemberModal(
  props: DialogProps & Modals & { type: "ban_member" },
) {
  const { t } = useLingui();
  const { showError } = useModals();
  const duration = useDurationFormat();

  const group = createFormGroup({
    reason: createFormControl(""),
    deleteMessageSeconds: createFormControl("0"),
  });
  async function onSubmit() {
    try {
      await props.member.ban({
        reason: group.controls.reason.value,
        delete_message_seconds: Number(
          group.controls.deleteMessageSeconds.value,
        ),
      });

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Ban Member</Trans>}
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
      <form onSubmit={submit}>
        <Column align>
          <Avatar src={props.member.user?.animatedAvatarURL} size={64} />
          <Text>
            <Trans>You are about to ban {props.member.user?.username}</Trans>
          </Text>
          <Form2.TextField
            maxlength={1024}
            counter
            name="reason"
            control={group.controls.reason}
            label={t`Reason`}
            placeholder={t`User broke a certain rule…`}
          />
          <Form2.Select
            label={t`Delete Message History`}
            control={group.controls.deleteMessageSeconds}
          >
            <MenuItem value="0">
              <Trans>Don't delete messages</Trans>
            </MenuItem>
            <MenuItem value="3600">{duration({ hours: 1 })}</MenuItem>
            <MenuItem value="21600">{duration({ hours: 6 })}</MenuItem>
            <MenuItem value="86400">{duration({ days: 1 })}</MenuItem>
            <MenuItem value="259200">{duration({ days: 3 })}</MenuItem>
            <MenuItem value="604800">{duration({ days: 7 })}</MenuItem>
          </Form2.Select>
        </Column>
      </form>
    </Dialog>
  );
}
