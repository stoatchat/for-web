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
  Checkbox,
  Column,
  Dialog,
  DialogProps,
  Form2,
  Ripple,
  Symbol,
  Text,
  TextField,
  Time,
  Tooltip,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Permission keys that deserve a warning flag.
 */
const DANGEROUS_PERMISSIONS = new Set([
  "ManageServer",
  "ManageRole",
  "ManagePermissions",
  "ManageChannel",
  "ManageWebhooks",
  "ManageMessages",
  "KickMembers",
  "BanMembers",
  "TimeoutMembers",
  "AssignRoles",
  "MentionEveryone",
]);

const isDangerous = (key: string) => DANGEROUS_PERMISSIONS.has(key);

/**
 * Modal to add a bot to a server / group
 */
export function AddBotModal(props: DialogProps & Modals & { type: "add_bot" }) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const [step, setStep] = createSignal<"select" | "permissions">("select");
  const [filter, setFilter] = createSignal("");
  const filterLowercase = createMemo(() => filter().toLowerCase());

  const group = createFormGroup({
    id: createFormControl([] as string[], { required: true }),
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

  /** Whether the permissions step is worth showing at all */
  const needsPermissionStep = () => requested() !== 0n && mode() === "ok";

  const grantable = createMemo(() => {
    const server = selectedServer();
    if (!server || !canGrant()) return 0n;
    return requested() & BigInt(server.permission);
  });

  const [granted, setGranted] = createSignal(0n);
  createEffect(() => setGranted(grantable())); // reset on server change

  const requestedEntries = () =>
    entries
      .filter((e) => (requested() & e.value) === e.value)
      .toSorted(
        (a, b) => Number(isDangerous(b.key)) - Number(isDangerous(a.key)),
      );

  const hasDangerous = () =>
    requestedEntries().some(
      (e) => isDangerous(e.key) && (granted() & e.value) === e.value,
    );

  const dropped = () => requested() & ~grantable();

  const isAllowed = (value: bigint) => {
    const server = selectedServer();
    return !!server && (BigInt(server.permission) & value) === value;
  };

  async function onSubmit() {
    try {
      const entry = availableGroups().find(
        (entry) => entry.value === group.controls.id.value[0],
      )!;

      if (entry.item instanceof Server) {
        props.invite.addToServer(
          entry.item,
          granted() !== 0n ? granted() : undefined,
        );
      } else {
        props.invite.addToGroup(entry.item);
      }

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  const actions = () =>
    step() === "select"
      ? [
          { text: <Trans>Cancel</Trans> },
          needsPermissionStep()
            ? {
                text: <Trans>Next</Trans>,
                onClick: () => {
                  setStep("permissions");
                  return false; // keep the dialog open
                },
                isDisabled: !Form2.canSubmit(group),
              }
            : {
                text: <Trans>Add</Trans>,
                onClick: () => {
                  onSubmit();
                  return false;
                },
                isDisabled: !Form2.canSubmit(group),
              },
        ]
      : [
          {
            text: <Trans>Back</Trans>,
            onClick: () => {
              setStep("select");
              return false;
            },
          },
          {
            text: <Trans>Add</Trans>,
            onClick: () => {
              onSubmit();
              return false;
            },
          },
        ];

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      actions={actions()}
      isDisabled={group.isPending}
    >
      <Switch>
        <Match when={step() === "select"}>
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
                    <Time
                      format="calendar"
                      value={decodeTime(props.invite.id)}
                    />
                  </Trans>
                </Text>
              </Column>

              <Show when={props.invite.description}>
                <div use:scrollable={{ class: description() }}>
                  <Markdown content={props.invite.description} />
                  <ProvidedBy>
                    <Text class="label" size="small">
                      <Trans>
                        Description provided by {props.invite.username}
                      </Trans>
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
                      shape={
                        item instanceof Server ? "circle" : "rounded-square"
                      }
                    />{" "}
                    <span>{item.name}</span>
                  </Item>
                )}
              </Form2.VirtualSelect>

              <Column gap="sm" align>
                <Text class="label" size="small">
                  <Trans>Bots are not endorsed by Stoat.</Trans>
                </Text>

                <Show when={needsPermissionStep()}>
                  <Text class="label" size="small">
                    <Trans>The bot will ask for permissions.</Trans>
                  </Text>
                </Show>

                <Show when={requested() !== 0n && mode() === "no_role"}>
                  <Text class="label" size="small">
                    <Trans>
                      You need Manage Roles on this server to grant permissions.
                      The bot will be added without any.
                    </Trans>
                  </Text>
                </Show>

                <Show when={requested() !== 0n && mode() === "group"}>
                  <Text class="label" size="small">
                    <Trans>
                      Permissions can only be granted when adding to a server.
                    </Trans>
                  </Text>
                </Show>
              </Column>
            </Column>
          </form>
        </Match>

        <Match when={step() === "permissions"}>
          <Column>
            <Column align>
              <Avatar
                size={64}
                src={props.invite.avatar?.originalUrl}
                fallback={props.invite.username}
              />
              <Text class="title">
                <Trans>
                  Add {props.invite.username} to {selectedItem()?.name}
                </Trans>
              </Text>
              <Text class="label">
                <Trans>This bot is requesting the following permissions</Trans>
              </Text>
            </Column>

            <Show when={hasDangerous()}>
              <Warning role="alert">
                <Symbol size={24}>warning</Symbol>
                <Text class="label" size="small">
                  <Trans>
                    This bot is requesting powerful permissions. Only grant them
                    if you trust it.
                  </Trans>
                </Text>
              </Warning>
            </Show>

            <div use:scrollable={{ class: permissionList() }}>
              <For each={requestedEntries()}>
                {(entry) => (
                  <Checkbox
                    name={entry.key}
                    checked={(granted() & entry.value) === entry.value}
                    disabled={!isAllowed(entry.value)}
                    onChange={(e) =>
                      setGranted((v) =>
                        e.currentTarget.checked
                          ? v | entry.value
                          : v & ~entry.value,
                      )
                    }
                  >
                    <Column gap="none">
                      <Row>
                        <Text class="title" size="small">
                          {entry.title}
                        </Text>
                        <Show when={isDangerous(entry.key)}>
                          <Tooltip
                            placement="top"
                            content={<Trans>Dangerous permission</Trans>}
                            aria={t`Dangerous permission`}
                          >
                            <DangerIcon>
                              <Symbol size={18}>warning</Symbol>
                            </DangerIcon>
                          </Tooltip>
                        </Show>
                      </Row>
                      <Text class="label" size="small">
                        {entry.description.Server ?? entry.description.Any}
                      </Text>
                    </Column>
                  </Checkbox>
                )}
              </For>
            </div>

            <Column gap="sm" align>
              <Show when={dropped() !== 0n}>
                <Text class="label" size="small">
                  <Trans>
                    Some requested permissions can't be granted because you
                    don't have them.
                  </Trans>
                </Text>
              </Show>
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
            </Column>
          </Column>
        </Match>
      </Switch>
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
    maxHeight: "320px",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-lg)",
  },
});

const Row = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",
  },
});

const DangerIcon = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    color: "var(--md-sys-color-error)",
  },
});

const Warning = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md) var(--gap-lg)",
    borderRadius: "var(--borderRadius-lg)",
    color: "var(--md-sys-color-on-error-container)",
    background: "var(--md-sys-color-error-container)",
  },
});
