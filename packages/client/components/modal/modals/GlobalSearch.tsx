import { Trans } from "@lingui/solid/macro";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import type { Channel } from "stoat.js";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Searchbar,
  Text,
} from "@revolt/ui";

import { useLingui } from "@lingui/solid/macro";
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
    return isDM(channel)
      ? (channel.recipient?.username ?? channel.name ?? "Unknown")
      : (channel.name ?? "");
  }

  function serverLabel(channel: Channel) {
    return channel.server?.name;
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
      ? all.filter((c) => channelLabel(c).toLowerCase().includes(q))
      : all;

    // channels first, DMs after
    const channels = matches.filter((c) => !isDM(c));
    const dms = matches.filter((c) => isDM(c));
    return [...channels, ...dms].slice(0, 20);
  });

  function select(channel: Channel) {
    state.layout.pushRecentChannel(channel.id);
    if (channel.type === "TextChannel") {
      navigate(`/server/${channel.serverId}/channel/${channel.id}`);
    } else {
      navigate(`/channel/${channel.id}`);
    }
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
        <PaddedTop>
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

        <ResultList>
          <For
            each={results()}
          >
            {(channel) => (
              <Row onClick={() => select(channel)}>
                <Show
                  when={isDM(channel)}
                  fallback={<Symbol size={24}>grid_3x3</Symbol>}
                >
                  <Avatar
                    size={24}
                    src={channel.recipient?.avatarURL}
                    fallback={channelLabel(channel)}
                  />
                </Show>
                <RowLabel>{channelLabel(channel)}</RowLabel>
                <Show when={serverLabel(channel)}>
                  <RowServer>{serverLabel(channel)}</RowServer>
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
    "&:hover": {
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
