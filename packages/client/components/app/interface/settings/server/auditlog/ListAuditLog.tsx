import {
  For,
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
} from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { Server, User } from "stoat.js";
import { decodeTime } from "ulid";

import {
  Avatar,
  CircularProgress,
  DataTable,
  Row,
  Text,
  TextField,
  Time,
} from "@revolt/ui";

/**
 * One entry as returned by the audit log route
 */
type AuditLogEntry = Awaited<
  ReturnType<Server["getAuditLogs"]>
>["audit_logs"][number];

/**
 * Human readable sentence for an audit log action.
 *
 * The API models every action as a distinct shape, so this maps each one to a
 * short description rather than dumping the raw payload.
 */
function describeAction(action: AuditLogEntry["action"]): JSX.Element {
  switch (action.type) {
    case "MessageDelete":
      return <Trans>Deleted a message</Trans>;
    case "MessageBulkDelete":
      return <Trans>Deleted {action.count} messages</Trans>;
    case "MessagePin":
      return <Trans>Pinned a message</Trans>;
    case "MessageUnpin":
      return <Trans>Unpinned a message</Trans>;
    case "BanCreate":
      return <Trans>Banned a member</Trans>;
    case "BanDelete":
      return <Trans>Unbanned a member</Trans>;
    case "ChannelCreate":
      return <Trans>Created channel {action.name}</Trans>;
    case "ChannelEdit":
      return <Trans>Edited a channel</Trans>;
    case "ChannelDelete":
      return <Trans>Deleted a channel</Trans>;
    case "ChannelRolePermissionsEdit":
      return <Trans>Changed channel permissions for a role</Trans>;
    case "MemberEdit":
      return <Trans>Edited a member</Trans>;
    case "MemberKick":
      return <Trans>Kicked a member</Trans>;
    case "ServerEdit":
      return <Trans>Edited the server</Trans>;
    case "RoleCreate":
      return <Trans>Created a role</Trans>;
    case "RoleEdit":
      return <Trans>Edited a role</Trans>;
    case "RoleDelete":
      return <Trans>Deleted a role</Trans>;
    case "RolesReorder":
      return <Trans>Reordered roles</Trans>;
    case "InviteCreate":
      return <Trans>Created an invite</Trans>;
    case "InviteDelete":
      return <Trans>Deleted an invite</Trans>;
    case "WebhookCreate":
      return <Trans>Created a webhook</Trans>;
    case "WebhookDelete":
      return <Trans>Deleted a webhook</Trans>;
    case "EmojiCreate":
      return <Trans>Created an emoji</Trans>;
    case "EmojiUpdate":
      return <Trans>Updated an emoji</Trans>;
    case "EmojiDelete":
      return <Trans>Deleted an emoji</Trans>;
    default:
      // new action types can appear before this list is updated
      return <>{(action as { type: string }).type}</>;
  }
}

/**
 * Show the actions moderators have taken in this server
 */
export function ListAuditLog(props: { server: Server }) {
  const { t } = useLingui();

  const query = useQuery(() => ({
    queryKey: ["auditLog", props.server.id],
    queryFn: () => props.server.getAuditLogs(),
    // the endpoint answers 403 when the instance does not grant audit log
    // access, and retrying a refusal only delays showing why
    retry: false,
  }));

  /**
   * Look up the user who performed an action
   */
  function actor(entry: AuditLogEntry): User | undefined {
    return query.data?.users.find((user) => user.id === entry.user);
  }

  const [filter, setFilter] = createSignal("");

  const entries = createMemo(() => {
    const logs = query.data?.audit_logs;
    if (!logs) return [];

    // newest first: entry ids are ULIDs, so they sort by creation time
    const sorted = logs.toSorted((a, b) => b._id.localeCompare(a._id));

    const needle = filter().toLowerCase();
    if (!needle) return sorted;

    return sorted.filter((entry) =>
      (actor(entry)?.username ?? "").toLowerCase().includes(needle),
    );
  });

  return (
    <DataTable
      columns={[
        <TextField
          label={t`User`}
          value={filter()}
          onChange={(e) => setFilter(e.currentTarget.value)}
        />,
        <Trans>Action</Trans>,
        <Trans>When</Trans>,
      ]}
      itemCount={entries().length}
    >
      {(page, itemsPerPage) => (
        <Switch>
          <Match when={query.isLoading}>
            <DataTable.Row>
              <DataTable.Cell colspan={3}>
                <CircularProgress />
              </DataTable.Cell>
            </DataTable.Row>
          </Match>
          <Match when={query.isError}>
            <DataTable.Row>
              <DataTable.Cell colspan={3}>
                <Trans>
                  This server's audit log could not be loaded. The instance may
                  not allow you to read it.
                </Trans>
              </DataTable.Cell>
            </DataTable.Row>
          </Match>
          <Match when={!entries().length}>
            <DataTable.Row>
              <DataTable.Cell colspan={3}>
                <Trans>Nothing has been logged yet.</Trans>
              </DataTable.Cell>
            </DataTable.Row>
          </Match>
          <Match when={entries().length}>
            <For
              each={entries().slice(
                page * itemsPerPage,
                page * itemsPerPage + itemsPerPage,
              )}
            >
              {(entry) => (
                <DataTable.Row>
                  <DataTable.Cell>
                    <Row align>
                      <Avatar
                        src={actor(entry)?.avatarURL}
                        fallback={actor(entry)?.username}
                        size={32}
                      />
                      <span>{actor(entry)?.username ?? entry.user}</span>
                    </Row>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    {describeAction(entry.action)}
                    <Show when={entry.reason}>
                      <Text class="label" size="small">
                        {entry.reason}
                      </Text>
                    </Show>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Time
                      format="datetime"
                      value={new Date(decodeTime(entry._id))}
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              )}
            </For>
          </Match>
        </Switch>
      )}
    </DataTable>
  );
}
