import { For, Show, Suspense, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { API, Channel } from "stoat.js";
import { encodeTime } from "ulid";

import { Message } from "@revolt/app";
import { Button, CircularProgress, Row, Text, TextField } from "@revolt/ui";

/**
 * Lowest and highest randomness a ULID can carry, in Crockford base32.
 */
const ULID_RANDOM_MIN = "0".repeat(16);
const ULID_RANDOM_MAX = "Z".repeat(16);

/**
 * Turn a yyyy-mm-dd value from a date input into a message id boundary.
 *
 * The search route has no date filter, but `before`/`after` take message ids,
 * and ids are ULIDs which encode their own creation time. Pairing an encoded
 * timestamp with all-zero randomness lands before every message of that
 * millisecond, all-Z lands after every one of them.
 */
function dateBoundary(value: string, edge: "start" | "end") {
  if (!value) return undefined;

  const time = new Date(
    edge === "start" ? `${value}T00:00:00` : `${value}T23:59:59.999`,
  ).getTime();
  if (Number.isNaN(time)) return undefined;

  return (
    encodeTime(time, 10) +
    (edge === "start" ? ULID_RANDOM_MIN : ULID_RANDOM_MAX)
  );
}

/**
 * Message search sidebar
 */
export function TextSearchSidebar(props: {
  channel: Channel;
  query: Omit<API.DataMessageSearch, "include_users">;
}) {
  const { t } = useLingui();

  const [sort, setSort] = createSignal<API.DataMessageSearch["sort"]>("Latest");
  const [after, setAfter] = createSignal("");
  const [before, setBefore] = createSignal("");

  /**
   * The pinned list reuses this sidebar with a fixed sort; its results are not
   * meant to be narrowed further, so the controls belong to search only.
   */
  const filterable = () => !props.query.sort;

  const params = createMemo(() => {
    const params: Omit<API.DataMessageSearch, "include_users"> = {
      ...props.query,
    };

    if (!props.query.sort) params.sort = sort();

    const from = dateBoundary(after(), "start");
    const until = dateBoundary(before(), "end");
    if (from) params.after = from;
    if (until) params.before = until;

    return params;
  });

  /** Dates the user entered the wrong way round, which can only match nothing */
  const impossibleRange = createMemo(() => {
    const from = dateBoundary(after(), "start");
    const until = dateBoundary(before(), "end");
    return !!from && !!until && from > until;
  });

  const query = useQuery(() => ({
    queryKey: ["search", props.channel.id, params()],
    queryFn: () =>
      props.channel.searchWithUsers(params()).then((result) => result.messages),
  }));

  return (
    <>
      <Show when={filterable()}>
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

        <Row justify="stretch">
          <TextField
            type="date"
            variant="filled"
            clearable
            label={t`After`}
            value={after()}
            onInput={(e) => setAfter(e.currentTarget.value)}
          />
          <TextField
            type="date"
            variant="filled"
            clearable
            label={t`Before`}
            value={before()}
            onInput={(e) => setBefore(e.currentTarget.value)}
          />
        </Row>

        <Show when={impossibleRange()}>
          <Text class="label">
            <Trans>That date range starts after it ends.</Trans>
          </Text>
        </Show>
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
