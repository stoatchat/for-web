import { For, Match, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { Server, ServerInvite } from "stoat.js";

import { useModals } from "@revolt/modal";
import {
  Avatar,
  Button,
  CircularProgress,
  Column,
  DataTable,
  Row,
  Text,
} from "@revolt/ui";

import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";

/**
 * List and invalidate server invites
 */
export function ListServerInvites(props: { server: Server }) {
  const { t } = useLingui();
  const client = useQueryClient();
  const { showError } = useModals();
  const query = useQuery(() => ({
    queryKey: ["invites", props.server.id],
    queryFn: () => props.server.fetchInvites() as Promise<ServerInvite[]>,
  }));

  function deleteInvite(invite: ServerInvite) {
    invite
      .delete()
      .then(() =>
        client.setQueryData(
          ["invites", props.server.id],
          query.data!.filter((entry) => entry.id !== entry.id),
        ),
      )
      .catch(showError);
  }

  return (
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
                      <Avatar src={item.creator?.animatedAvatarURL} size={32} />
                      <Column gap="none">
                        <span>
                          {item.creator?.displayName ?? "Unknown User"}
                        </span>
                        <Text class="label">#{item.channel?.name}</Text>
                      </Column>
                    </Row>
                  </DataTable.Cell>
                  <DataTable.Cell>{item.id}</DataTable.Cell>
                  <DataTable.Cell width="40px">
                    <Button
                      size="icon"
                      variant="filled"
                      use:floating={{
                        tooltip: {
                          placement: "bottom",
                          content: t`Delete Invite`,
                        },
                      }}
                      onPress={() => deleteInvite(item)}
                    >
                      <MdDelete />
                    </Button>
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
