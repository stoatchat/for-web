import { For, Show, Suspense, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { API, Channel } from "stoat.js";

import { Message } from "@revolt/app";
import { Button, CircularProgress, Row } from "@revolt/ui";

/**
 * Message search sidebar
 */
export function TextSearchSidebar(props: {
  channel: Channel;
  query: Omit<API.DataMessageSearch, "include_users">;
}) {
  const [sort, setSort] = createSignal<API.DataMessageSearch["sort"]>("Latest");

  const query = useQuery(() => ({
    queryKey: ["search", props.channel.id, props.query, sort()],
    queryFn: () =>
      props.channel
        .searchWithUsers(
          props.query.sort
            ? props.query
            : {
                ...props.query,
                sort: sort(),
              },
        )
        .then((result) => result.messages),
  }));

  return (
    <>
      <Show when={!props.query.sort}>
        <Row justify="stretch">
          <Button
            group="connected-start"
            groupActive={sort() === "Relevance"}
            onPress={() => setSort("Relevance")}
          >
            <Trans>Relevance</Trans>
          </Button>
          <Button
            group="connected"
            groupActive={sort() === "Latest"}
            onPress={() => setSort("Latest")}
          >
            <Trans>Latest</Trans>
          </Button>
          <Button
            group="connected-end"
            groupActive={sort() === "Oldest"}
            onPress={() => setSort("Oldest")}
          >
            <Trans>Oldest</Trans>
          </Button>
        </Row>
      </Show>
      <Suspense fallback={<CircularProgress />}>
        <For each={query.data}>
          {(message) => (
            <a href={message.path}>
              <Message message={message} isLink />
            </a>
          )}
        </For>
      </Suspense>
    </>
  );
}
