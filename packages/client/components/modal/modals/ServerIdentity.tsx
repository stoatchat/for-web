import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { API } from "stoat.js";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to update the user's server identity
 */
export function ServerIdentityModal(
  props: DialogProps & Modals & { type: "server_identity" },
) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const group = createFormGroup({
    avatar: createFormControl<string | File[] | null>(
      props.member.animatedAvatarURL,
    ),
    nickname: createFormControl(props.member.nickname ?? ""),
  });

  async function onSubmit() {
    try {
      const changes: API.DataMemberEdit = {
        remove: [],
      };

      if (group.controls.nickname.isDirty) {
        const nickname = group.controls.nickname.value.trim();
        if (nickname) {
          changes.nickname = nickname;
        } else {
          changes.remove!.push("Nickname");
        }
      }

      if (group.controls.avatar.isDirty) {
        if (!group.controls.avatar.value) {
          changes.remove!.push("Avatar");
        } else if (Array.isArray(group.controls.avatar.value)) {
          changes.avatar = await client().uploadFile(
            "avatars",
            group.controls.avatar.value[0],
            CONFIGURATION.DEFAULT_MEDIA_URL,
          );
        }
      }

      await props.member.edit(changes);

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Change identity on {props.member.server!.name}</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Save</Trans>,
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
          <Form2.FileInput
            control={group.controls.avatar}
            accept="image/*"
            label={t`Server Avatar`}
            imageJustify={false}
          />
          <Form2.TextField
            name="nickname"
            label={t`Nickname`}
            control={group.controls.nickname}
            placeholder={props.member.user?.displayName}
          />
        </Column>
      </form>
    </Dialog>
  );
}
