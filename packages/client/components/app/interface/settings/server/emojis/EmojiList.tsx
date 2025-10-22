import { createFormControl, createFormGroup } from "solid-forms";
import { For, Match, Show, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Server } from "stoat.js";
import { css } from "styled-system/css";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useError } from "@revolt/i18n";
import { useModals } from "@revolt/modal";
import {
  Avatar,
  CategoryButton,
  CircularProgress,
  Column,
  Form2,
  Row,
  Text,
} from "@revolt/ui";

/**
 * Emoji list
 */
export function EmojiList(props: { server: Server }) {
  const err = useError();
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  const editGroup = createFormGroup(
    {
      name: createFormControl("", { required: true }),
      file: createFormControl<string | File[] | null>(null, {
        required: true,
      }),
    },
    {
      disabled: props.server.emojis.length >= CONFIGURATION.MAX_EMOJI,
    },
  );

  async function onSubmit() {
    const body = new FormData();
    body.append("file", editGroup.controls.file.value![0]);

    const [key, value] = client().authenticationHeader;
    const data: { id: string } = await fetch(
      `${CONFIGURATION.DEFAULT_MEDIA_URL}/emojis`,
      {
        method: "POST",
        body,
        headers: {
          [key]: value,
        },
      },
    ).then((res) => res.json());

    await props.server.createEmoji(data.id, {
      name: editGroup.controls.name.value,
    });
  }

  function onReset() {
    editGroup.controls.name.setValue("");
    editGroup.controls.file.setValue(null);
  }

  return (
    <Column gap="lg">
      <form onSubmit={Form2.submitHandler(editGroup, onSubmit, onReset)}>
        <Column>
          <Row align>
            <Column>
              <Form2.FileInput
                control={editGroup.controls.file}
                accept="image/*"
                imageJustify={false}
                allowRemoval={false}
              />
            </Column>
            <Column grow>
              <Form2.TextField
                name="name"
                control={editGroup.controls.name}
                label={t`Emoji Name`}
              />

              <Row align>
                <Form2.Submit group={editGroup}>
                  <Trans>Create</Trans>
                </Form2.Submit>
                <Switch
                  fallback={
                    <Trans>
                      {CONFIGURATION.MAX_EMOJI - props.server.emojis.length}{" "}
                      emoji slots remaining
                    </Trans>
                  }
                >
                  <Match when={editGroup.errors?.error}>
                    {err(editGroup.errors!.error)}
                  </Match>
                  <Match when={editGroup.isPending}>
                    <CircularProgress />
                  </Match>
                </Switch>
              </Row>
            </Column>
          </Row>
        </Column>
      </form>

      <Column gap="sm">
        <For
          each={props.server.emojis.toSorted((b, a) =>
            a.id.localeCompare(b.id),
          )}
        >
          {(emoji) => (
            <CategoryButton
              roundedIcon={false}
              icon={<Avatar src={emoji.url} shape="rounded-square" />}
              onClick={() => openModal({ type: "emoji_preview", emoji })}
            >
              <Column gap="none">
                <span class={css({ flex: 1 })}>:{emoji.name}:</span>
                <span
                  class={css({
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--gap-sm)",
                  })}
                >
                  <Avatar
                    size={12}
                    fallback={emoji.creator?.displayName}
                    src={emoji.creator?.animatedAvatarURL}
                  />
                  <Text class="label">{emoji.creator?.displayName}</Text>
                </span>
              </Column>
            </CategoryButton>
          )}
        </For>
      </Column>
    </Column>
  );
}
