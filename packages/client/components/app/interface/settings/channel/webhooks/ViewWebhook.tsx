import { createFormControl, createFormGroup } from "solid-forms";
import { Show } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { API, ChannelWebhook } from "stoat.js";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  CategoryButton,
  CircularProgress,
  Column,
  Form2,
  Row,
} from "@revolt/ui";

import MdContentCopy from "@material-design-icons/svg/outlined/content_copy.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";

import { useInstance } from "@revolt/instance";
import { useSettingsNavigation } from "../../Settings";

/**
 * Webhook
 */
export function ViewWebhook(props: { webhook: ChannelWebhook }) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();
  const { navigate } = useSettingsNavigation();
  const instance = useInstance();

  /* eslint-disable solid/reactivity */
  const editGroup = createFormGroup({
    name: createFormControl(props.webhook.name),
    avatar: createFormControl<string | File[] | null>(props.webhook.avatarURL),
  });
  /* eslint-enable solid/reactivity */

  const deleteWebhook = useMutation(() => ({
    mutationFn: () => props.webhook.delete(),
    onSuccess() {
      navigate("webhooks");
    },
    onError: showError,
  }));

  async function onSubmit() {
    const changes: API.DataEditWebhook = {
      remove: [],
    };

    if (editGroup.controls.name.isDirty) {
      changes.name = editGroup.controls.name.value.trim();
    }

    if (editGroup.controls.avatar.isDirty) {
      if (!editGroup.controls.avatar.value) {
        changes.remove!.push("Avatar");
      } else if (Array.isArray(editGroup.controls.avatar.value)) {
        const body = new FormData();
        body.append("file", editGroup.controls.avatar.value[0]);

        const [key, value] = client().authenticationHeader;
        const data: { id: string } = await fetch(
          `${instance.mediaUrl}/avatars`,
          {
            method: "POST",
            body,
            headers: {
              [key]: value,
            },
          },
        ).then((res) => res.json());

        changes.avatar = data.id;
      }
    }

    await props.webhook.edit(changes);
  }

  function onReset() {
    editGroup.controls.name.setValue(props.webhook.name);
    editGroup.controls.avatar.setValue(props.webhook.avatarURL ?? null);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  return (
    <Column gap="xl">
      <form onSubmit={submit}>
        <Column>
          <Form2.FileInput
            control={editGroup.controls.avatar}
            accept="image/*"
            label={t`Webhook Icon`}
            imageJustify={false}
          />
          <Form2.TextField
            name="name"
            control={editGroup.controls.name}
            label={t`Webhook Name`}
          />
          <Row>
            <Form2.Reset group={editGroup} onReset={onReset} />
            <Form2.Submit group={editGroup}>
              <Trans>Save</Trans>
            </Form2.Submit>
            <Show when={editGroup.isPending}>
              <CircularProgress />
            </Show>
          </Row>
        </Column>
      </form>

      <Column>
        <CategoryButton
          action="chevron"
          icon={<MdContentCopy />}
          onClick={() =>
            navigator.clipboard.writeText(
              `${instance.apiUrl}/webhooks/${props.webhook.id}/${props.webhook.token}`,
            )
          }
        >
          <Trans>Copy webhook URL</Trans>
        </CategoryButton>
        <CategoryButton
          action="chevron"
          icon={<MdDelete />}
          disabled={deleteWebhook.isPending}
          onClick={() => deleteWebhook.mutate()}
        >
          Delete webhook
        </CategoryButton>
      </Column>
    </Column>
  );
}
