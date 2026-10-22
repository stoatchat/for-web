import { createFormControl, createFormGroup } from "solid-forms";
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { Server } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { decodeTime } from "ulid";

import { usePermissionEntries } from "@revolt/app/interface/settings/channel/permissions/ChannelPermissionsEditor";
import { useClient } from "@revolt/client";
import { Markdown } from "@revolt/markdown";
import {
  Avatar,
  Checkbox2,
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

  // must be declared before anything that reads it eagerly (createMemo / createEffect)
  const group = createFormGroup({
    id: createFormControl([] as string[], {
      required: true,
    }),
  });

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

  const entries = usePermissionEntries();

  /**
   * Permissions the bot asks for (0n if the instance doesn't send any)
   */
  const requested = () => BigInt(props.invite.defaultPermissions ?? 0);

  const selectedItem = createMemo(
    () =>
      availableGroups().find((e) => e.value === group.controls.id.value[0])
        ?.item,
  );

  const selectedServer = createMemo(() => {
    const item = selectedItem();
    return item instanceof Server ? item : undefined;
  });

  const canGrant = () => !!selectedServer()?.havePermission("ManageRole");

  /**
   * What the permission picker is currently able to do
   */
  const mode = (): "none" | "group" | "no_role" | "ok" => {
    if (!selectedItem()) return "none";
    if (!selectedServer()) return "group";
    if (!canGrant()) return "no_role";
    return "ok";
  };

  /**
   * Requested permissions the current user is actually allowed to hand out
   */
  const grantable = createMemo(() => {
    const server = selectedServer();
    if (!server || !canGrant()) return 0n;
    return requested() & BigInt(server.permission);
  });

  const [granted, setGranted] = createSignal(0n);
  createEffect(() => setGranted(grantable())); // reset on server change

  const requestedEntries = () =>
    entries.filter((e) => (requested() & e.value) === e.value);

  const dropped = () => requested() & ~grantable();

  async function onSubmit() {
    try {
      const entry = availableGroups().find(
        (entry) => entry.value === group.controls.id.value[0],
      )!;

      if (entry.item instanceof Server) {
        await props.invite.addToServer(
          entry.item,
          granted() !== 0n ? granted() : undefined,
        );
      } else {
        await props.invite.addToGroup(entry.item);
      }

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
      <form onSubmit={submit}>
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

          <Show when={requested() !== 0n}>
            <Column gap="sm">
              <Text class="label">
                <Trans>Requested permissions</Trans>
              </Text>

              <div
                style={{
                  opacity: mode() === "ok" ? 1 : 0.5,
                  "pointer-events": mode() === "ok" ? "auto" : "none",
                }}
              >
                <div use:scrollable={{ class: permissionList() }}>
                  <For each={requestedEntries()}>
                    {(entry) => {
                      const allowed = () => {
                        const server = selectedServer();
                        return (
                          !!server &&
                          (BigInt(server.permission) & entry.value) ===
                            entry.value
                        );
                      };

                      return (
                        <Checkbox2
                          name={entry.key}
                          checked={(granted() & entry.value) === entry.value}
                          disabled={mode() !== "ok" || !allowed()}
                          onChange={(e) =>
                            setGranted((v) =>
                              e.currentTarget.checked
                                ? v | entry.value
                                : v & ~entry.value,
                            )
                          }
                        >
                          <Column gap="none">
                            <Text class="title" size="small">
                              {entry.title}
                            </Text>
                            <Text class="label" size="small">
                              {entry.description.Server ??
                                entry.description.Any}
                            </Text>
                          </Column>
                        </Checkbox2>
                      );
                    }}
                  </For>
                </div>
              </div>

              <Text class="label" size="small">
                <Switch>
                  <Match when={mode() === "none"}>
                    <Trans>
                      Select a server to choose which permissions to grant.
                    </Trans>
                  </Match>
                  <Match when={mode() === "group"}>
                    <Trans>
                      Permissions can only be granted when adding to a server.
                    </Trans>
                  </Match>
                  <Match when={mode() === "no_role"}>
                    <Trans>
                      You need Manage Roles on this server to grant permissions.
                      The bot will be added without any.
                    </Trans>
                  </Match>
                  <Match when={dropped() !== 0n}>
                    <Trans>
                      Some requested permissions can't be granted because you
                      don't have them.
                    </Trans>
                  </Match>
                </Switch>
              </Text>
            </Column>
          </Show>

          <Column gap="sm" align>
            <Text class="label" size="small">
              Bots are not verified by Stoat.
            </Text>
            <Show when={requested() === 0n || mode() !== "none"}>
              <Text class="label" size="small">
                <Show
                  when={granted() !== 0n}
                  fallback={
                    <Trans>The bot will not be granted any permissions.</Trans>
                  }
                >
                  <Trans>
                    The bot will be granted the selected permissions.
                  </Trans>
                </Show>
              </Text>
            </Show>
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

const permissionList = cva({
  base: {
    maxHeight: "160px",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-lg)",
  },
});
