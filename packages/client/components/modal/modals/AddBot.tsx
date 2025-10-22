import { createFormControl, createFormGroup } from "solid-forms";
import { Show, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Server } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { decodeTime } from "ulid";

import { useClient } from "@revolt/client";
import { Markdown } from "@revolt/markdown";
import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Form2,
  Ripple,
  Text,
  TextField,
  Time,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to join a server
 */
export function AddBotModal(props: DialogProps & Modals & { type: "add_bot" }) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const [filter, setFilter] = createSignal("");

  const filterLowercase = createMemo(() => filter().toLowerCase());

  const availableGroups = createMemo(() => {
    const instance = client();

    return [
      ...instance.servers
        .filter((server) => server.havePermission("ManageServer"))
        // this won't always work, but we might as well try:
        .filter((server) => !server.getMember(props.invite.id)),
      ...instance.channels
        .filter((channel) => channel.type === "Group")
        .filter((channel) => !channel.recipientIds.has(props.invite.id)),
    ]
      .filter((group) => group.name.toLowerCase().includes(filterLowercase()))
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({ item, value: item.id }));
  });

  const group = createFormGroup({
    id: createFormControl([] as string[], {
      required: true,
    }),
  });

  async function onSubmit() {
    try {
      const entry = availableGroups().find(
        (entry) => entry.value === group.controls.id.value[0],
      )!;

      if (entry.item instanceof Server) {
        await props.invite.addToServer(entry.item);
      } else {
        await props.invite.addToGroup(entry.item);
      }

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Add</Trans>,
          onClick: () => {
            onSubmit(); // doesn't go through submitHandler!
            //             much like other modals don't either
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={Form2.submitHandler(group, onSubmit)}>
        <Column>
          <Column align>
            <Avatar
              size={64}
              src={props.invite.avatar?.originalUrl} // todo: correct URL
              fallback={props.invite.username}
            />
            <Text class="title">{props.invite.username}</Text>
            <Text class="label">
              <Trans>
                Registered since{" "}
                <Time format="calendar" value={decodeTime(props.invite.id)} />
              </Trans>
            </Text>
          </Column>

          <Show when={props.invite.description}>
            <div use:scrollable={{ class: description() }}>
              <Markdown content={props.invite.description} />
              <ProvidedBy>
                <Text class="label" size="small">
                  <Trans>Description provided by {props.invite.username}</Trans>
                </Text>
                <CoverText>
                  <div />
                </CoverText>
              </ProvidedBy>
            </div>
          </Show>

          <TextField
            value={filter()}
            variant="filled"
            placeholder={t`Search for groups...`}
            onKeyUp={(e) => setFilter(e.currentTarget.value)}
          />

          <Form2.VirtualSelect
            control={group.controls.id}
            items={availableGroups()}
            selectHeight="240px"
          >
            {(item, selected) => (
              <Item selected={selected}>
                <Ripple />
                <Avatar
                  src={item.animatedIconURL}
                  fallback={item.name}
                  size={24}
                  shape={item instanceof Server ? "circle" : "rounded-square"}
                />{" "}
                <span>{item.name}</span>
              </Item>
            )}
          </Form2.VirtualSelect>

          <Column gap="sm" align>
            <Text class="label" size="small">
              Bots are not verified by Stoat.
            </Text>
            <Text class="label" size="small">
              The bot will not be granted any permissions.
            </Text>
          </Column>
        </Column>
      </form>
    </Dialog>
  );
}

const description = cva({
  base: {
    position: "relative",
    maxHeight: "120px",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-lg)",
    color: "var(--md-sys-color-on-secondary-container)",
    background: "var(--md-sys-color-secondary-container)",
  },
});

const ProvidedBy = styled("div", {
  base: {
    bottom: 0,
    position: "sticky",
    background: "var(--md-sys-color-secondary-container)",
  },
});

const CoverText = styled("div", {
  base: {
    position: "relative",

    "& *": {
      top: 0,
      width: "100%",
      position: "absolute",
      height: "var(--gap-md)",
      background: "var(--md-sys-color-secondary-container)",
    },
  },
});

const Item = styled("div", {
  base: {
    height: "40px",
    display: "flex",
    position: "relative",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-sm)",
  },
  variants: {
    selected: {
      true: {
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",
      },
    },
  },
});
