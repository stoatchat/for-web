import {
  Accessor,
  For,
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
} from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { Channel, Server, User } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useInstance } from "@revolt/instance";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@revolt/routing";
import { ResolvedEntry, useState } from "@revolt/state";
import { Avatar, Column, Text, Time, Unreads, UserStatus } from "@revolt/ui";
import { VoiceStatus } from "@revolt/ui/components/design/VoiceStatus";

import MdAdd from "@material-design-icons/svg/filled/add.svg?component-solid";
import MdExplore from "@material-design-icons/svg/filled/explore.svg?component-solid";
import MdFolder from "@material-design-icons/svg/filled/folder.svg?component-solid";
import MdHome from "@material-design-icons/svg/filled/home.svg?component-solid";
import MdSettings from "@material-design-icons/svg/filled/settings.svg?component-solid";

import { ServerFolderContextMenu } from "../../../../components/app/menus";
import { Tooltip } from "../../../../components/ui/components/floating";
import { Draggable } from "../../../../components/ui/components/utils/Draggable";
import { UserMenu } from "./UserMenu";

interface Props {
  /**
   * Ordered server list
   */
  orderedServers: Server[];

  /**
   * Server list grouped into folders, for rendering
   */
  orderedEntries: ResolvedEntry[];

  /**
   * Set ordering of top-level entries
   * @param ids List of IDs
   */
  setServerOrder: (ids: string[]) => void;

  /**
   * Unread conversations list
   */
  unreadConversations: Channel[];

  /**
   * Current logged in user
   */
  user: User;

  /**
   * Selected server id
   */
  selectedServer: Accessor<string | undefined>;

  /**
   * Create or join server
   */
  onCreateOrJoinServer(): void;

  /**
   * Menu generator
   */
  menuGenerator: (target: Server | Channel) => JSX.Directives["floating"];
}

/**
 * Server list sidebar component
 */
export const ServerList = (props: Props) => {
  const state = useState();
  const client = useClient();
  const navigate = useNavigate();
  const { isMobile } = useDevice();
  const { openModal } = useModals();
  const instance = useInstance();

  const navigateServer = (byOffset: number) => {
    const serverId = props.selectedServer();
    if (serverId == null && props.orderedServers.length) {
      if (byOffset === 1) {
        navigate(`/server/${props.orderedServers[0].id}`);
      } else {
        navigate(
          `/server/${props.orderedServers[props.orderedServers.length - 1].id}`,
        );
      }
      return;
    }

    const currentServerIndex = props.orderedServers.findIndex(
      (server) => server.id === serverId,
    );

    const nextIndex = currentServerIndex + byOffset;

    if (nextIndex === -1) {
      return navigate("/app");
    }

    // this will wrap the index around
    const nextServer = props.orderedServers.at(
      nextIndex % props.orderedServers.length,
    );

    if (nextServer) {
      navigate(`/server/${nextServer.id}`);
    }
  };

  createKeybind(KeybindAction.NAVIGATION_SERVER_UP, () => navigateServer(-1));
  createKeybind(KeybindAction.NAVIGATION_SERVER_DOWN, () => navigateServer(1));

  const homeNotifications = createMemo(() => {
    return client().users.filter((user) => user.relationship === "Incoming")
      .length;
  });

  // Ref for floating menu
  const [menuButton, setMenuButton] = createSignal<HTMLDivElement>();

  return (
    <ServerListBase>
      <div use:invisibleScrollable={{ direction: "y", class: listBase() }}>
        <a
          class={entryContainer({
            indicator: !props.selectedServer() ? "selected" : undefined,
          })}
          href="/app"
          use:floating={{
            tooltip: {
              content: `You have ${homeNotifications()} pending friend requests.`,
              placement: "right",
            },
          }}
        >
          <Avatar
            size={42}
            fallback={<MdHome />}
            holepunch={homeNotifications() ? "top-right" : undefined}
            overlay={
              <Show when={homeNotifications()}>
                <Unreads.Graphic
                  unread={homeNotifications() !== 0}
                  count={homeNotifications()}
                />
              </Show>
            }
          />
        </a>
        <Tooltip
          placement="right"
          content={() => (
            <Column>
              <span>{props.user.username}</span>
              <Text class="label" size="small">
                {props.user.presence}
              </Text>
            </Column>
          )}
          aria={props.user.username}
        >
          <a ref={setMenuButton} class={entryContainer()}>
            <Avatar
              size={42}
              src={props.user.avatarURL}
              holepunch={"bottom-right"}
              overlay={<UserStatus.Graphic status={props.user.presence} />}
              interactive
            />
          </a>
          <UserMenu anchor={menuButton} />
        </Tooltip>
        <For each={props.unreadConversations.slice(0, 9)}>
          {(conversation) => (
            <Tooltip placement="right" content={conversation.displayName}>
              <a
                class={entryContainer()}
                use:floating={props.menuGenerator(conversation)}
                href={`/channel/${conversation.id}`}
              >
                <Avatar
                  size={42}
                  // TODO: fix this
                  src={conversation.iconURL}
                  holepunch={conversation.unread ? "top-right" : "none"}
                  overlay={
                    <>
                      <Show when={conversation.unread}>
                        <Unreads.Graphic
                          count={conversation.mentions?.size ?? 0}
                          unread
                        />
                      </Show>
                    </>
                  }
                  fallback={
                    conversation.name ?? conversation.recipient?.username
                  }
                  interactive
                />
              </a>
            </Tooltip>
          )}
        </For>
        <Show when={props.unreadConversations.length > 9}>
          <a class={entryContainer()} href={`/`}>
            <Avatar
              size={42}
              fallback={<>+{props.unreadConversations.length - 9}</>}
            />
          </a>
        </Show>
        <LineDivider />
        <Draggable
          type="servers"
          items={props.orderedEntries}
          onChange={props.setServerOrder}
          //TODO - No channel ordering on mobile due to usability issue
          //Consider adding a way to enable reordering in user settings
          disabled={isMobile}
        >
          {(entry) => (
            <Switch>
              <Match when={entry.item.type === "server" && entry.item}>
                {(item) => (
                  <ServerEntry
                    server={item().server}
                    selectedServer={props.selectedServer}
                    menuGenerator={props.menuGenerator}
                  />
                )}
              </Match>
              <Match when={entry.item.type === "folder" && entry.item}>
                {(item) => (
                  <FolderEntry
                    entry={item()}
                    selectedServer={props.selectedServer}
                    menuGenerator={props.menuGenerator}
                  />
                )}
              </Match>
            </Switch>
          )}
        </Draggable>
        <Tooltip placement="right" content={"Create or join a server"}>
          <a
            class={entryContainer()}
            onClick={() => props.onCreateOrJoinServer()}
          >
            <Avatar size={42} fallback={<MdAdd />} />
          </a>
        </Tooltip>
        <Show when={instance.isStoat}>
          <Tooltip placement="right" content={"Find new servers to join"}>
            <a
              href={state.layout.getLastActiveDiscoverPath()}
              class={entryContainer()}
            >
              <Avatar size={42} fallback={<MdExplore />} />
            </a>
          </Tooltip>
        </Show>
      </div>
      <Shadow>
        <div />
      </Shadow>
      <Tooltip placement="right" content="Settings">
        <a
          class={entryContainer()}
          onClick={() => openModal({ type: "settings", config: "user" })}
        >
          <Avatar size={42} fallback={<MdSettings />} interactive />
        </a>
      </Tooltip>
    </ServerListBase>
  );
};

/**
 * Server list container
 */
/**
 * A single server in the list
 */
function ServerEntry(props: {
  server: Server;
  selectedServer: Accessor<string | undefined>;
  menuGenerator: (target: Server | Channel) => JSX.Directives["floating"];
}) {
  const state = useState();

  return (
    <Tooltip
      placement="right"
      content={() => (
        <Column>
          <Text class="label" size="large">
            {props.server.name}
          </Text>{" "}
          <Show when={state.notifications.isMuted(props.server)}>
            <Text class="label" size="small">
              <Show
                when={state.notifications.getServerMute(props.server)!.until}
                fallback={<Trans>Muted</Trans>}
              >
                <Trans>
                  Muted until{" "}
                  <Time
                    format="datetime"
                    value={
                      state.notifications.getServerMute(props.server)!.until
                    }
                  />
                </Trans>
              </Show>
            </Text>
          </Show>
        </Column>
      )}
      aria={props.server.name}
    >
      <div
        class={entryContainer({
          indicator:
            props.selectedServer() === props.server.id
              ? "selected"
              : props.server.unread &&
                  !state.notifications.isMuted(props.server)
                ? "alert"
                : undefined,
        })}
        use:floating={props.menuGenerator(props.server)}
      >
        <a href={state.layout.getLastActiveServerPath(props.server.id)}>
          <Avatar
            size={42}
            src={props.server.iconURL}
            holepunch={
              props.server.mentions.length
                ? props.server.voiceStatus !== "none"
                  ? "right"
                  : "top-right"
                : props.server.voiceStatus !== "none"
                  ? "bottom-right"
                  : "none"
            }
            overlay={
              <>
                <Show
                  when={
                    props.server.mentions.length /* as opposed to item.unread */
                  }
                >
                  <Unreads.Graphic
                    count={props.server.mentions.length}
                    unread
                  />
                </Show>
                <Show when={props.server.voiceStatus !== "none"}>
                  <VoiceStatus.Graphic status={props.server.voiceStatus} />
                </Show>
              </>
            }
            fallback={props.server.name}
            interactive
          />
        </a>
      </div>
    </Tooltip>
  );
}

/**
 * A folder of servers, collapsible in place
 */
function FolderEntry(props: {
  entry: Extract<ResolvedEntry, { type: "folder" }>;
  selectedServer: Accessor<string | undefined>;
  menuGenerator: (target: Server | Channel) => JSX.Directives["floating"];
}) {
  const state = useState();

  const collapsed = () => props.entry.folder.collapsed ?? false;

  const mentions = () =>
    props.entry.servers.reduce(
      (count, server) => count + server.mentions.length,
      0,
    );

  const unread = () =>
    props.entry.servers.some(
      (server) => server.unread && !state.notifications.isMuted(server),
    );

  const holdsSelected = () =>
    props.entry.servers.some((server) => server.id === props.selectedServer());

  return (
    <FolderGroup expanded={!collapsed()}>
      <Tooltip
        placement="right"
        content={props.entry.folder.name || "Folder"}
        aria={props.entry.folder.name || "Folder"}
      >
        <div
          class={entryContainer({
            indicator:
              collapsed() && holdsSelected()
                ? "selected"
                : collapsed() && unread()
                  ? "alert"
                  : undefined,
          })}
          use:floating={{
            contextMenu: () => (
              <ServerFolderContextMenu folder={props.entry.folder} />
            ),
          }}
          style={{ color: props.entry.folder.colour ?? undefined }}
        >
          <a onClick={() => state.ordering.toggleFolder(props.entry.folder.id)}>
            <Avatar
              size={42}
              holepunch={collapsed() && mentions() ? "top-right" : "none"}
              overlay={
                <Show when={collapsed() && mentions()}>
                  <Unreads.Graphic count={mentions()} unread />
                </Show>
              }
              fallback={<MdFolder />}
            />
          </a>
        </div>
      </Tooltip>
      <Show when={!collapsed()}>
        <For each={props.entry.servers}>
          {(server) => (
            <ServerEntry
              server={server}
              selectedServer={props.selectedServer}
              menuGenerator={props.menuGenerator}
            />
          )}
        </For>
      </Show>
    </FolderGroup>
  );
}

const ServerListBase = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",

    fill: "var(--md-sys-color-on-surface)",
  },
});

/**
 * Container around list of servers
 */
const listBase = cva({
  base: {
    flexGrow: 1,
  },
});

/**
 * Server entries
 */
const entryContainer = cva({
  base: {
    width: "56px",
    height: "56px",
    position: "relative",
    display: "grid",
    flexShrink: 0,
    placeItems: "center",

    "&:before": {
      content: "' '",
      position: "absolute",
      width: "12px",
      height: "0px",
      transition: "var(--transitions-fast) all",
      left: "-8px",
      borderRadius: "4px",
      background: "var(--md-sys-color-on-surface)",
    },

    "&:hover:before": {
      height: "16px",
    },
  },
  variants: {
    indicator: {
      selected: {
        "&:before": {
          height: "32px !important",
        },
      },
      alert: {
        "&:before": {
          height: "8px",
        },
      },
    },
  },
});

/**
 * Group a folder together with its servers while expanded
 */
const FolderGroup = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
  },
  variants: {
    expanded: {
      true: {
        paddingBlock: "6px",
        borderRadius: "var(--borderRadius-lg)",
        background:
          "color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent)",
      },
      false: {},
    },
  },
  defaultVariants: { expanded: false },
});

/**
 * Divider line between two lists
 */
const LineDivider = styled("div", {
  base: {
    height: "1px",
    flexShrink: 0,
    margin: "6px auto",
    width: "calc(100% - 24px)",
    background: "var(--md-sys-color-outline-variant)",
  },
});

/**
 * Shadow at the bottom of the list
 */
const Shadow = styled("div", {
  base: {
    height: 0,
    zIndex: 1,
    position: "relative",

    "& div": {
      height: "12px",
      marginTop: "-12px",
      position: "absolute",
      background:
        "linear-gradient(to bottom, transparent, var(--md-sys-color-surface-container-highest))",
    },
  },
});
