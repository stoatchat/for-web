import { BiRegularCheckCircle, BiSolidCheckCircle } from "solid-icons/bi";
import {
  Accessor,
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
} from "solid-js";

import { useLingui } from "@lingui/solid/macro";
import type { Channel, Server, ServerFlags } from "stoat.js";
import { styled } from "styled-system/jsx";

import { ChannelIcon, useDevice } from "@revolt/common";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import {
  Column,
  Draggable,
  Header,
  IconButton,
  MenuButton,
  OverflowingText,
  Row,
  Tooltip,
  typography,
} from "@revolt/ui";
import { UnreadCallout } from "@revolt/ui/components/features/navigation/UnreadCallout";
import { VoiceChannelPreview } from "@revolt/ui/components/features/voice/VoiceChannelPreview";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { SidebarBase } from "./common";
import {
  OrderedCategory,
  applyChannelOrdering,
  orderedCategories,
} from "./ordering";

interface Props {
  /**
   * Server to display sidebar for
   */
  server: Server;

  /**
   * Currently selected channel ID
   */
  channelId: string | undefined;

  /**
   * Open server information modal
   */
  openServerInfo: () => void;

  /**
   * Open server settings modal
   */
  openServerSettings: () => void;

  /**
   * Menu generator
   */
  menuGenerator: (target: Server | Channel) => JSX.Directives["floating"];
}

/**
 * Ordered category data returned from server
 */
type CategoryData = OrderedCategory & { channels: Channel[] };

type OrderingEvent =
  | {
      type: "categories";
      ids: string[];
    }
  | {
      type: "category";
      id: string;
      reorderedIds: string[];
      visibleIds: string[];
      moved: boolean;
    };

/**
 * Display server information and channels
 */
export const ServerSidebar = (props: Props) => {
  const navigate = useNavigate();
  const { isMobile } = useDevice();

  // Users can manage certain parts of the server individually, regardless of their ManageServer Permission
  const canManageServer = () =>
    props.server.orPermission(
      "ManageServer",
      "ManageCustomisation",
      "ManageRole",
      "ManagePermissions",
    );

  const categories = createMemo<CategoryData[]>(() => {
    const channels = new Map(
      props.server.channels.map((channel) => [channel.id, channel]),
    );

    return orderedCategories(
      props.server.categories,
      props.server.channels.map((channel) => channel.id),
    ).map((category) => ({
      ...category,
      channels: category.channelIds
        .map((id) => channels.get(id)!)
        .filter((channel) => channel),
    }));
  });

  // TODO: this does not filter visible channels at the moment because the state for categories is not stored anywhere
  /** Gets a list of channels that are currently not hidden inside a closed category */
  const visibleChannels = () =>
    categories().flatMap((category) => category.channels);

  // TODO: when navigating channels, we want to add aria-keyshortcuts={localized-shortcut} to the next/previous channels
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-keyshortcuts
  // TODO: issue warning if nothing is found somehow? warnings can be nicer than flat out not working
  // TODO: we want it to feel smooth when navigating through channels, so we'll want to select channels immediately but not actually navigate until we're done moving through them
  /** Navigates to the channel offset from the current one, wrapping around if needed */
  const navigateChannel = (byOffset: number) => {
    if (props.channelId == null) return;

    const channels = visibleChannels();

    const currentChannelIndex = channels.findIndex(
      (channel) => channel.id === props.channelId,
    );

    // this will wrap the index around
    const nextChannel = channels.at(
      (currentChannelIndex + byOffset) % channels.length,
    );

    if (nextChannel) {
      navigate(`/server/${props.server.id}/channel/${nextChannel.id}`);
    }
  };

  createKeybind(KeybindAction.NAVIGATION_CHANNEL_UP, () => navigateChannel(-1));

  createKeybind(KeybindAction.NAVIGATION_CHANNEL_DOWN, () =>
    navigateChannel(1),
  );

  createKeybind(KeybindAction.CHAT_MARK_SERVER_AS_READ, () => {
    if (props.server.unread) {
      props.server.ack();
    }
  });

  const noOrdering = () => !props.server.havePermission("ManageChannel");

  const [list, setList] = createSignal<HTMLDivElement>();

  let heldEvent: OrderingEvent & { type: "category" } = null!;
  function handleOrdering(event: OrderingEvent) {
    if (event.type === "category" && event.moved && !heldEvent) {
      heldEvent = event;
      return;
    }

    if (event.type === "categories") {
      const ids = event.ids.filter((id) => id !== "default");

      props.server.edit({
        categories: ["default", ...ids]
          .map((id) => categories().find((category) => category.id === id)!)
          .filter((category) => category)
          .map(({ id, title, channelIds }) => ({
            id,
            title,
            channels: channelIds,
          })),
      });
    } else {
      props.server.edit({
        categories: categories().map(({ id, title, channelIds }) => {
          const reordered =
            heldEvent?.id === id
              ? heldEvent
              : event.id === id
                ? event
                : undefined;

          return {
            id,
            title,
            channels: reordered
              ? applyChannelOrdering(
                  channelIds,
                  reordered.visibleIds,
                  reordered.reorderedIds,
                )
              : channelIds,
          };
        }),
      });

      heldEvent = null!;
    }
  }

  return (
    <SidebarBase
      class="channel_bar server"
      use:floating={props.menuGenerator(props.server)}
    >
      <Switch
        fallback={
          <Header placement="secondary">
            <ServerInfo
              server={props.server}
              canManageServer={canManageServer()}
              openServerInfo={props.openServerInfo}
              openServerSettings={props.openServerSettings}
            />
          </Header>
        }
      >
        <Match when={props.server.banner}>
          <Header
            image
            placement="secondary"
            style={{
              background: `url('${props.server.bannerURL}')`,
            }}
          >
            <ServerInfo
              server={props.server}
              canManageServer={canManageServer()}
              openServerInfo={props.openServerInfo}
              openServerSettings={props.openServerSettings}
            />
          </Header>
        </Match>
      </Switch>
      <ChannelList>
        <UnreadCallout list={list} />
        <div
          ref={setList}
          use:invisibleScrollable
          style={{ height: "100%" }}
          use:floating={props.menuGenerator(props.server)}
        >
          <Show
            when={categories().find((category) => category.id === "default")}
          >
            {(category) => (
              <Category
                server={props.server}
                category={category()}
                channelId={props.channelId}
                menuGenerator={props.menuGenerator}
                dragDisabled={() => true}
                setDragDisabled={() => void 0}
                noOrdering={noOrdering}
                handleOrdering={handleOrdering}
              />
            )}
          </Show>
          <Draggable
            dragHandles
            dropIndicator
            type="category"
            //TODO - No channel ordering on mobile due to usability issue
            //Consider adding a way to enable reordering with dragHandles in server settings
            disabled={isMobile || noOrdering()}
            items={categories().filter((category) => category.id !== "default")}
            onChange={(ids) => handleOrdering({ type: "categories", ids })}
          >
            {(entry) => (
              <Category
                server={props.server}
                category={entry.item}
                channelId={props.channelId}
                menuGenerator={props.menuGenerator}
                dragDisabled={entry.dragDisabled}
                setDragDisabled={entry.setDragDisabled}
                noOrdering={noOrdering}
                handleOrdering={handleOrdering}
              />
            )}
          </Draggable>
        </div>
      </ChannelList>
    </SidebarBase>
  );
};

const ChannelList = styled("div", {
  base: {
    position: "relative",
    flexGrow: 1,
    minHeight: 0,
    marginBottom: "var(--gap-md)",
  },
});

/**
 * Server Information
 */
function ServerInfo(
  props: Pick<Props, "server" | "openServerInfo" | "openServerSettings"> & {
    canManageServer: boolean;
  },
) {
  return (
    <Row align grow minWidth={0}>
      <ServerBadge flags={props.server.flags} />
      <ServerName onClick={props.openServerInfo}>
        <TextWithEmoji content={props.server.name} />
      </ServerName>
      <Show when={props.canManageServer}>
        <IconButton
          size="xs"
          width="narrow"
          variant={props.server.banner ? "_header" : "standard"}
          onPress={props.openServerSettings}
        >
          <Symbol fill weight={350}>
            settings
          </Symbol>
        </IconButton>
      </Show>
    </Row>
  );
}

/**
 * Server name
 */
const ServerName = styled("a", {
  base: {
    flexGrow: 1,
    minWidth: 0,

    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
});

/**
 * Server badge
 */
function ServerBadge(props: { flags: ServerFlags }) {
  const { t } = useLingui();

  return (
    <Show when={props.flags}>
      <Tooltip
        content={props.flags === 1 ? t`Official Server` : t`Verified`}
        placement="top"
      >
        {props.flags === 1 ? (
          <BiSolidCheckCircle size={12} />
        ) : (
          <BiRegularCheckCircle size={12} />
        )}
      </Tooltip>
    </Show>
  );
}

/**
 * Single category entry
 */
function Category(
  props: {
    server: Server;
    category: CategoryData;
    channelId: string | undefined;
    noOrdering: Accessor<boolean>;
    handleOrdering: (event: OrderingEvent) => void;
  } & Pick<Props, "menuGenerator"> & {
      dragDisabled: Accessor<boolean>;
      setDragDisabled: (value: boolean) => void;
    },
) {
  const state = useState();
  const isOpen = () => state.layout.getSectionState(props.category.id, true);
  const { isMobile } = useDevice();

  const channels = createMemo(() =>
    props.category.channels.filter(
      (channel) =>
        props.category.id === "default" ||
        isOpen() ||
        channel.unread ||
        channel.id === props.channelId,
    ),
  );

  return (
    <CategorySection>
      <Show when={props.category.id !== "default"}>
        <div use:floating={props.menuGenerator(props.category as never)}>
          <CategoryBase
            open={isOpen()}
            onClick={() => {
              state.layout.toggleSectionState(props.category.id, true);
            }}
            {...createDragHandle(props.dragDisabled, props.setDragDisabled)}
          >
            {props.category.title}
            <Symbol size={12} weight={300}>
              chevron_right
            </Symbol>
          </CategoryBase>
        </div>
      </Show>
      <Draggable
        dropIndicator
        type="channels"
        items={channels()}
        onChange={(reorderedIds) => {
          const current = channels();
          props.handleOrdering({
            type: "category",
            id: props.category.id,
            reorderedIds,
            visibleIds: current.map((channel) => channel.id),
            moved: reorderedIds.length !== current.length,
          });
        }}
        //TODO - No channel ordering on mobile due to usability issue
        //Consider adding a way to enable reordering with dragHandles in server settings
        disabled={isMobile || props.noOrdering() || !isOpen()}
        minimumDropAreaHeight="42px"
      >
        {(entry) => (
          <Entry
            channel={entry.item}
            active={entry.item.id === props.channelId}
            menuGenerator={props.menuGenerator}
          />
        )}
      </Draggable>
    </CategorySection>
  );
}

const CategorySection = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-sm)",
    flexDirection: "column",
    paddingBlock: "var(--gap-sm)",
    borderRadius: "var(--borderRadius-sm)",
    background: "var(--md-sys-color-surface-container-low)",

    "&:first-child": {
      paddingTop: 0,
    },
  },
});

/**
 * Category title styling
 */
const CategoryBase = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",

    padding: "0 var(--gap-sm)",
    paddingLeft: "calc(var(--gap-lg) + 5px)",
    paddingBlock: "var(--gap-sm)",

    cursor: "pointer",
    userSelect: "none",
    transition: "var(--transitions-fast) all",

    "--color": "var(--md-sys-color-on-surface)",
    color: "var(--color)",
    fill: "var(--color)",

    ...typography.raw({ class: "label", size: "small" }),
    fontSize: "13px",

    "&:hover": {
      "--color": "var(--md-sys-color-on-surface-variant)",
    },

    "& span": {
      transition: "var(--transitions-fast) transform",
    },
  },
  variants: {
    open: {
      true: {
        "& span": {
          transform: "rotateZ(90deg)",
        },
      },
    },
  },
});

/**
 * Server channel entry
 */
function Entry(
  props: { channel: Channel; active: boolean } & Pick<Props, "menuGenerator">,
) {
  const state = useState();
  const voice = useVoice();
  const { openModal } = useModals();
  const { isMobile } = useDevice();

  const canEditChannel = createMemo(() =>
    (["ManageChannel", "ManagePermissions", "ManageWebhooks"] as const).some(
      (perm) => props.channel.server?.havePermission(perm),
    ),
  );

  const canInvite = createMemo(() =>
    props.channel.server?.havePermission("InviteOthers"),
  );

  const alertState = createMemo(
    () =>
      !props.active &&
      props.channel.unread &&
      (props.channel.mentions?.size || true),
  );

  const inCall = () => props.channel.id === voice.channel()?.id;

  const attentionState = createMemo(() =>
    props.active
      ? "selected"
      : inCall()
        ? "active"
        : state.notifications.isChannelMuted(props.channel)
          ? "muted"
          : props.channel.unread
            ? "active"
            : "normal",
  );

  return (
    <Column gap="sm">
      <MenuButton
        href={`/server/${props.channel.serverId}/channel/${props.channel.id}`}
        use:floating={props.menuGenerator(props.channel)}
        size="normal"
        data-unread={props.channel.unread ? "" : undefined}
        data-mentions={props.channel.mentions?.size || undefined}
        alert={alertState()}
        attention={attentionState()}
        icon={<ChannelIcon channel={props.channel} />}
        actions={
          <Show when={!isMobile}>
            <Show when={canInvite()}>
              <a
                use:floating={{
                  tooltip: { placement: "top", content: "Create Invite" },
                }}
                onClick={(e) => {
                  e.preventDefault();
                  openModal({
                    type: "create_invite",
                    channel: props.channel,
                  });
                }}
              >
                <Symbol size={16} fill>
                  person_add
                </Symbol>
              </a>
            </Show>
            <Show when={canEditChannel()}>
              <a
                use:floating={{
                  tooltip: { placement: "top", content: "Edit Channel" },
                }}
                onClick={(e) => {
                  e.preventDefault();
                  openModal({
                    type: "settings",
                    config: "channel",
                    context: props.channel,
                  });
                }}
              >
                <Symbol size={16} fill>
                  settings
                </Symbol>
              </a>
            </Show>
          </Show>
        }
      >
        <OverflowingText>
          <TextWithEmoji content={props.channel.name!} />
        </OverflowingText>
      </MenuButton>

      <VoiceChannelPreview channel={props.channel} />
    </Column>
  );
}
