import { For, Match, Switch, createMemo, createSignal } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { Server, ServerBan } from "stoat.js";

import { useModals } from "@revolt/modal";
import {
  Avatar,
  Button,
  CircularProgress,
  DataTable,
  Row,
  TextField,
} from "@revolt/ui";

import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";

/**
 * List and invalidate server bans
 */
export function ListServerBans(props: { server: Server }) {
  const { t } = useLingui();
  const client = useQueryClient();
  const { showError } = useModals();

  const query = useQuery(() => ({
    queryKey: ["bans", props.server.id],
    queryFn: () => props.server.fetchBans() as Promise<ServerBan[]>,
  }));

  function pardon(ban: ServerBan) {
    ban
      .pardon()
      .then(() =>
        client.setQueryData(
          ["bans", props.server.id],
          query.data!.filter((entry) => entry.id.user !== ban.id.user),
        ),
      )
      .catch(showError);
  }

  const [filterName, setFilterName] = createSignal("");
  const [filterDesc, setFilterDesc] = createSignal("");

  const data = createMemo(() => {
    if (query.data) {
      const name = filterName().toLowerCase(),
        desc = filterDesc().toLowerCase();

      if (name || desc) {
        return query.data.filter(
          (entry) =>
            (entry.user?.username ?? "").toLowerCase().includes(name) &&
            (entry.reason ?? "").toLowerCase().includes(desc),
        );
      }

      return query.data;
    }
  });

  return (
    <DataTable
      columns={[
        <TextField
          label={t`User`}
          value={filterName()}
          onChange={(e) => setFilterName(e.currentTarget.value)}
        />,
        <TextField
          label={t`Reason`}
          value={filterDesc()}
          onChange={(e) => setFilterDesc(e.currentTarget.value)}
        />,
        <></>,
      ]}
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
              each={data()!.slice(
                page * itemsPerPage,
                page * itemsPerPage + itemsPerPage,
              )}
            >
              {(item) => (
                <DataTable.Row>
                  <DataTable.Cell>
                    <Row align>
                      <Avatar
                        src={item.user?.avatar?.previewUrl}
                        fallback={item.user?.username}
                        size={32}
                      />
                      <span>
                        {item.user?.username}#{item.user?.discriminator}
                      </span>
                    </Row>
                  </DataTable.Cell>
                  <DataTable.Cell>{item.reason}</DataTable.Cell>
                  <DataTable.Cell width="40px">
                    <Button
                      size="icon"
                      variant="filled"
                      use:floating={{
                        tooltip: {
                          placement: "bottom",
                          content: t`Pardon User`,
                        },
                      }}
                      onPress={() => pardon(item)}
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
