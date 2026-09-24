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
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

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
      <Match when={props.action.type === "RolesReorder"}>
        <RoleReorderDiff
          action={
            props.action as API.AuditLogEntryAction & { type: "RolesReorder" }
          }
          server={props.server}
        />
      </Match>
    </Switch>
  );
}

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
        {([name, change]) => <DiffValue name={name} change={change} />}
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
        <DiffListItem>No member changes recorded</DiffListItem>
      </Show>
      <For each={Object.entries(changes())}>
        {([name, change]) => (
          <DiffValue name={memberFieldName(name)} change={change} />
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

function memberFieldName(name: string) {
  return (
    {
      nickname: "nickname",
      pronouns: "pronouns",
      avatar: "avatar",
      timeout: "timeout",
      can_publish: "publish permission",
      can_receive: "receive permission",
    }[name] ?? name
  );
}

function RoleChangeList(props: {
  variant: "allow" | "deny";
  title: string;
  roles: string[];
}) {
  return (
    <DiffListItem variant={props.variant}>
      {props.title}
      <ul class={css({ listStyleType: "disc", paddingLeft: "1em" })}>
        <For each={props.roles}>
          {(role) => <li class={typography({ class: "label" })}>{role}</li>}
        </For>
      </ul>
    </DiffListItem>
  );
}

function DiffList(props: { children: JSX.Element }) {
  const content = resolveChildren(() => props.children);

  return (
    <div class={typography({ class: "body", size: "large" })}>
      <ol class={css({ listStyleType: "decimal", paddingLeft: "1.2em" })}>
        {content()}
      </ol>
    </div>
  );
}

function DiffValue(props: {
  name: string;
  change: { before?: unknown; after?: unknown };
}) {
  const beforeMissing = () => props.change.before === undefined;
  const afterMissing = () => props.change.after === undefined;

  return (
    <Switch
      fallback={
        <DiffListItem>
          Changed {props.name} to {formatDiffValue(props.change.after)}
        </DiffListItem>
      }
    >
      <Match when={afterMissing()}>
        <DiffListItem variant="deny">Removed {props.name}</DiffListItem>
      </Match>
      <Match when={beforeMissing()}>
        <DiffListItem variant="allow">
          Set {props.name} to {formatDiffValue(props.change.after)}
        </DiffListItem>
      </Match>
    </Switch>
  );
}

function formatDiffValue(value: unknown) {
  if (typeof value === "string") return '"' + value + '"';
  if (value === null) return "null";
  if (typeof value === "bigint") return value.toString();
  return JSON.stringify(value);
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
        Allowed permissions
      </PermissionDiff>
      <PermissionDiff variant="deny" permissions={permissions().deny.after}>
        Denied permissions
      </PermissionDiff>
    </DiffList>
  );
}

function PermissionDiff(props: {
  variant: "allow" | "deny";
  permissions: Set<keyof typeof Permission>;
  children: JSX.Element;
}) {
  return (
    <Show when={props.permissions.size !== 0}>
      <DiffListItem variant={props.variant}>
        {props.children}
        <ul class={css({ listStyleType: "disc", paddingLeft: "1em" })}>
          <For each={[...props.permissions]}>
            {(permission) => (
              <li class={typography({ class: "label" })}>{permission}</li>
            )}
          </For>
        </ul>
      </DiffListItem>
    </Show>
  );
}

function RoleReorderDiff(props: {
  action: Extract<API.AuditLogEntryAction, { type: "RolesReorder" }>;
  server: Server;
}) {
  const moved = createMemo(() => {
    const before = props.action.before;
    return props.action.after
      .map((role, index) => ({ role, index, previous: before.indexOf(role) }))
      .filter(({ index, previous }) => previous !== -1 && index !== previous);
  });

  return (
    <DiffList>
      <For each={moved()}>
        {(change) => (
          <DiffListItem>
            Moved {props.server.roles.get(change.role)?.name ?? change.role}{" "}
            from position {change.previous + 1} to position {change.index + 1}
          </DiffListItem>
        )}
      </For>
    </DiffList>
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
          return <DiffValue name={name} change={perm} />;
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

const DiffListItem = styled("li", {
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
