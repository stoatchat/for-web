import { Trans, useLingui } from "@lingui/solid/macro";
import { useDurationFormat } from "@revolt/i18n/durations";
import { typography } from "@revolt/ui";
import {
  createMemo,
  For,
  JSX,
  Match,
  children as resolveChildren,
  Show,
  Switch,
} from "solid-js";
import { API, Permission, Server } from "stoat.js";
import { css, cva } from "styled-system/css";

type WeakRecord<T extends string | number | symbol, ReturnValue> =
  | {
      [K in T]: ReturnValue;
    }
  | Record<string, string>;

export function EditViewer(props: {
  action: API.AuditLogEntryAction;
  server: Server;
}) {
  return (
    <Switch>
      <Match
        when={
          props.action.type === "ChannelEdit" ||
          props.action.type === "ServerEdit"
        }
      >
        <ObjectDiff
          action={
            props.action as API.AuditLogEntryAction &
              ({ type: "ChannelEdit" } | { type: "ServerEdit" })
          }
        />
      </Match>
      <Match when={props.action.type === "MemberEdit"}>
        <MemberDiff
          action={
            props.action as API.AuditLogEntryAction & { type: "MemberEdit" }
          }
          server={props.server}
        />
      </Match>
      <Match when={props.action.type === "ChannelRolePermissionsEdit"}>
        <ChannelRolePermissionsDiff
          action={
            props.action as API.AuditLogEntryAction & {
              type: "ChannelRolePermissionsEdit";
            }
          }
        />
      </Match>
      <Match when={props.action.type === "RoleEdit"}>
        <RoleEditDiff
          action={
            props.action as API.AuditLogEntryAction & { type: "RoleEdit" }
          }
        />
      </Match>
    </Switch>
  );
}

const listItem = cva({
  base: {
    "&::marker": { fontWeight: 600 },
  },
  variants: {
    variant: {
      allow: {
        "&::marker": {
          color: "var(--md-sys-color-primary)",
        },
      },
      deny: {
        "&::marker": {
          color: "var(--md-sys-color-error)",
        },
      },
    },
  },
});

type ObjectEditAction =
  | Extract<API.AuditLogEntryAction, { type: "ChannelEdit" }>
  | Extract<API.AuditLogEntryAction, { type: "MemberEdit" }>
  | Extract<API.AuditLogEntryAction, { type: "ServerEdit" }>;

function ObjectDiff(props: { action: ObjectEditAction }) {
  const changes = createMemo(() =>
    diffObjects(props.action.before, props.action.after),
  );

  return (
    <DiffList>
      <For each={Object.entries(changes())}>
        {([name, change]) => (
          <DiffField key={name} before={change.before} after={change.after} />
        )}
      </For>
    </DiffList>
  );
}

function MemberDiff(props: {
  action: Extract<API.AuditLogEntryAction, { type: "MemberEdit" }>;
  server: Server;
}) {
  const changes = createMemo(() => {
    const { roles: _beforeRoles, ...before } = props.action.before;
    const { roles: _afterRoles, ...after } = props.action.after;
    return diffObjects(before, after);
  });

  const roleChanges = createMemo(() => {
    const before = new Set(props.action.before.roles ?? []);
    const after = new Set(props.action.after.roles ?? []);
    return {
      added: [...after].filter((role) => !before.has(role)),
      removed: [...before].filter((role) => !after.has(role)),
    };
  });

  const roleName = (id: string) => props.server.roles.get(id)?.name ?? id;
  const hasChanges = createMemo(
    () =>
      Object.keys(changes()).length > 0 ||
      roleChanges().added.length > 0 ||
      roleChanges().removed.length > 0,
  );

  return (
    <DiffList>
      <Show when={!hasChanges()}>
        <li>No member changes recorded</li>
      </Show>
      <For each={Object.entries(changes())}>
        {([name, change]) => (
          <DiffField key={name} before={change.before} after={change.after} />
        )}
      </For>
      <Show when={roleChanges().added.length !== 0}>
        <RoleChangeList
          variant="allow"
          title="Added roles"
          roles={roleChanges().added.map(roleName)}
        />
      </Show>
      <Show when={roleChanges().removed.length !== 0}>
        <RoleChangeList
          variant="deny"
          title="Removed roles"
          roles={roleChanges().removed.map(roleName)}
        />
      </Show>
    </DiffList>
  );
}

type ValidFieldNames =
  | keyof API.PartialRole
  | keyof API.PartialServer
  | keyof API.PartialChannel
  | keyof API.PartialMember;

function translateFieldName(
  name: string,
  context?: "server" | "channel" | "role",
): string {
  const { t } = useLingui();
  const translationMap: WeakRecord<ValidFieldNames, string> = {
    description: t`the server description`,
    name:
      context === "server"
        ? t`the server name`
        : context === "channel"
          ? t`the channel name`
          : context === "role"
            ? t`the role name`
            : t`the name`,
    banner: t`the server banner`,
    colour: t`the role colour`,
    hoist: t`display role separately in members list`,
    discoverable: t`discoverable`,
    nickname: t`their nickname`,
    pronouns: t`their pronouns`,
    nsfw: t`not safe for work`,
    slowmode: t`the slowmode duration`,
    timeout: t`the timeout duration`,
    icon:
      context === "server"
        ? t`the server icon`
        : context === "channel"
          ? t`the channel icon`
          : context === "role"
            ? t`the role icon`
            : t`the icon`,
    avatar: t`their avatar`,
  };
  return translationMap[name] ?? name;
}

function RoleChangeList(props: {
  variant: "allow" | "deny";
  title: string;
  roles: string[];
}) {
  return (
    <li class={listItem({ variant: props.variant })}>
      {props.title}
      <ul class={css({ listStyleType: "disc", paddingLeft: "1em" })}>
        <For each={props.roles}>
          {(role) => <li class={typography({ class: "label" })}>{role}</li>}
        </For>
      </ul>
    </li>
  );
}

function DiffList(props: { children: JSX.Element }) {
  const content = resolveChildren(() => props.children);

  return (
    <div class={typography({ class: "body", size: "medium" })}>
      <ol class={css({ listStyleType: "decimal", paddingLeft: "1.2em" })}>
        {content()}
      </ol>
    </div>
  );
}

type FormatValueProps<T> = {
  key: string;
  before?: T;
  after?: T;
};

/**
 * Display the value of a diff
 */
function DiffField<T>(props: FormatValueProps<T>) {
  const duration = useDurationFormat();
  const computedContext = createMemo(() => {
    switch (props.key) {
      case "colour":
        return "colour";
      case "slowmode":
      case "timeout":
        return "duration";
      case "system_messages":
      case "categories":
        return "complex";
      default:
        return undefined;
    }
  });

  const Item = (props: { value: T }) => (
    <Switch fallback={<code>{JSON.stringify(props.value)}</code>}>
      <Match when={computedContext() === "colour"}>
        <span
          class={css({
            display: "inline-block",
            borderRadius: "var(--borderRadius-xs)",
            paddingInline: ".5ch",
          })}
          style={{
            background: props.value as string,
            color: `contrast-color(oklch(from ${props.value} l 0 0))`,
          }}
        >
          {props.value as string}
        </span>
      </Match>
      <Match when={computedContext() === "duration"}>
        {duration({ seconds: props.value as number })}
      </Match>
    </Switch>
  );

  return (
    <li class={listItem()}>
      <Switch
        fallback={
          <Show
            fallback={
              <Trans>
                Changed {translateFieldName(props.key)} to{" "}
                {<Item value={props.after!} />}
              </Trans>
            }
            when={computedContext() === "complex"}
          >
            <Switch>
              <Match when={props.key === "categories"}>
                <Trans>Reorganized channels</Trans>
              </Match>
              <Match when={props.key === "system_messages"}>
                <Trans>Changed system message channels</Trans>
              </Match>
            </Switch>
          </Show>
        }
      >
        <Match when={props.before && !props.after}>
          <Trans>Cleared {translateFieldName(props.key)}</Trans>
        </Match>
        <Match when={!props.before && props.after}>
          <Trans>
            Set {translateFieldName(props.key)} to <Item value={props.after!} />
          </Trans>
        </Match>
      </Switch>
    </li>
  );
}

function ChannelRolePermissionsDiff(props: {
  action: Extract<
    API.AuditLogEntryAction,
    { type: "ChannelRolePermissionsEdit" }
  >;
}) {
  const permissions = createMemo(() => ({
    allow: diffPerms(0n, BigInt(props.action.permissions.allow)),
    deny: diffPerms(0n, BigInt(props.action.permissions.deny)),
  }));

  return (
    <DiffList>
      <PermissionDiff variant="allow" permissions={permissions().allow.after}>
        <Trans>Allowed permissions</Trans>
      </PermissionDiff>
      <PermissionDiff variant="deny" permissions={permissions().deny.after}>
        <Trans>Denied permissions</Trans>
      </PermissionDiff>
    </DiffList>
  );
}

function TranslatablePermissionName(props: {
  permission: keyof typeof Permission;
}) {
  return (
    <Switch fallback={props.permission}>
      <Match when={props.permission === "AssignRoles"}>
        <Trans>Assign roles</Trans>
      </Match>
      <Match when={props.permission === "BanMembers"}>
        <Trans>Ban members</Trans>
      </Match>
      <Match when={props.permission === "BypassSlowmode"}>
        <Trans>Bypass slowmode</Trans>
      </Match>
      <Match when={props.permission === "ChangeAvatar"}>
        <Trans>Change server avatar</Trans>
      </Match>
      <Match when={props.permission === "ChangeNickname"}>
        <Trans>Change server nickname</Trans>
      </Match>
      <Match when={props.permission === "Connect"}>
        <Trans>Join voice channels</Trans>
      </Match>
      <Match when={props.permission === "DeafenMembers"}>
        <Trans>Deafen other members</Trans>
      </Match>
      <Match when={props.permission === "InviteOthers"}>
        <Trans>Create invites to this server</Trans>
      </Match>
      <Match when={props.permission === "KickMembers"}>
        <Trans>Kick members</Trans>
      </Match>
      <Match when={props.permission === "Listen"}>
        <Trans>Listen to others in voice</Trans>
      </Match>
      <Match when={props.permission === "ManageChannel"}>
        <Trans>Manage channels</Trans>
      </Match>
      <Match when={props.permission === "ManageCustomisation"}>
        <Trans>Manage server emoji and information</Trans>
      </Match>
      <Match when={props.permission === "ManageMessages"}>
        <Trans>Delete messages</Trans>
      </Match>
      <Match when={props.permission === "ManageNicknames"}>
        <Trans>Change other member's nicknames</Trans>
      </Match>
      <Match when={props.permission === "ManagePermissions"}>
        <Trans>Manage channel permissions</Trans>
      </Match>
      <Match when={props.permission === "ManageRole"}>
        <Trans>Manage roles</Trans>
      </Match>
      <Match when={props.permission === "ManageServer"}>
        <Trans>Manage server</Trans>
      </Match>
      <Match when={props.permission === "ManageWebhooks"}>
        <Trans>Manage channel webhooks</Trans>
      </Match>
      <Match when={props.permission === "Masquerade"}>
        <Trans>Use masquerade</Trans>
      </Match>
      <Match when={props.permission === "MentionEveryone"}>
        <Trans>Mention everyone and online members</Trans>
      </Match>
      <Match when={props.permission === "MentionRoles"}>
        <Trans>Mention roles</Trans>
      </Match>
      <Match when={props.permission === "MoveMembers"}>
        <Trans>Move members to different voice channels</Trans>
      </Match>
      <Match when={props.permission === "MuteMembers"}>
        <Trans>Mute members in voice channels</Trans>
      </Match>
      <Match when={props.permission === "React"}>
        <Trans>React to messages</Trans>
      </Match>
      <Match when={props.permission === "ReadMessageHistory"}>
        <Trans>Read channel history</Trans>
      </Match>
      <Match when={props.permission === "RemoveAvatars"}>
        <Trans>Remove server avatar</Trans>
      </Match>
      <Match when={props.permission === "SendEmbeds"}>
        <Trans>Send embeds in messages</Trans>
      </Match>
      <Match when={props.permission === "SendMessage"}>
        <Trans>Send messages</Trans>
      </Match>
      <Match when={props.permission === "Speak"}>
        <Trans>Speak in voice channels</Trans>
      </Match>
      <Match when={props.permission === "TimeoutMembers"}>
        <Trans>Timeout other members</Trans>
      </Match>
      <Match when={props.permission === "UploadFiles"}>
        <Trans>Upload attachments and link previews</Trans>
      </Match>
      <Match when={props.permission === "Video"}>
        <Trans>Enable screenshare and camera in voice</Trans>
      </Match>
      <Match when={props.permission === "ViewAuditLogs"}>
        <Trans>View server logs</Trans>
      </Match>
      <Match when={props.permission === "ViewChannel"}>
        <Trans>View channels</Trans>
      </Match>
    </Switch>
  );
}

function PermissionDiff(props: {
  variant: "allow" | "deny";
  permissions: Set<keyof typeof Permission>;
  children: JSX.Element;
}) {
  return (
    <Show when={props.permissions.size !== 0}>
      <li class={listItem({ variant: props.variant })}>
        {props.children}
        <ul class={css({ listStyleType: "disc", paddingLeft: "1em" })}>
          <For each={[...props.permissions]}>
            {(permission) => (
              <li class={typography({ class: "label" })}>
                <TranslatablePermissionName permission={permission} />
              </li>
            )}
          </For>
        </ul>
      </li>
    </Show>
  );
}

function RoleEditDiff<
  T extends API.AuditLogEntryAction & { type: "RoleEdit" },
>(props: { action: T }) {
  const permsDiff = createMemo(() => {
    const a = diffPerms(
      BigInt(props.action.before.permissions?.a ?? 0),
      BigInt(props.action.after.permissions?.a ?? 0),
    );
    const d = diffPerms(
      BigInt(props.action.before.permissions?.d ?? 0),
      BigInt(props.action.after.permissions?.d ?? 0),
    );
    return {
      allow: a.after.difference(a.before),
      deny: d.after.difference(d.before),
    };
  });

  const metaDiff = createMemo(() => {
    const { before: a_before, after: a_after } = props.action;
    const { permissions: _p1, ...before } = a_before;
    const { permissions: _p2, ...after } = a_after;
    return diffObjects(before, after);
  });

  return (
    <DiffList>
      <For each={Object.entries(metaDiff())}>
        {([name, perm]) => {
          return (
            <DiffField key={name} before={perm.before} after={perm.after} />
          );
        }}
      </For>
      <PermissionDiff variant="allow" permissions={permsDiff().allow}>
        Allowed permissions
      </PermissionDiff>
      <PermissionDiff variant="deny" permissions={permsDiff().deny}>
        Denied permissions
      </PermissionDiff>
    </DiffList>
  );
}

// Diffing functions
function diffObjects<T extends object>(
  before: T,
  after: T,
): Partial<{ [K in keyof T]: { before?: T[K]; after?: T[K] } }> {
  const keys = new Set([
    ...(Object.keys(before) as (keyof T)[]),
    ...(Object.keys(after) as (keyof T)[]),
  ]);
  const acc: Partial<{ [K in keyof T]: { before?: T[K]; after?: T[K] } }> = {};

  for (const key of keys as Set<keyof T>) {
    const previousValue = before[key];
    const newValue = after[key];

    if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
      acc[key] = { before: previousValue, after: newValue };
    }
  }

  return acc;
}

function diffPerms(
  before: bigint,
  after: bigint,
): {
  before: Set<keyof typeof Permission>;
  after: Set<keyof typeof Permission>;
} {
  const onlyInBefore = before & ~after;
  const onlyInAfter = after & ~before;
  const acc: {
    before: (keyof typeof Permission)[];
    after: (keyof typeof Permission)[];
  } = { before: [], after: [] };

  for (const [name, flag] of Object.entries(Permission) as [
    keyof typeof Permission,
    bigint,
  ][]) {
    if ((onlyInBefore & flag) == flag) {
      acc.before = [...acc.before, name];
    } else if ((onlyInAfter & flag) == flag) {
      acc.after = [...acc.after, name];
    }
  }

  return {
    before: new Set(acc.before),
    after: new Set(acc.after),
  };
}
