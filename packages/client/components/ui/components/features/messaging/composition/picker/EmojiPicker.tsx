import {
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

import { VirtualContainer } from "@minht11/solid-virtual-container";
import { Emoji, Server } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { UnicodeEmoji } from "@revolt/markdown/emoji";
import { UNICODE_EMOJI_PACK_PUA } from "@revolt/markdown/emoji/UnicodeEmoji";
import { useState } from "@revolt/state";
import { Avatar, Ripple, TextField } from "@revolt/ui/components/design";
import { Row } from "@revolt/ui/components/layout";

import emojiMapping from "../../../../../emojiMapping.json";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
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
    }
  | {
      /**
       * Title header
       */
      t: 3;
      title: string;
    }
  | {
      /**
       * Unicode emoji
       */
      t: 4;
      name: string;
      text: string;
    };

const COLUMNS = 9;

const [hoveredItem, setHoveredItem] = createSignal<Item | null>(null);

export function EmojiPicker() {
  const client = useClient();
  const { ordering, settings } = useState();
  const { t } = useLingui();

  const [filter, setFilter] = createSignal("");

  let serverScrollTargetElement!: HTMLDivElement;
  let emojiScrollTargetElement!: HTMLDivElement;

  const items = createMemo(() => {
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
        ...Object.entries(emojiMapping)
          .filter(([name]) => name.toLowerCase().includes(filterText))
          .map(([name, text]) => ({ t: 4, name, text })),
      ] as Item[];
    }

    const items: Item[] = [];

    for (const server of ordering.orderedServers(client())) {
      const emojis = server.emojis;

      if (emojis.length === 0) continue;

      items.push({
        t: 0,
        server,
      });

      while (items.length % COLUMNS) {
        items.push({ t: 1 });
      }

      for (const emoji of emojis) {
        items.push({ t: 2, emoji });
      }

      while (items.length % COLUMNS) {
        items.push({ t: 1 });
      }
    }

    items.push({
      t: 3,
      title: "Default",
    });

    while (items.length % COLUMNS) {
      items.push({ t: 1 });
    }

    for (const emoji of Object.entries(emojiMapping)) {
      items.push({
        t: 4,
        name: emoji[0],
        text: emoji[1] as string,
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
        autoFocus
        variant="outlined"
        placeholder="Search for emojis..."
        value={filter()}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
        onInput={(e) => setFilter(e.currentTarget.value)}
      />
      <Row gap={"none"} class={compositionContent()}>
        <div
          ref={serverScrollTargetElement}
          use:invisibleScrollable={{
            class: scrollContainer({ component: "serverRail" }),
          }}
        >
          <VirtualContainer
            items={ordering
              .orderedServers(client())
              .filter((s) => s.emojis.length > 0)}
            scrollTarget={serverScrollTargetElement}
            itemSize={{ height: 40 }}
          >
            {(props) => (
              <ServerItem
                style={props.style}
                tabIndex={props.tabIndex}
                item={props.item}
                onClick={() => {
                  const idx = items().findIndex(
                    (item) => item.t === 0 && item.server.id === props.item.id,
                  );
                  if (idx !== -1 && emojiScrollTargetElement) {
                    emojiScrollTargetElement.scrollTop =
                      Math.floor(idx / COLUMNS) * 40;
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
              crossAxisCount={() => COLUMNS}
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
                            :{(item() as Item & { t: 2 }).emoji.name}:
                          </Match>
                          <Match when={item().t === 4}>
                            :{(item() as Item & { t: 4 }).name}:
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
  item: Server;
  onClick: (e: MouseEvent) => void;
}) => (
  <ServerOption
    style={props.style as never}
    tabIndex={props.tabIndex}
    role="listitem"
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }}
    onClick={props.onClick}
  >
    <Avatar
      size={32}
      src={props.item.animatedIconURL}
      fallback={props.item.name}
    />
  </ServerOption>
);

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
    borderTop: "1px solid var(--colour-component-bg-3, rgba(255,255,255,0.06))",
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
    color: "var(--colour-foreground-muted, rgba(255,255,255,0.4))",
    marginTop: "1px",

    "& strong": {
      color: "var(--colour-foreground-secondary, rgba(255,255,255,0.65))",
      fontWeight: 500,
    },
  },
});

const EmojiItem = (props: { style: unknown; tabIndex: number; item: Item }) => {
  const state = useState();
  const { onTextReplacement } = useContext(CompositionMediaPickerContext);

  return (
    <EmojiOption
      style={props.style as never}
      type={props.item.t}
      tabIndex={props.tabIndex}
      role="listitem"
      onClick={() => {
        if (props.item.t === 2) {
          onTextReplacement(`:${props.item.emoji.id}:`);
        }

        if (props.item.t === 4) {
          onTextReplacement(
            `${UNICODE_EMOJI_PACK_PUA[state.settings.getValue("appearance:unicode_emoji")!] ?? ""}${props.item.text}`,
          );
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
            <img src={(props.item as Item & { t: 2 }).emoji.url} />
          </Show>
        </Match>
        <Match when={props.item.t === 3}>
          <span>{(props.item as Item & { t: 3 }).title}</span>
        </Match>
        <Match when={props.item.t === 4}>
          <Ripple />
          <Show keyed when={(props.item as Item & { t: 4 }).text}>
            <UnicodeEmoji
              emoji={(props.item as Item & { t: 4 }).text}
              pack={state.settings.getValue("appearance:unicode_emoji")}
            />
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
