import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  on,
  Show,
  Suspense,
  Switch,
} from "solid-js";

import { plural } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/solid/macro";
import { useClient } from "@revolt/client";
import { useUser } from "@revolt/markdown/users";
import {
  Avatar,
  CategoryButton,
  CircularProgress,
  Column,
  Deferred,
  Row,
  Symbol,
  Time,
  typography,
} from "@revolt/ui";
import {
  ListView2,
  ListView2Update,
} from "@revolt/ui/components/utils/ListView2";
import { API, Permission, Server } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { decodeTime } from "ulid";

const FETCH_LIMIT = 50;
const DISPLAY_LIMIT = 150;
const INITIAL_FETCH_LIMIT = 30;

/**
 * Show tracked/logged changes to the server
 */
export function AuditLog(props: { server: Server }) {
  const [logs, setLogs] = createSignal<API.AuditLogEntry[]>([]);
  const [fetching, setFetching] = createSignal<
    "initial" | "upwards" | "downwards"
  >();
  const [failure, setFailure] = createSignal(false);
  const [atStart, setStart] = createSignal(true);
  const [atEnd, setEnd] = createSignal(true);

  let preemptFetch: () => void | undefined;

  function canFetch() {
    return !fetching || failure();
  }

  function preempt() {
    batch(() => {
      setFetching();
      setFailure(false);
      preemptFetch?.();
    });
  }

  function newPreempted() {
    let preempted = false;
    preemptFetch = () => {
      preempted = true;
    };

    return () => preempted;
  }

  async function caseInitialLoad() {
    preempt();
    setFetching("initial");
    const preempted = newPreempted();

    setLogs([]);
    try {
      const logs = await props.server
        .getAuditLogs({
          limit: INITIAL_FETCH_LIMIT,
        })
        .then(({ audit_logs }) => audit_logs);

      if (preempted()) return;

      setLogs(logs);
      setFetching();
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchUpwards(): Promise<ListView2Update | undefined> {
    if (atStart() || !canFetch()) return;

    setFetching("upwards");
    const preempted = newPreempted();
    try {
      const res = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        before: logs().slice(-1)[0]._id,
      });

      if (preempted()) return;
      if (res.audit_logs.length < FETCH_LIMIT) {
        setStart(true);
      }

      if (res.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          res.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setEnd(false);
        }

        const alogs = logs();
        return {
          scrollAnchorId: alogs[alogs.length - 1]._id,
          commitToDOM() {
            setLogs([...alogs, ...res.audit_logs]);

            if (tooManyBy) {
              setLogs((prev) => {
                return prev.slice(tooManyBy);
              });
            }

            setFetching();
          },
        };
      } else {
        setFetching();
      }
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchDownwards(): Promise<ListView2Update | undefined> {
    if (atEnd() || !canFetch()) return;

    setFetching("downwards");
    const preempted = newPreempted();

    try {
      const result = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        after: logs()[0]._id,
      });

      if (preempted()) return;

      if (result.audit_logs.length < FETCH_LIMIT) {
        setEnd(true);
      }

      if (result.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          result.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setStart(false);
        }

        return {
          scrollAnchorId: logs()[0]._id,
          commitToDOM() {
            setLogs(() => {
              return [...result.audit_logs.reverse(), ...logs()];
            });

            if (tooManyBy) {
              setLogs((prev) => prev.slice(0, -tooManyBy));
            }

            setFetching();
          },
        };
      } else {
        setFetching();
      }
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  createEffect(
    on(
      () => props.server,
      () => {
        console.log("Fetching");
        caseInitialLoad();
      },
    ),
  );

  return (
    <>
      <ListView2
        fetchTop={caseFetchUpwards}
        fetchBottom={caseFetchDownwards}
        atStart={atStart}
        atEnd={atEnd}
        permitFetching={() => typeof fetching() !== "string"}
      >
        <CategoryButton.Group>
          <Deferred>
            <For each={logs()}>
              {(entry) => {
                if (
                  (entry.action.type === "MemberEdit" &&
                    entry.action.user === entry.user) ||
                  (
                    [
                      "ChannelEdit",
                      "ChannelRolePermissionsEdit",
                      "ServerEdit",
                      "RoleEdit",
                      "RolesReorder",
                    ] as API.AuditLogEntryAction["type"][]
                  ).includes(entry.action.type)
                ) {
                  return (
                    <CategoryButton.Collapse
                      icon={<ActionIcon type={entry.action.type} />}
                      title={<EntryTitle entry={entry} />}
                    >
                      <EditViewer action={entry.action} />
                    </CategoryButton.Collapse>
                  );
                }
                return (
                  <CategoryButton
                    ignoreClick
                    icon={<ActionIcon type={entry.action.type} />}
                  >
                    <EntryTitle entry={entry} />
                  </CategoryButton>
                );
              }}
            </For>
          </Deferred>
        </CategoryButton.Group>
      </ListView2>
    </>
  );
}

function EntryTitle(props: { entry: API.AuditLogEntry }) {
  const title = useActionTranslation();

  const userID = () => props.entry.user;
  const user = useUser(userID);

  return (
    <Row align>
      <Suspense fallback={<CircularProgress />}>
        <Avatar
          size={24}
          src={user()?.user?.animatedAvatarURL}
          fallback={user()?.username ?? "Unknown"}
        />
      </Suspense>
      <Column gap="xs">
        <span class={typography({ class: "title", size: "small" })}>
          {title(props.entry)}
        </span>
        <span class={typography({ class: "label" })}>
          <Show when={props.entry.reason}>
            <span>{props.entry.reason} - </span>
          </Show>
          <Time format="relative" value={decodeTime(props.entry._id)} />
        </span>
      </Column>
    </Row>
  );
}

function useActionTranslation() {
  const { t } = useLingui();
  const client = useClient();

  return (entry: API.AuditLogEntry) => {
    const user = client().users.get(entry.user);
    // This server will always be in cache unless it's deleted, then everything is fucked
    const thisServer = client().servers.get(entry.server)!;
    const action = entry.action;
    switch (action.type) {
      case "MessageDelete": {
        const channel = client().channels.get(action.channel);
        const author = client().users.get(action.author);
        return t`@${user?.username} deleted a message from @${author?.username} in #${channel?.name}`;
      }
      case "MessageBulkDelete": {
        const channel = client().channels.get(action.channel);
        return plural(action.count, {
          one: `@${user?.username ?? "unknown"} deleted 1 message in '#'${channel?.name}`,
          other: `@${user?.username ?? "unknown"} deleted ${action.count} messages in '#'${channel?.name}`,
        });
      }
      case "MessagePin": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username ?? "unknown"} pinned a message in #${channel?.name}`;
      }
      case "MessageUnpin": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username ?? "unknown"} unpinned a message in #${channel?.name}`;
      }
      case "BanCreate": {
        const bannedUser = client().users.get(action.user);
        return t`@${user?.username} banned @${bannedUser?.username}`;
      }
      case "BanDelete": {
        const bannedUser = client().users.get(action.user);
        return t`@${user?.username} pardoned @${bannedUser?.username}`;
      }
      case "ChannelCreate":
        return t`@${user?.username} created #${action.name}`;
      case "ChannelDelete":
        return t`@${user?.username} deleted #${action.name}`;
      case "ChannelEdit": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} edited #${channel?.name}`;
      }
      case "ChannelRolePermissionsEdit": {
        const role = thisServer.roles.get(action.role);
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} edited permissions for "${role?.name}" in #${channel?.name}`;
      }
      case "EmojiCreate":
        return t`@${user?.username} created a new emoji`;
      case "EmojiDelete":
        return t`@${user?.username} removed the :${action.name}: emoji`;
      case "EmojiUpdate":
        return t`@${user?.username} renamed :${action.before.name}: to :${action.after.name}:`;
      case "MemberEdit": {
        const member = client().users.get(action.user);
        if (entry.user === action.user) {
          return t`@${user?.username} changed their server identity`;
        }
        return t`@${user?.username} changed @${member?.username}'s nickname to ${action.after.nickname}`;
      }
      case "MemberKick": {
        const kickedUser = client().users.get(action.user);
        return t`@${user?.username} kicked ${kickedUser?.username}`;
      }
      case "ServerEdit":
        return t`@${user?.username} edited this server`;
      case "RoleEdit": {
        const role = thisServer.roles.get(action.role);
        return t`@${user?.username} edited the "${role?.name}" role`;
      }
      case "RoleCreate": {
        return t`@${user?.username} created the "${(entry.action as { type: "RoleCreate" } & API.AuditLogEntryAction).name}" role`;
      }
      case "RoleDelete": {
        const role = thisServer.roles.get(action.role);
        return t`@${user?.username} deleted the "${role?.name}" role`;
      }
      case "RolesReorder":
        return t`@${user?.username} changed the position of roles`;
      case "InviteCreate":
        return t`@${user?.username} created an invite`;
      case "InviteDelete":
        return t`@${user?.username} revoked an invite`;
      case "WebhookCreate": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} created a webhook in #${channel?.name}`;
      }
      case "WebhookDelete": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} deleted a webhook in #${channel?.name}`;
      }
    }
  };
}

function EditViewer(props: { action: API.AuditLogEntryAction }) {
  return (
    <Show
      fallback={<span>TODO</span>}
      when={["RoleEdit"].includes(props.action.type)}
    >
      <RoleEditDiff
        action={props.action as API.AuditLogEntryAction & { type: "RoleEdit" }}
      />
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
    <div class={typography({ class: "body", size: "large" })}>
      <ol class={css({ listStyleType: "decimal", paddingLeft: "1.2em" })}>
        <For each={Object.entries(metaDiff())}>
          {([name, perm]) => {
            return (
              <Switch
                fallback={
                  <DiffListItem>
                    <Trans>
                      Changed {name} to {JSON.stringify(perm.after)}
                    </Trans>
                  </DiffListItem>
                }
              >
                <Match when={perm.before && !perm.after}>
                  <DiffListItem variant="deny">
                    <Trans>Removed {name}</Trans>
                  </DiffListItem>
                </Match>
                <Match when={!perm.before && perm.after}>
                  <DiffListItem variant="allow">
                    <Trans>
                      Set {name} to {JSON.stringify(perm.after)}
                    </Trans>
                  </DiffListItem>
                </Match>
              </Switch>
            );
          }}
        </For>
        <Show when={permsDiff().allow.size !== 0}>
          <DiffListItem variant="allow">
            <Trans>Allowed permissions</Trans>
            <ul class={css({ listStyleType: "disc", paddingLeft: "1em" })}>
              <For each={[...permsDiff().allow]}>
                {(perm) => {
                  return <li class={typography({ class: "label" })}>{perm}</li>;
                }}
              </For>
            </ul>
          </DiffListItem>
        </Show>
        <Show when={permsDiff().deny.size !== 0}>
          <DiffListItem variant="deny">
            <Trans>Removed Permissions</Trans>
            <ul class={css({ listStyleType: "disc", paddingLeft: "1em" })}>
              <For each={[...permsDiff().deny]}>
                {(perm) => {
                  return <li class={typography({ class: "label" })}>{perm}</li>;
                }}
              </For>
            </ul>
          </DiffListItem>{" "}
        </Show>
      </ol>
    </div>
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

    acc[key] = {
      before: previousValue,
      after: newValue,
    };
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

type ActionIconProps = {
  type: API.AuditLogEntryAction["type"];
};

/**
 * Show the proper icon for the passed action
 */
function ActionIcon(props: ActionIconProps) {
  return (
    <Switch fallback={<Symbol>question_mark</Symbol>}>
      <Match
        when={
          props.type === "MessageDelete" ||
          props.type === "ChannelDelete" ||
          props.type === "RoleDelete" ||
          props.type === "WebhookDelete" ||
          props.type === "EmojiDelete"
        }
      >
        <Symbol>delete</Symbol>
      </Match>
      <Match when={props.type === "MessageBulkDelete"}>
        <Symbol>delete_sweep</Symbol>
      </Match>
      <Match when={props.type === "MessagePin"}>
        <Symbol>keep</Symbol>
      </Match>
      <Match when={props.type === "MessageUnpin"}>
        <Symbol>keep_off</Symbol>
      </Match>
      <Match when={props.type === "BanCreate"}>
        <Symbol>gavel</Symbol>
      </Match>
      <Match when={props.type === "BanDelete"}>
        <Symbol>person_check</Symbol>
      </Match>
      <Match when={props.type === "ChannelCreate"}>
        <Symbol>tag</Symbol>
      </Match>
      <Match when={props.type === "RoleCreate"}>
        <Symbol>new_label</Symbol>
      </Match>
      <Match
        when={
          props.type === "ChannelEdit" ||
          props.type === "ChannelRolePermissionsEdit" ||
          props.type === "RoleEdit" ||
          props.type === "EmojiUpdate" ||
          props.type === "ServerEdit"
        }
      >
        <Symbol>edit</Symbol>
      </Match>
      <Match when={props.type === "MemberEdit"}>
        <Symbol>person_edit</Symbol>
      </Match>
      <Match when={props.type === "WebhookCreate"}>
        <Symbol>webhook</Symbol>
      </Match>
      <Match when={props.type === "MemberKick"}>
        <Symbol>person_remove</Symbol>
      </Match>
      <Match when={props.type === "RolesReorder"}>
        <Symbol>reorder</Symbol>
      </Match>
      <Match when={props.type === "InviteCreate"}>
        <Symbol>add_link</Symbol>
      </Match>
      <Match when={props.type === "InviteDelete"}>
        <Symbol>link_off</Symbol>
      </Match>
      <Match when={props.type === "EmojiCreate"}>
        <Symbol>add_reaction</Symbol>
      </Match>
    </Switch>
  );
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
