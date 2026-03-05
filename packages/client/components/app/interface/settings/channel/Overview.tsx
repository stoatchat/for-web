import { createFormControl, createFormGroup } from "solid-forms";
import { Match, Show, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import type { API } from "stoat.js";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  Button,
  CircularProgress,
  Column,
  Form2,
  MenuItem,
  Row,
  Text,
} from "@revolt/ui";

import { useInstance } from "@revolt/instance";
import { ChannelSettingsProps } from "../ChannelSettings";

/**
 * Channel overview
 */
export default function ChannelOverview(props: ChannelSettingsProps) {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();
  const instance = useInstance();

  /* eslint-disable solid/reactivity */
  // we want to take the initial value only
  const editGroup = createFormGroup({
    name: createFormControl(props.channel.name),
    description: createFormControl(props.channel.description || ""),
    icon: createFormControl<string | File[] | null>(
      props.channel.animatedIconURL,
    ),
    slowmode: createFormControl<string>(
      props.channel.slowmode.toString() ?? "0",
    ),
  });
  /* eslint-enable solid/reactivity */

  function onReset() {
    editGroup.controls.name.setValue(props.channel.name);
    editGroup.controls.description.setValue(props.channel.description || "");
    editGroup.controls.icon.setValue(props.channel.animatedIconURL ?? null);
    editGroup.controls.slowmode.setValue(
      props.channel.slowmode.toString() ?? "0",
    );
  }

  async function onSubmit() {
    const changes: API.DataEditChannel = {
      remove: [],
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
        const body = new FormData();
        body.append("file", editGroup.controls.icon.value[0]);

        const [key, value] = client().authenticationHeader;
        const data: { id: string } = await fetch(
          `${instance.mediaUrl}/icons`,
          {
            method: "POST",
            body,
            headers: {
              [key]: value,
            },
          },
        ).then((res) => res.json());

        changes.icon = data.id;
      }
    }

    if (editGroup.controls.slowmode.isDirty) {
      changes.slowmode = Number(editGroup.controls.slowmode.value);
    }

    await props.channel.edit(changes);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  return (
    <Column gap="xl">
      <form onSubmit={submit}>
        <Column>
          <Text class="label">
            <Trans>Channel Info</Trans>
          </Text>
          <Form2.FileInput control={editGroup.controls.icon} accept="image/*" />
          <Form2.TextField
            minlength={1}
            maxlength={32}
            counter
            name="name"
            control={editGroup.controls.name}
            label={t`Channel Name`}
          />
          <Form2.TextField
            autosize
            min-rows={2}
            maxlength={1024}
            counter
            name="description"
            control={editGroup.controls.description}
            label={t`Channel Description`}
            placeholder={t`This channel is about...`}
          />
          <Show when={props.channel.type === "TextChannel"}>
            <Form2.Select
              label={t`Channel Slowmode`}
              control={editGroup.controls.slowmode}
            >
              <MenuItem value="0">
                <Trans>Slowmode off</Trans>
              </MenuItem>
              <MenuItem value="5">
                <Trans>5 seconds</Trans>
              </MenuItem>
              <MenuItem value="10">
                <Trans>10 seconds</Trans>
              </MenuItem>
              <MenuItem value="30">
                <Trans>30 seconds</Trans>
              </MenuItem>
              <MenuItem value="60">
                <Trans>1 minute</Trans>
              </MenuItem>
              <MenuItem value="300">
                <Trans>5 minutes</Trans>
              </MenuItem>
              <MenuItem value="600">
                <Trans>10 minutes</Trans>
              </MenuItem>
              <MenuItem value="1800">
                <Trans>30 minutes</Trans>
              </MenuItem>
              <MenuItem value="3600">
                <Trans>1 hour</Trans>
              </MenuItem>
              <MenuItem value="7200">
                <Trans>2 hours</Trans>
              </MenuItem>
              <MenuItem value="21600">
                <Trans>6 hours</Trans>
              </MenuItem>
            </Form2.Select>
          </Show>
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
      <Column>
        <Text class="label">
          <Trans>Mark as Mature</Trans>
        </Text>
        <Text>
          <Trans>
            Users will be asked to confirm their age before opening this
            channel.
          </Trans>
        </Text>
        <div>
          <Button
            onPress={() =>
              openModal({
                type: "channel_toggle_mature",
                channel: props.channel,
              })
            }
          >
            <Switch fallback={<Trans>Mark as Mature</Trans>}>
              <Match when={props.channel.mature}>
                <Trans>Unmark as Mature</Trans>
              </Match>
            </Switch>
          </Button>
        </div>
      </Column>
    </Column>
  );
}
