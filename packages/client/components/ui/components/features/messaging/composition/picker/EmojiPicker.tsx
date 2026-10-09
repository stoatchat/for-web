import {
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  useContext,
} from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { createResizeObserver } from "@solid-primitives/resize-observer";
import { Emoji, Server } from "stoat.js";
import { css, cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { debounce, useDevice } from "@revolt/common";
import { UNICODE_ZWNJ, UnicodeEmoji } from "@revolt/markdown/emoji";
import {
  UNICODE_EMOJI_PACK_PUA,
  isRegionalIndicator,
} from "@revolt/markdown/emoji/UnicodeEmoji";
import { useState } from "@revolt/state";
import { Avatar, Ripple, TextField } from "@revolt/ui/components/design";
import { Row } from "@revolt/ui/components/layout";
import { EMOJI_LIST, EMOJI_SET, getEmojiByShorthand } from "@revolt/ui/emojis";

import { EmojiContextMenu } from "@revolt/app/menus/EmojiContextMenu";
import { Symbol } from "@revolt/ui/components/utils";
import {
  CompositionMediaPickerContext,
  compositionContent,
} from "./CompositionMediaPicker";

type Item =
  | {
      /**
       * Server header
       */
      t: 0;
      server: Server;
    }
  | {
      /**
       * Spacing element
       */
      t: 1;
    }
  | {
      /**
       * Custom emoji
       */
      t: 2;
      emoji: Emoji;
      favourited: boolean;
    }
  | {
      /**
       * Title header
       */
      t: 3;
      title: string;
      id: string;
      symbol?: string;
      fill?: boolean;
    }
  | {
      /**
       * Unicode emoji
       */
      t: 4;
      name: string;
      text: string;
      favourited: boolean;
    };

const [hoveredItem, setHoveredItem] = createSignal<Item | null>(null);

export function EmojiPicker() {
  const client = useClient();
  const { favourites, ordering, settings } = useState();
  const { isMobile } = useDevice();
  const { t } = useLingui();

  const [filter, setFilter] = createSignal("");
  const [colCount, setColCount] = createSignal(0);

  let serverScrollTargetElement!: HTMLDivElement;
  let emojiScrollTargetElement!: HTMLDivElement;

  onMount(() =>
    createResizeObserver(emojiScrollTargetElement, ({ width }) =>
      setColCount(Math.floor(width / 40)),
    ),
  );

  const items = createMemo(() => {
    const cols = colCount();
    if (!cols) return [];

    const filterText = filter().toLowerCase();

    if (filterText) {
      return [
        ...ordering
          .orderedServers(client())
          .flatMap((server) =>
            server.emojis
              .filter((emoji) => emoji.name.toLowerCase().includes(filterText))
              .map((emoji) => ({ t: 2, emoji })),
          ),
        ...EMOJI_SET.filter(
          (ed) =>
            ed.shorthands.filter((sh) => sh.toLowerCase().includes(filterText))
              .length > 0,
        ).map((ed) => ({
          t: 4,
          name: ed.shorthands[0],
          text: ed.emoji,
        })),
      ] as Item[];
    }

    const items: Item[] = [];

    const favouriteEmojis = favourites.emojis().filter((id) => {
      if (id.length === 26) {
        const emoji = client().emojis.get(id);
        if (!emoji) {
          // If the emoji doesn't exist anymore just ignore it, it'll go away eventually.
          return false;
        }
      }
      return true;
    });

    const topEmoji = favourites.topEmoji(cols * 3).filter((id) => {
      if (id.length === 26) {
        const emoji = client().emojis.get(id);
        if (!emoji) {
          // If the emoji doesn't exist anymore just ignore it, it'll go away eventually.
          return false;
        }
      }
      return true;
    });

    if (favouriteEmojis.length > 0) {
      items.push({
        t: 3,
        title: t`Favourites`,
        id: "favourites",
        symbol: "star",
        fill: true,
      });

      while (items.length % cols) {
        items.push({ t: 1 });
      }

      for (const id of favouriteEmojis) {
        if (id.length === 26) {
          const emoji = client().emojis.get(id);
          items.push({
            t: 2,
            emoji: emoji!,
            favourited: true,
          });
        } else {
          const emoji = getEmojiByShorthand(id)!;
          items.push({
            t: 4,
            name: emoji.shorthands[0],
            text: emoji.emoji,
            favourited: true,
          });
        }
      }

      while (items.length % cols) {
        items.push({ t: 1 });
      }
    }

    if (topEmoji.length > 0) {
      items.push({
        t: 3,
        title: t`Frequently Used`,
        id: "top",
        symbol: "history",
      });

      while (items.length % cols) {
        items.push({ t: 1 });
      }

      for (const id of topEmoji) {
        if (id.length === 26) {
          const emoji = client().emojis.get(id);
          items.push({
            t: 2,
            emoji: emoji!,
            favourited: favouriteEmojis.includes(id),
          });
        } else {
          const emoji = getEmojiByShorthand(id)!;
          items.push({
            t: 4,
            name: emoji.shorthands[0],
            text: emoji.emoji,
            favourited: favouriteEmojis.includes(emoji.shorthands[0]),
          });
        }
      }

      while (items.length % cols) {
        items.push({ t: 1 });
      }
    }

    for (const server of ordering.orderedServers(client())) {
      const emojis = server.emojis;

      if (emojis.length === 0) continue;

      items.push({
        t: 0,
        server,
      });

      while (items.length % cols) {
        items.push({ t: 1 });
      }

      for (const emoji of emojis) {
        items.push({
          t: 2,
          emoji,
          favourited: favouriteEmojis.includes(emoji.id),
        });
      }

      while (items.length % cols) {
        items.push({ t: 1 });
      }
    }

    items.push({
      t: 3,
      title: t`Default`,
      id: "default",
    });

    while (items.length % cols) {
      items.push({ t: 1 });
    }

    for (const emoji of EMOJI_LIST) {
      items.push({
        t: 4,
        name: emoji.shorthands[0],
        text: emoji.emoji,
        favourited: favouriteEmojis.includes(emoji.shorthands[0]),
      });
    }

    return items;
  });

  createEffect(() => {
    if (hoveredItem() !== null) return;
    const first = items().find((item) => item.t === 2 || item.t === 4) ?? null;
    setHoveredItem(first);
  });

  return (
    <Stack>
      <TextField
        autoFocus={!isMobile}
        variant="outlined"
        placeholder={t`Search for emojis...`}
        value={filter()}
        onInput={(e) => setFilter(e.currentTarget.value)}
        class={searchBar}
      />
      <Row gap={"none"} class={compositionContent()}>
        <div
          ref={serverScrollTargetElement}
          use:invisibleScrollable={{
            class: scrollContainer({ component: "serverRail" }),
          }}
        >
          <VirtualContainer
            items={[
              { id: "favourites", symbol: "star", fill: true },
              { id: "top", symbol: "history", fill: false },
              ...ordering
                .orderedServers(client())
                .filter((s) => s.emojis.length > 0),
              // TODO: Set up emoji groupings and put them in the scroller like other platforms do
              { id: "default", symbol: "mood", fill: true },
            ]}
            scrollTarget={serverScrollTargetElement}
            itemSize={{ height: 40 }}
          >
            {(props) => (
              <ServerItem
                style={props.style}
                tabIndex={props.tabIndex}
                item={props.item}
                onClick={() => {
                  const asSymbol = props.item as {
                    id: string;
                    symbol: string;
                    fill: boolean;
                  };
                  const isSymbol = !!asSymbol.symbol;
                  const asServer = props.item as Server;

                  const idx = items().findIndex((item) => {
                    if (isSymbol) {
                      return item.t === 3 && item.id === asSymbol.id;
                    }
                    return item.t === 0 && item.server.id === asServer.id;
                  });
                  if (idx !== -1 && emojiScrollTargetElement) {
                    emojiScrollTargetElement.scrollTop =
                      Math.floor(idx / colCount()) * 40;
                  }
                }}
              />
            )}
          </VirtualContainer>
        </div>

        <EmojiListColumn>
          <div
            ref={emojiScrollTargetElement}
            use:invisibleScrollable={{
              class: scrollContainer({ component: "emoji" }),
            }}
          >
            <VirtualContainer
              items={items()}
              scrollTarget={emojiScrollTargetElement}
              itemSize={{ height: 40, width: 40 }}
              crossAxisCount={colCount}
            >
              {EmojiItem}
            </VirtualContainer>
          </div>

          <EmojiPreviewBar>
            <Show when={hoveredItem()}>
              {(item) => (
                <>
                  <Row align gap="sm" style={{ flex: 1, "min-width": 0 }}>
                    <PreviewEmoji>
                      <Switch>
                        <Match when={item().t === 2}>
                          <img src={(item() as Item & { t: 2 }).emoji.url} />
                        </Match>
                        <Match when={item().t === 4}>
                          <UnicodeEmoji
                            emoji={(item() as Item & { t: 4 }).text}
                            pack={settings.getValue("appearance:unicode_emoji")}
                          />
                        </Match>
                      </Switch>
                    </PreviewEmoji>
                    <div>
                      <PreviewName>
                        <Switch>
                          <Match when={item().t === 2}>
                            <Row align gap="sm">
                              <Show
                                when={(item() as Item & { t: 2 }).favourited}
                              >
                                <Symbol fill={true}>star</Symbol>
                              </Show>
                              <span>
                                :{(item() as Item & { t: 2 }).emoji.name}:
                              </span>
                            </Row>
                          </Match>
                          <Match when={item().t === 4}>
                            <Row align gap="sm">
                              <Show
                                when={(item() as Item & { t: 2 }).favourited}
                              >
                                <Symbol fill={true}>star</Symbol>
                              </Show>
                              <span>:{(item() as Item & { t: 4 }).name}:</span>
                            </Row>
                          </Match>
                        </Switch>
                      </PreviewName>
                      <Show when={item().t === 2}>
                        <PreviewFrom>
                          <Trans>from </Trans>
                          <strong>
                            {(() => {
                              const parent = (item() as Item & { t: 2 }).emoji
                                .parent;
                              return parent.type === "Server"
                                ? (client().servers.get(parent.id)?.name ??
                                    t`Unknown Server`)
                                : t`Unknown Server`;
                            })()}
                          </strong>
                        </PreviewFrom>
                      </Show>
                    </div>
                  </Row>

                  {/* Extracted Server Avatar logic */}
                  <Show
                    when={
                      item().t === 2 &&
                      (item() as Item & { t: 2 }).emoji.parent.type === "Server"
                    }
                  >
                    {(() => {
                      const parent = (item() as Item & { t: 2 }).emoji.parent;

                      const server =
                        parent.type === "Server"
                          ? client().servers.get(parent.id)
                          : null;

                      return (
                        <Avatar
                          size={24}
                          src={server?.animatedIconURL}
                          fallback={server?.name ?? ""}
                        />
                      );
                    })()}
                  </Show>
                </>
              )}
            </Show>
          </EmojiPreviewBar>
        </EmojiListColumn>
      </Row>
    </Stack>
  );
}

const Stack = styled("div", {
  base: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
  },
});

const searchBar = css({
  paddingInline: "var(--gap-md)",
});

const scrollContainer = cva({
  base: {},
  variants: {
    component: {
      serverRail: {
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        width: "40px",
        gap: "var(--gap-sm)",
      },
      emoji: {
        flexGrow: 1,
      },
    },
  },
});

const ServerItem = (props: {
  style: unknown;
  tabIndex: number;
  item: Server | { symbol: string };
  onClick: (e: MouseEvent) => void;
}) => {
  const asSymbol = () =>
    props.item as { id: string; symbol: string; fill: boolean };
  const asServer = () => props.item as Server;

  const isSymbol = () => !!asSymbol().symbol;

  return (
    <ServerOption
      style={props.style as never}
      tabIndex={props.tabIndex}
      role="listitem"
      onClick={(e) => {
        e.stopPropagation();
        props.onClick(e);
      }}
    >
      {isSymbol() ? (
        <Symbol fill={asSymbol().fill} size={32}>
          {asSymbol().symbol}
        </Symbol>
      ) : (
        <Avatar
          size={32}
          src={asServer().animatedIconURL}
          fallback={asServer().name}
        />
      )}
    </ServerOption>
  );
};

const ServerOption = styled("div", {
  base: {
    width: "100%",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
  },
});

const EmojiPreviewBar = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--gap-xs) var(--gap-md)",
    minHeight: "36px",
    flexShrink: 0,
    gap: "var(--gap-sm)",
  },
});

const EmojiListColumn = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
});

const PreviewEmoji = styled("div", {
  base: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    "--emoji-size": "24px",

    "& img": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
  },
});

const PreviewName = styled("span", {
  base: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--colour-foreground)",
    lineHeight: 1.2,
  },
});

const PreviewFrom = styled("span", {
  base: {
    display: "block",
    fontSize: "0.75rem",
    color: "var(--colour-foreground-muted)",
    marginTop: "1px",

    "& strong": {
      color: "var(--colour-foreground-secondary)",
      fontWeight: 500,
    },
  },
});

const EmojiItem = (props: { style: unknown; tabIndex: number; item: Item }) => {
  const { settings, favourites } = useState();
  const { onTextReplacement } = useContext(CompositionMediaPickerContext);

  // Debounce usage tracking to prevent spamclicks from counting as use
  const debouncedRecordUse = debounce(
    (id: string) => favourites.recordUse(id),
    1000,
  );

  return (
    <EmojiOption
      style={props.style as never}
      type={props.item.t}
      tabIndex={props.tabIndex}
      role="listitem"
      onClick={(e) => {
        if (props.item.t === 2) {
          // Toggle favourability if alt is held down.
          if (e.altKey) {
            favourites.toggleEmoji(props.item.emoji.id);
            return;
          }
          onTextReplacement(`:${props.item.emoji.id}:`);
          debouncedRecordUse(props.item.emoji.id);
        }

        if (props.item.t === 4) {
          const id = getEmojiByShorthand(props.item.name)!.shorthands[0];
          // Toggle favourability if alt is held down.
          if (e.altKey) {
            favourites.toggleEmoji(id);
            return;
          }
          onTextReplacement(
            `${UNICODE_EMOJI_PACK_PUA[settings.getValue("appearance:unicode_emoji")!] ?? ""}${isRegionalIndicator(props.item.text) ? UNICODE_ZWNJ + props.item.text : props.item.text}`,
          );
          debouncedRecordUse(id);
        }
      }}
      onMouseEnter={() => {
        if (props.item.t === 2 || props.item.t === 4)
          setHoveredItem(props.item);
      }}
    >
      <Switch>
        <Match when={props.item.t === 0}>
          <ServerHeader server={(props.item as Item & { t: 0 }).server} />
        </Match>
        <Match when={props.item.t === 2}>
          <Ripple />
          <Show keyed when={(props.item as Item & { t: 2 }).emoji.id}>
            <img
              use:floating={{
                contextMenu: () => (
                  <EmojiContextMenu
                    id={(props.item as Item & { t: 2 }).emoji.id}
                  />
                ),
              }}
              src={(props.item as Item & { t: 2 }).emoji.url}
            />
          </Show>
        </Match>
        <Match when={props.item.t === 3}>
          <Row align>
            <Show when={(props.item as Item & { t: 3 }).symbol}>
              <Symbol fill={(props.item as Item & { t: 3 }).fill}>
                {(props.item as Item & { t: 3 }).symbol}
              </Symbol>
            </Show>
            <span>{(props.item as Item & { t: 3 }).title}</span>
          </Row>
        </Match>
        <Match when={props.item.t === 4}>
          <Ripple />
          <Show keyed when={(props.item as Item & { t: 4 }).text}>
            <span
              use:floating={{
                contextMenu: () => (
                  <EmojiContextMenu id={(props.item as Item & { t: 4 }).name} />
                ),
              }}
            >
              <UnicodeEmoji
                emoji={(props.item as Item & { t: 4 }).text}
                pack={settings.getValue("appearance:unicode_emoji")}
              />
            </span>
          </Show>
        </Match>
      </Switch>
    </EmojiOption>
  );
};

const EmojiOption = styled("div", {
  base: {},
  variants: {
    type: {
      0: {},
      1: {},
      2: {},
      3: {},
      4: {},
    },
  },
  compoundVariants: [
    {
      type: [0, 3],
      css: {
        position: "absolute",
        left: 0,
        width: "100% !important",
        display: "flex",
        alignItems: "center",
        paddingInline: "var(--gap-md)",
        zIndex: 1,
      },
    },
    {
      type: [2, 4],
      css: {
        width: "100%",
        cursor: "pointer",
        position: "relative",
        padding: "var(--gap-sm)",
        borderRadius: "var(--borderRadius-sm)",

        "--emoji-size": "100%",
        "& img": {
          width: "100%",
          height: "100%",
          objectFit: "contain",
        },
      },
    },
  ],
});

function ServerHeader(props: { server: Server }) {
  return (
    <Row align>
      <Avatar
        size={24}
        src={props.server.animatedIconURL}
        fallback={props.server.name}
      />
      <span>{props.server.name}</span>
    </Row>
  );
}
