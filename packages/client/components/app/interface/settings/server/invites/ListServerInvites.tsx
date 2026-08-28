import { For, Match, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { Channel, Server, ServerInvite } from "stoat.js";
import { css } from "styled-system/css";

import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { getInviteLink } from "@revolt/modal/modals/CreateInvite";
import {
  Avatar,
  Button,
  CircularProgress,
  Column,
  DataTable,
  Row,
  Symbol,
  Text,
} from "@revolt/ui";

/**
 * List and invalidate server invites
 */
export function ListServerInvites(props: { server: Server }) {
  const { t } = useLingui();
  const client = useQueryClient();
  const instance = useInstance();
  const { showError, openModal } = useModals();
  const query = useQuery(() => ({
    queryKey: ["invites", props.server.id],
    queryFn: () => props.server.fetchInvites() as Promise<ServerInvite[]>,
  }));

  const defaultChannel = () =>
    (props.server.defaultChannel || props.server.channels[0]) as
      | Channel
      | undefined;

  async function deleteInvite(invite: ServerInvite) {
    try {
      await invite.delete();
      client.setQueryData(
        ["invites", props.server.id],
        query.data!.filter((entry) => entry.id !== invite.id),
      );
    } catch (error) {
      showError(error);
    }
  }

  async function createInvite() {
    const channel = defaultChannel();
    if (channel) openModal({ type: "create_invite", channel });
  }

  return (
    <Column>
      <Button
        group="standard"
        onPress={createInvite}
        isDisabled={!defaultChannel()}
        use:floating={{
          tooltip: !defaultChannel()
            ? {
                content: t`Create a channel before inviting others!`,
                placement: "bottom",
              }
            : undefined,
        }}
      >
        <Trans>Create invite</Trans>
      </Button>
      <DataTable
        columns={[<Trans>Inviter</Trans>, <Trans>Invite Code</Trans>, <></>]}
        itemCount={query.data?.length}
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
            <Match when={query.data}>
              <For
                each={query.data!.slice(
                  page * itemsPerPage,
                  page * itemsPerPage + itemsPerPage,
                )}
              >
                {(item) => (
                  <DataTable.Row>
                    <DataTable.Cell>
                      <Row align>
                        <Avatar
                          src={item.creator?.animatedAvatarURL}
                          size={32}
                        />
                        <Column gap="none">
                          <span>
                            {item.creator?.displayName ?? "Unknown User"}
                          </span>
                          <Text class="label">#{item.channel?.name}</Text>
                        </Column>
                      </Row>
                    </DataTable.Cell>
                    <DataTable.Cell class={itemIds}>
                      {item.id}
                      <Button
                        size="icon"
                        variant="text"
                        use:floating={{
                          tooltip: {
                            placement: "bottom",
                            content: t`Copy invite link`,
                          },
                        }}
                        onPress={() =>
                          navigator.clipboard.writeText(
                            getInviteLink(item.id, instance),
                          )
                        }
                      >
                        <Symbol size={20}>content_copy</Symbol>
                      </Button>
                    </DataTable.Cell>
                    <DataTable.Cell width="40px">
                      <Button
                        size="icon"
                        variant="_error"
                        use:floating={{
                          tooltip: {
                            placement: "bottom",
                            content: t`Delete Invite`,
                          },
                        }}
                        onPress={() => deleteInvite(item)}
                      >
                        <Symbol>delete</Symbol>
                      </Button>
                    </DataTable.Cell>
                  </DataTable.Row>
                )}
              </For>
            </Match>
          </Switch>
        )}
      </DataTable>
    </Column>
  );
}

const itemIds = css({
  "& button": {
    display: "inline-block",
    verticalAlign: "middle",
    marginLeft: "var(--gap-sm)",
  },
});
