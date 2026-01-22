import { createFormControl, createFormGroup } from "solid-forms";
import { For, Show, createEffect, on } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import type { API } from "stoat.js";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import {
  CircularProgress,
  Column,
  Form2,
  MenuItem,
  Row,
  Text,
} from "@revolt/ui";

import { ServerSettingsProps } from "../ServerSettings";

/**
 * Server overview
 */
export default function ServerOverview(props: ServerSettingsProps) {
  const { t } = useLingui();
  const client = useClient();

  /* eslint-disable solid/reactivity */
  const editGroup = createFormGroup({
    name: createFormControl(props.server.name),
    description: createFormControl(props.server.description || ""),
    icon: createFormControl<string | File[] | null>(
      props.server.animatedIconURL,
    ),
    banner: createFormControl<string | File[] | null>(props.server.bannerURL),
    sys_user_joined: createFormControl(
      props.server.systemMessages?.user_joined ?? "none",
    ),
    sys_user_left: createFormControl(
      props.server.systemMessages?.user_left ?? "none",
    ),
    sys_user_kicked: createFormControl(
      props.server.systemMessages?.user_kicked ?? "none",
    ),
    sys_user_banned: createFormControl(
      props.server.systemMessages?.user_banned ?? "none",
    ),
  });

  const channels = () =>
    props.server.channels.map((channel) => ({
      item: channel,
      value: channel.id,
    }));
  /* eslint-enable solid/reactivity */

  // update fields (if they are not dirty) ourselves:
  createEffect(
    on(
      () => props.server.name,
      (name) =>
        !editGroup.controls.name.isDirty &&
        editGroup.controls.name.setValue(name),
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.server.description,
      (description) =>
        description &&
        !editGroup.controls.description.isDirty &&
        editGroup.controls.description.setValue(description),
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.server.animatedIconURL,
      (icon) =>
        !editGroup.controls.icon.isDirty &&
        editGroup.controls.icon.setValue(icon ?? null),
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.server.bannerURL,
      (banner) =>
        !editGroup.controls.banner.isDirty &&
        editGroup.controls.banner.setValue(banner ?? null),
      { defer: true },
    ),
  );

  function onReset() {
    editGroup.controls.name.setValue(props.server.name);
    editGroup.controls.description.setValue(props.server.description || "");
    editGroup.controls.icon.setValue(props.server.animatedIconURL ?? null);
    editGroup.controls.banner.setValue(props.server.bannerURL ?? null);
    editGroup.controls.sys_user_joined.setValue(
      props.server.systemMessages?.user_joined ?? "none",
    );
    editGroup.controls.sys_user_left.setValue(
      props.server.systemMessages?.user_left ?? "none",
    );
    editGroup.controls.sys_user_kicked.setValue(
      props.server.systemMessages?.user_kicked ?? "none",
    );
    editGroup.controls.sys_user_banned.setValue(
      props.server.systemMessages?.user_banned ?? "none",
    );
  }

  async function onSubmit() {
    const changes: API.DataEditServer = {
      remove: [],
      system_messages: {
        // empty object => remove every system_message channel
        ...(props.server.systemMessages ?? {}),
      },
    };

    if (editGroup.controls.name.isDirty) {
      changes.name = editGroup.controls.name.value.trim();
    }

    if (editGroup.controls.description.isDirty) {
      const description = editGroup.controls.description.value.trim();

      if (description) {
        changes.description = description;
      } else {
        changes.remove!.push("Description");
      }
    }

    if (editGroup.controls.icon.isDirty) {
      if (!editGroup.controls.icon.value) {
        changes.remove!.push("Icon");
      } else if (Array.isArray(editGroup.controls.icon.value)) {
        changes.icon = await client().uploadFile(
          "icons",
          editGroup.controls.icon.value[0],
          CONFIGURATION.DEFAULT_MEDIA_URL,
        );
      }
    }

    if (editGroup.controls.banner.isDirty) {
      if (!editGroup.controls.banner.value) {
        changes.remove!.push("Banner");
      } else if (Array.isArray(editGroup.controls.banner.value)) {
        changes.banner = await client().uploadFile(
          "banners",
          editGroup.controls.banner.value[0],
          CONFIGURATION.DEFAULT_MEDIA_URL,
        );
      }
    }

    if (editGroup.controls.sys_user_joined.isDirty) {
      if (
        editGroup.controls.sys_user_joined.value == "none" &&
        changes.system_messages?.user_joined
      ) {
        delete changes.system_messages.user_joined;
      } else {
        changes.system_messages!.user_joined =
          editGroup.controls.sys_user_joined.value;
      }
    }

    if (editGroup.controls.sys_user_left.isDirty) {
      if (
        editGroup.controls.sys_user_left.value == "none" &&
        changes.system_messages?.user_left
      ) {
        delete changes.system_messages.user_left;
      } else {
        changes.system_messages!.user_left =
          editGroup.controls.sys_user_left.value;
      }
    }

    if (editGroup.controls.sys_user_kicked.isDirty) {
      if (
        editGroup.controls.sys_user_kicked.value == "none" &&
        changes.system_messages?.user_kicked
      ) {
        delete changes.system_messages.user_kicked;
      } else {
        changes.system_messages!.user_kicked =
          editGroup.controls.sys_user_kicked.value;
      }
    }

    if (editGroup.controls.sys_user_banned.isDirty) {
      if (
        editGroup.controls.sys_user_banned.value == "none" &&
        changes.system_messages?.user_banned
      ) {
        delete changes.system_messages.user_banned;
      } else {
        changes.system_messages!.user_banned =
          editGroup.controls.sys_user_banned.value;
      }
    }

    await props.server.edit(changes);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  return (
    <Column gap="xl">
      <form onSubmit={submit}>
        <Column>
          <Form2.FileInput
            control={editGroup.controls.icon}
            accept="image/*"
            label={t`Server Icon`}
            imageJustify={false}
          />
          <Form2.FileInput
            control={editGroup.controls.banner}
            accept="image/*"
            label={t`Server Banner`}
            imageAspect="232/100"
            imageRounded={false}
            imageJustify={false}
          />
          <Form2.TextField
            name="name"
            control={editGroup.controls.name}
            label={t`Server Name`}
          />
          <Form2.TextField
            autosize
            min-rows={2}
            name="description"
            control={editGroup.controls.description}
            label={t`Server Description`}
            placeholder={t`This server is about...`}
          />
          <Text class="title" size="small">
            <Trans>System message channels</Trans>
          </Text>
          <Column>
            <Text class="label">
              <Trans>User Joined</Trans>
            </Text>
            <Form2.TextField.Select
              control={editGroup.controls.sys_user_joined}
            >
              <MenuItem value="none">
                <Trans>Disabled</Trans>
              </MenuItem>
              <For each={channels()}>
                {(element) => (
                  <MenuItem value={element.value}>{element.item.name}</MenuItem>
                )}
              </For>
            </Form2.TextField.Select>
          </Column>
          <Column>
            <Text class="label">
              <Trans>User Left</Trans>
            </Text>
            <Form2.TextField.Select control={editGroup.controls.sys_user_left}>
              <MenuItem value="none">
                <Trans>Disabled</Trans>
              </MenuItem>
              <For each={channels()}>
                {(element) => (
                  <MenuItem value={element.value}>{element.item.name}</MenuItem>
                )}
              </For>
            </Form2.TextField.Select>
          </Column>
          <Column>
            <Text class="label">
              <Trans>User Kicked</Trans>
            </Text>
            <Form2.TextField.Select
              control={editGroup.controls.sys_user_kicked}
            >
              <MenuItem value="none">
                <Trans>Disabled</Trans>
              </MenuItem>
              <For each={channels()}>
                {(element) => (
                  <MenuItem value={element.value}>{element.item.name}</MenuItem>
                )}
              </For>
            </Form2.TextField.Select>
          </Column>
          <Column>
            <Text class="label">
              <Trans>User Banned</Trans>
            </Text>
            <Form2.TextField.Select
              control={editGroup.controls.sys_user_banned}
            >
              <MenuItem value="none">
                <Trans>Disabled</Trans>
              </MenuItem>
              <For each={channels()}>
                {(element) => (
                  <MenuItem value={element.value}>{element.item.name}</MenuItem>
                )}
              </For>
            </Form2.TextField.Select>
          </Column>
          <Row>
            <Form2.Reset group={editGroup} onReset={onReset} />
            <Form2.Submit group={editGroup} requireDirty>
              <Trans>Save</Trans>
            </Form2.Submit>
            <Show when={editGroup.isPending}>
              <CircularProgress />
            </Show>
          </Row>
        </Column>
      </form>
    </Column>
  );
}
