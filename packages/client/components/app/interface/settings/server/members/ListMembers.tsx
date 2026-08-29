import { For, Match, Show, Switch, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { Server, ServerMember } from "stoat.js";

import { useModals } from "@revolt/modal";
import {
  Avatar,
  CircularProgress,
  ColouredText,
  DataTable,
  Row,
  TextField,
  Time,
} from "@revolt/ui";

/**
 * List everyone in the server, with the roles they hold
 *
 * Roles could previously only be seen one person at a time, through each
 * member's context menu.
 */
export function ListServerMembers(props: { server: Server }) {
  const { t } = useLingui();
  const { openModal } = useModals();

  const query = useQuery(() => ({
    queryKey: ["members", props.server.id],
    queryFn: () => props.server.fetchMembers(),
  }));

  const [filter, setFilter] = createSignal("");

  const members = createMemo(() => {
    const all = query.data?.members;
    if (!all) return [];

    const needle = filter().toLowerCase();
    const matching = needle
      ? all.filter((member) =>
          (member.displayName ?? member.user?.username ?? "")
            .toLowerCase()
            .includes(needle),
        )
      : all;

    return matching.toSorted((a, b) =>
      (a.displayName ?? a.user?.username ?? "").localeCompare(
        b.displayName ?? b.user?.username ?? "",
      ),
    );
  });

  /**
   * Open a member's profile
   */
  function openProfile(member: ServerMember) {
    if (member.user) {
      openModal({ type: "user_profile", user: member.user, member });
    }
  }

  return (
    <DataTable
      columns={[
        <TextField
          label={t`Member`}
          value={filter()}
          onChange={(e) => setFilter(e.currentTarget.value)}
        />,
        <Trans>Roles</Trans>,
        <Trans>Joined</Trans>,
      ]}
      itemCount={members().length}
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
          <Match when={members().length}>
            <For
              each={members().slice(
                page * itemsPerPage,
                page * itemsPerPage + itemsPerPage,
              )}
            >
              {(member) => (
                <DataTable.Row onClick={() => openProfile(member)}>
                  <DataTable.Cell>
                    <Row align>
                      <Avatar
                        src={member.avatarURL ?? member.user?.avatarURL}
                        fallback={member.displayName ?? member.user?.username}
                        size={32}
                      />
                      <span>{member.displayName ?? member.user?.username}</span>
                    </Row>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Show
                      when={member.roles.length}
                      fallback={<Trans>None</Trans>}
                    >
                      <Row wrap gap="sm">
                        <For each={member.roles}>
                          {(roleId) => {
                            const role = props.server.roles.get(roleId);

                            return (
                              <Show when={role}>
                                <ColouredText
                                  colour={
                                    role!.colour ??
                                    "var(--md-sys-color-on-surface)"
                                  }
                                >
                                  {role!.name}
                                </ColouredText>
                              </Show>
                            );
                          }}
                        </For>
                      </Row>
                    </Show>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Time format="date" value={member.joinedAt} />
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
