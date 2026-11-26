import { createFormControl, createFormGroup } from "solid-forms";
import { Show } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { API } from "stoat.js";

import { useClient } from "@revolt/client";
import { useInstance } from "@revolt/instance";
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
  const instance = useInstance();

  /* eslint-disable solid/reactivity */
  const group = createFormGroup({
    avatar: createFormControl<string | File[] | null>(
      props.member.animatedAvatarURL,
    ),
    pronouns: createFormControl<string>(props.member.pronouns ?? ""),
    nickname: createFormControl(props.member.nickname ?? ""),
  });
  /* eslint-enable solid/reactivity */

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
            instance.mediaUrl,
          );
        }
      }

      if (group.controls.pronouns.isDirty) {
        if (!group.controls.pronouns.value) {
          changes.remove?.push("Pronouns");
        } else {
          changes.pronouns = group.controls.pronouns.value;
        }
      }

      await props.member.edit(changes);

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
      title={
        <Show
          when={props.member.user?.self}
          fallback={
            <Trans>
              Change{" "}
              {props.member.nickname ??
                props.member.user?.displayName ??
                props.member.user?.username}
              's nickname
            </Trans>
          }
        >
          <Trans>Change identity on {props.member.server!.name}</Trans>
        </Show>
      }
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
      <form onSubmit={submit}>
        <Column>
          <Show when={props.member.user?.self}>
            <Form2.FileInput
              control={group.controls.avatar}
              accept="image/*"
              label={t`Server Avatar`}
              imageJustify={false}
              maxSize={instance.limits().file_upload_size_limits["avatars"]}
            />
          </Show>
          <Form2.TextField
            minlength={1}
            maxlength={32}
            counter
            name="nickname"
            label={t`Nickname`}
            control={group.controls.nickname}
            placeholder={props.member.user?.displayName}
          />
          <Show when={props.member.user?.self}>
            <Form2.TextField
              minlength={1}
              maxlength={24}
              counter
              name="pronouns"
              control={group.controls.pronouns}
              label={t`Pronouns`}
            />
          </Show>
        </Column>
      </form>
    </Dialog>
  );
}
