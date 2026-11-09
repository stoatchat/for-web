import { Trans, useLingui } from "@lingui/solid/macro";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import type { Channel, Server } from "stoat.js";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { Avatar, Column, Dialog, DialogProps, Searchbar } from "@revolt/ui";

import { getChannelIcon } from "@revolt/common";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { styled } from "styled-system/jsx";
import { Modals } from "../types";

type Filter = "@" | "#" | "!" | "*";
const FILTERS: Filter[] = ["@", "#", "!", "*"];

type Result =
  | { type: "channel"; channel: Channel }
  | { type: "server"; server: Server };

export function QuickSwitchModal(
  props: DialogProps & Modals & { type: "quick_switch" },
) {
  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();
  const [query, setQuery] = createSignal("");
  const parsed = createMemo(() => {
    const raw = query().trimStart();
    const first = raw[0] as Filter | undefined;
    if (first && FILTERS.includes(first)) {
      return { filter: first as Filter, q: raw.slice(1).trim().toLowerCase() };
    }
    return { filter: null, q: raw.trim().toLowerCase() };
  });
  const state = useState();
  const [selected, setSelected] = createSignal(0);

  let searchRef: HTMLInputElement | undefined;
  createEffect(() => {
    if (props.show && searchRef) {
      requestAnimationFrame(() => {
        searchRef?.focus();
      });
    }
  });

  function isDM(channel: Channel) {
    return (
      channel.type === "DirectMessage" ||
      channel.type === "Group" ||
      channel.type === "SavedMessages"
    );
  }

  function channelLabel(channel: Channel) {
    if (channel.type === "SavedMessages") return t`Saved Notes`;
    if (channel.type === "DirectMessage") {
      return channel.recipient?.displayName ?? channel.displayName;
    }
    return channel.displayName;
  }

  function dmUsername(channel: Channel) {
    if (channel.type !== "DirectMessage") return undefined;
    const username = channel.recipient?.username;
    return username && username !== channelLabel(channel)
      ? username
      : undefined;
  }
  function channelCategory(channel: Channel) {
    if (channel.type !== "TextChannel") return undefined;
    return channel.server?.categories?.find((cat) =>
      cat.channels.includes(channel.id),
    )?.title;
  }

  const results = createMemo<Result[]>(() => {
    const { filter, q } = parsed();

    const toChannel = (channel: Channel): Result => ({
      type: "channel",
      channel,
    });
    const toServer = (server: Server): Result => ({ type: "server", server });

    const rank = (label?: string) =>
      q && label?.toLowerCase().startsWith(q) ? 0 : 1;

    const byRank = (a: Channel, b: Channel) =>
      rank(channelLabel(a)) - rank(channelLabel(b));

    const byServerRank = (a: Server, b: Server) => rank(a.name) - rank(b.name);

    if (!filter && !q) {
      return state.layout
        .getRecentChannelIds()
        .map((id) => client().channels.get(id))
        .filter((c): c is Channel => !!c)
        .slice(0, 20)
        .map(toChannel);
    }

    const matchingServers = () =>
      [...client().servers.values()].filter(
        (s) => !q || s.name.toLowerCase().includes(q),
      );

    if (filter === "*") {
      return matchingServers().sort(byServerRank).slice(0, 20).map(toServer);
    }

    const matchesText = (c: Channel) =>
      !q ||
      channelLabel(c)?.toLowerCase().includes(q) ||
      (c.type === "DirectMessage" &&
        c.recipient?.username?.toLowerCase().includes(q));

    const all = [...client().channels.values()].filter(matchesText);

    if (!filter) {
      return [
        ...all
          .filter((c) => !isDM(c))
          .sort(byRank)
          .map(toChannel),
        ...matchingServers().sort(byServerRank).map(toServer),
        ...all.filter(isDM).sort(byRank).map(toChannel),
      ].slice(0, 20);
    }

    let channels: Channel[];
    switch (filter) {
      case "@":
        channels = all.filter(
          (c) => c.type === "DirectMessage" || c.type === "Group",
        );
        break;
      case "#":
        channels = all.filter((c) => c.type === "TextChannel");
        break;
      case "!":
        channels = all.filter((c) => c.type === "TextChannel" && c.isVoice);
        break;
    }

    return channels.sort(byRank).slice(0, 20).map(toChannel);
  });

  createEffect(() => {
    results();
    setSelected(0);
  });
  createEffect(() => {
    document
      .getElementById(`search-opt-${selected()}`)
      ?.scrollIntoView({ block: "nearest" });
  });
  createEffect(() => {
    searchRef?.setAttribute("role", "combobox");
    searchRef?.setAttribute("aria-label", t`Search channels`);
    searchRef?.setAttribute("aria-controls", "search-results");
    searchRef?.setAttribute("aria-expanded", "true");
    searchRef?.setAttribute(
      "aria-activedescendant",
      `search-opt-${selected()}`,
    );
  });
  function rowAriaLabel(result: Result) {
    if (result.type === "server") {
      const name = result.server.name;
      return t`Server: ${name}`;
    }

    const serverName = result.channel.server?.name;
    if (!serverName) return undefined;

    const channel = channelLabel(result.channel);
    const category = channelCategory(result.channel);
    return category
      ? t`${channel}, in category ${category}, in server ${serverName}`
      : t`${channel}, in server ${serverName}`;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.isComposing || e.keyCode === 229) return;

    const count = results().length;
    if (!count) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (i + 1) % count);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (i - 1 + count) % count);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = results()[selected()];
      if (result) select(result);
    }
  }

  function select(result: Result) {
    if (result.type === "server") {
      navigate(state.layout.getLastActiveServerPath(result.server.id));
    } else {
      state.layout.pushRecentChannel(result.channel.id);
      navigate(result.channel.path);
    }
    props.onClose();
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      padding={12}
      minWidth={480}
    >
      <Column gap="none">
        <PaddedTop onKeyDown={onKeyDown}>
          <Searchbar
            ref={(el) => (searchRef = el)}
            value={query()}
            onInput={setQuery}
            placeholder={t`Where would you like to go?`}
            leadingIcon={<Symbol size={20}>search</Symbol>}
          />
        </PaddedTop>

        <Show when={!results().length}>
          <EmptyState>
            <Show when={query()} fallback={<Trans>No recent channels</Trans>}>
              <Trans>No results</Trans>
            </Show>
          </EmptyState>
        </Show>

        <Show when={!query() && results().length}>
          <SectionLabel>
            <Trans>PREVIOUS CHANNELS</Trans>
          </SectionLabel>
        </Show>

        <Show when={results().length}>
          <ResultList id="search-results" role="listbox">
            <For each={results()}>
              {(result, i) => (
                <Row
                  id={`search-opt-${i()}`}
                  role="option"
                  aria-label={rowAriaLabel(result)}
                  aria-selected={selected() === i()}
                  data-selected={selected() === i()}
                  onMouseMove={() => setSelected(i())}
                  onClick={() => select(result)}
                >
                  {result.type === "server" ? (
                    <>
                      <Avatar
                        size={24}
                        src={result.server.iconURL}
                        fallback={result.server.name}
                      />
                      <RowText>
                        <RowLabel>{result.server.name}</RowLabel>
                      </RowText>
                    </>
                  ) : (
                    <>
                      <Show
                        when={isDM(result.channel)}
                        fallback={
                          <Symbol size={24}>
                            {getChannelIcon(result.channel)}
                          </Symbol>
                        }
                      >
                        <Avatar
                          size={24}
                          src={result.channel.iconURL}
                          fallback={channelLabel(result.channel)}
                        />
                      </Show>
                      <RowText>
                        <RowLabel>{channelLabel(result.channel)}</RowLabel>
                        <Show when={dmUsername(result.channel)}>
                          <RowUsername>
                            {dmUsername(result.channel)}
                          </RowUsername>
                        </Show>
                        <Show when={channelCategory(result.channel)}>
                          <RowCategory>
                            {channelCategory(result.channel)}
                          </RowCategory>
                        </Show>
                      </RowText>
                      <Show when={result.channel.server?.name}>
                        <RowServer>{result.channel.server?.name}</RowServer>
                      </Show>
                    </>
                  )}
                </Row>
              )}
            </For>
          </ResultList>
        </Show>

        <Protip>
          <ProtipLabel>
            <Trans>Protip:</Trans>
          </ProtipLabel>
          <span>
            <Trans>
              Start searches with <Kbd>@</Kbd> <Kbd>#</Kbd> <Kbd>!</Kbd>{" "}
              <Kbd>*</Kbd> to narrow results.
            </Trans>
          </span>
        </Protip>
      </Column>
    </Dialog>
  );
}

const PaddedTop = styled("div", {
  base: {
    padding: "12px",
    paddingBottom: "8px",
  },
});

const SectionLabel = styled("div", {
  base: {
    padding: "4px 12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const ResultList = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "360px",
    overflowY: "auto",
    paddingBottom: "8px",
    scrollbarWidth: "thin",
  },
});

const Row = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "6px 12px",
    margin: "1px 8px",
    borderRadius: "var(--borderRadius-md)",
    cursor: "pointer",
    minWidth: 0,
    transition: "background 0.1s ease-in-out",
    "&:hover, &[data-selected='true']": {
      background: "var(--md-sys-color-surface-container-highest)",
    },
  },
});

const RowText = styled("div", {
  base: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
});

const RowLabel = styled("div", {
  base: {
    flex: "0 1 auto",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 500,
  },
});

const RowUsername = styled("div", {
  base: {
    flex: "0 1 auto",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "0.8rem",
  },
});

const RowServer = styled("div", {
  base: {
    flexShrink: 0,
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "0.8rem",
  },
});

const RowCategory = styled("div", {
  base: {
    flex: "0 1 auto",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color:
      "color-mix(in srgb, var(--md-sys-color-on-surface-variant) 70%, transparent)",
    fontSize: "0.7rem",
    fontWeight: 400,
  },
});

const EmptyState = styled("div", {
  base: {
    padding: "16px 12px 20px",
    textAlign: "center",
    fontSize: "0.9rem",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const Protip = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
    padding: "10px 12px 4px",
    fontSize: "0.8rem",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const ProtipLabel = styled("span", {
  base: {
    fontWeight: 700,
    color: "var(--md-sys-color-primary)",
  },
});

const Kbd = styled("kbd", {
  base: {
    fontFamily: "monospace",
    padding: "1px 6px",
    borderRadius: "var(--borderRadius-sm)",
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-on-surface)",
  },
});
