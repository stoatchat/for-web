import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  FloatingSelect,
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
          <FloatingSelect
            label={t`Delete Message History`}
            value={group.controls.deleteMessageSeconds.value}
            onChange={(
              e: Event & { currentTarget: HTMLElement; target: Element },
            ) =>
              group.controls.deleteMessageSeconds.setValue(
                e.currentTarget.getAttribute("value") || "0",
              )
            }
          >
            <MenuItem value="0">
              <Trans>Don't delete messages</Trans>
            </MenuItem>
            <MenuItem value="3600">
              <Trans>1 hour</Trans>
            </MenuItem>
            <MenuItem value="21600">
              <Trans>6 hours</Trans>
            </MenuItem>
            <MenuItem value="86400">
              <Trans>1 day</Trans>
            </MenuItem>
            <MenuItem value="259200">
              <Trans>3 days</Trans>
            </MenuItem>
            <MenuItem value="604800">
              <Trans>7 days</Trans>
            </MenuItem>
          </FloatingSelect>
        </Column>
      </form>
    </Dialog>
  );
}
