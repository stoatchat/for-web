import { Trans, useLingui } from "@lingui/solid/macro";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import type { Channel } from "stoat.js";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import { Avatar, Column, Dialog, DialogProps, Searchbar } from "@revolt/ui";

import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { styled } from "styled-system/jsx";
import { Modals } from "../types";

export function GlobalSearchModal(
  props: DialogProps & Modals & { type: "search" },
) {
  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();
  const [query, setQuery] = createSignal("");
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
    return channel.displayName;
  }

  const results = createMemo(() => {
    const q = query().trim().toLowerCase();

    if (!q) {
      return state.layout
        .getRecentChannelIds()
        .map((id) => client().channels.get(id))
        .filter((c): c is Channel => !!c)
        .slice(0, 20);
    }

    const all = [...client().channels.values()];
    const matches = q
      ? all.filter((c) => channelLabel(c)?.toLowerCase().includes(q))
      : all;

    // channels first, DMs after
    const channels = matches.filter((c) => !isDM(c));
    const dms = matches.filter((c) => isDM(c));
    return [...channels, ...dms].slice(0, 20);
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

  function onKeyDown(e: KeyboardEvent) {
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
      const channel = results()[selected()];
      if (channel) select(channel);
    }
  }

  function select(channel: Channel) {
    state.layout.pushRecentChannel(channel.id);
    navigate(channel.path);
    props.onClose();
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      padding={0}
      minWidth={480}
    >
      <Column gap="none">
        <PaddedTop onKeyDown={onKeyDown}>
          <Searchbar
            ref={(el) => (searchRef = el)}
            value={query()}
            onInput={setQuery}
            placeholder={t`Where would you like to go`}
            leadingIcon={<Symbol size={20}>search</Symbol>}
          />
        </PaddedTop>

        <Show when={!query()}>
          <SectionLabel>
            <Show
              when={results().length}
              fallback={<Trans>No recent channels</Trans>}
            >
              <Trans>PREVIOUS CHANNELS</Trans>
            </Show>
          </SectionLabel>
        </Show>

        <ResultList id="search-results" role="listbox">
          <For each={results()}>
            {(channel, i) => (
              <Row
                id={`search-opt-${i()}`}
                role="option"
                aria-selected={selected() === i()}
                data-selected={selected() === i()}
                onMouseMove={() => setSelected(i())}
                onClick={() => select(channel)}
              >
                <Show
                  when={isDM(channel)}
                  fallback={<Symbol size={24}>grid_3x3</Symbol>}
                >
                  <Avatar
                    size={24}
                    src={channel.iconURL}
                    fallback={channelLabel(channel)}
                  />
                </Show>
                <RowLabel>{channelLabel(channel)}</RowLabel>
                <Show when={channel.server?.name}>
                  <RowServer>{channel.server?.name}</RowServer>
                </Show>
              </Row>
            )}
          </For>
        </ResultList>
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

const RowLabel = styled("div", {
  base: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 500,
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
