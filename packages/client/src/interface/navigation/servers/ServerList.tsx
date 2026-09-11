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
import { css, cva } from "styled-system/css";
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
import { UserMenu } from "./UserMenu";
import { RailEntry, createRailDrag } from "./railDrag";

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

  let rail!: HTMLDivElement;

  /**
   * Fold one entry into another, making a folder out of two servers or
   * dropping a server into the folder it was let go over
   * @param target Entry dropped onto
   * @param incoming Server being dragged
   */
  function fold(target: string, incoming: string) {
    const entry = props.orderedEntries.find((item) => item.id === target);
    if (!entry) return;

    if (entry.type === "folder") {
      state.ordering.addToFolder(entry.folder.id, incoming);
    } else {
      state.ordering.createFolder("New Folder", [target, incoming]);
    }
  }

  /**
   * Apply a drop which reorders rather than folds
   * @param moved Entry being dragged
   * @param before Entry it should sit in front of
   * @param parent Folder it should land inside, if any
   */
  function place(moved: string, before?: string, parent?: string) {
    if (parent) {
      state.ordering.placeInFolder(parent, moved, before);
      return;
    }

    // out of a folder and back into the list proper
    if (state.ordering.folderOf(moved)) {
      state.ordering.removeFromFolder(moved);
    }

    const ids = props.orderedEntries
      .map((entry) => entry.id)
      .filter((id) => id !== moved);

    const at = before ? ids.indexOf(before) : -1;
    const index = at === -1 ? ids.length : at;

    props.setServerOrder([...ids.slice(0, index), moved, ...ids.slice(index)]);
  }

  const drag = createRailDrag({
    entries: (): RailEntry[] =>
      props.orderedEntries.flatMap<RailEntry>((entry) =>
        entry.type === "folder"
          ? [
              { id: entry.id, kind: "folder" as const },
              // members are only draggable while you can see them
              ...(entry.folder.collapsed
                ? []
                : entry.servers.map((server) => ({
                    id: server.id,
                    kind: "server" as const,
                    parent: entry.id,
                  }))),
            ]
          : [{ id: entry.id, kind: "server" as const }],
      ),
    container: () => rail,
    label: (id) => {
      for (const entry of props.orderedEntries) {
        if (entry.id === id)
          return entry.type === "folder"
            ? entry.folder.name || "Folder"
            : entry.server.name;

        if (entry.type !== "folder") continue;

        const member = entry.servers.find((server) => server.id === id);
        if (member) return member.name;
      }
    },
    //TODO - No server ordering on mobile due to usability issue
    //Consider adding a way to enable reordering in user settings
    disabled: () => isMobile,
    onFold: fold,
    onMove: (moved, before, parent) => place(moved, before, parent),
  });

  /**
   * Entry currently being dragged, if any
   */
  const heldEntry = () => {
    if (!drag.pointer()) return undefined;

    const id = drag.dragging();
    const top = props.orderedEntries.find((entry) => entry.id === id);
    if (top) return top;

    // a server being dragged out of an expanded folder
    for (const entry of props.orderedEntries) {
      if (entry.type !== "folder") continue;

      const server = entry.servers.find((member) => member.id === id);
      if (server) return { type: "server", id, server } as ResolvedEntry;
    }
  };

  /**
   * Whether the drop would land after every entry
   */
  const insertionAtEnd = () => {
    const intent = drag.intent();
    return intent?.type === "move" && intent.before === undefined;
  };

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
        <div ref={rail}>
          <For each={props.orderedEntries}>
            {(entry) => (
              <Switch>
                <Match when={entry?.type === "server" && entry}>
                  {(item) => (
                    <ServerEntry
                      server={item().server}
                      selectedServer={props.selectedServer}
                      menuGenerator={props.menuGenerator}
                      drag={drag}
                    />
                  )}
                </Match>
                <Match when={entry?.type === "folder" && entry}>
                  {(item) => (
                    <FolderEntry
                      entry={item()}
                      selectedServer={props.selectedServer}
                      menuGenerator={props.menuGenerator}
                      drag={drag}
                    />
                  )}
                </Match>
              </Switch>
            )}
          </For>
          <Show when={insertionAtEnd()}>
            <div class={railInsertion} style={{ position: "relative" }} />
          </Show>
        </div>
        <div aria-live="polite" class={srOnly}>
          {drag.status()}
        </div>
        <Show when={heldEntry()}>
          {(held) => (
            <div
              class={railGhost}
              style={{
                left: `${(drag.pointer()?.x ?? 0) - 21}px`,
                top: `${(drag.pointer()?.y ?? 0) - 21}px`,
              }}
            >
              <Switch>
                <Match when={held().type === "server" && held()}>
                  {(item) => (
                    <Avatar
                      size={42}
                      src={(item() as { server: Server }).server.iconURL}
                      fallback={(item() as { server: Server }).server.name}
                    />
                  )}
                </Match>
                <Match when={held().type === "folder" && held()}>
                  {(item) => (
                    <Avatar
                      size={42}
                      fallback={
                        <FolderPreview
                          servers={(item() as { servers: Server[] }).servers}
                        />
                      }
                    />
                  )}
                </Match>
              </Switch>
            </div>
          )}
        </Show>
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
  drag: RailDrag;
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
        ref={(el) => props.drag.register(props.server.id, el)}
        onPointerDown={(e) => props.drag.press(props.server.id, e)}
        onKeyDown={(e) => props.drag.keys(props.server.id, e)}
        class={entryContainer({
          indicator:
            props.selectedServer() === props.server.id
              ? "selected"
              : props.server.unread &&
                  !state.notifications.isMuted(props.server)
                ? "alert"
                : undefined,
        })}
        classList={{
          [railFolding]: isFoldTarget(props.drag, props.server.id),
          [railHeld]:
            props.drag.dragging() === props.server.id ||
            props.drag.carrying() === props.server.id,
        }}
        use:floating={props.menuGenerator(props.server)}
      >
        <Show when={isInsertionBefore(props.drag, props.server.id)}>
          <div class={railInsertion} />
        </Show>
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
  drag: RailDrag;
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
    <FolderGroup
      expanded={!collapsed()}
      style={{
        background:
          !collapsed() && props.entry.folder.colour
            ? `color-mix(in srgb, ${props.entry.folder.colour} 18%, transparent)`
            : undefined,
      }}
    >
      <Tooltip
        placement="right"
        content={props.entry.folder.name || "Folder"}
        aria={props.entry.folder.name || "Folder"}
      >
        <div
          ref={(el) => props.drag.register(props.entry.id, el)}
          onPointerDown={(e) => props.drag.press(props.entry.id, e)}
          onKeyDown={(e) => props.drag.keys(props.entry.id, e)}
          class={entryContainer({
            indicator:
              collapsed() && holdsSelected()
                ? "selected"
                : collapsed() && unread()
                  ? "alert"
                  : undefined,
          })}
          classList={{
            [railFolding]: isFoldTarget(props.drag, props.entry.id),
            [railHeld]:
              props.drag.dragging() === props.entry.id ||
              props.drag.carrying() === props.entry.id,
          }}
          use:floating={{
            contextMenu: () => (
              <ServerFolderContextMenu folder={props.entry.folder} />
            ),
          }}
          style={{ color: props.entry.folder.colour ?? undefined }}
        >
          <Show when={isInsertionBefore(props.drag, props.entry.id)}>
            <div class={railInsertion} />
          </Show>
          <a
            role="button"
            tabindex="0"
            aria-expanded={!collapsed()}
            onClick={() => state.ordering.toggleFolder(props.entry.folder.id)}
          >
            <FolderIcon
              style={{
                // a box shadow rather than an outline, so that the unread
                // badge still draws on top of it
                "box-shadow":
                  collapsed() && props.entry.folder.colour
                    ? `0 0 0 2px ${props.entry.folder.colour}`
                    : undefined,
              }}
            >
              <Avatar
                size={42}
                holepunch={collapsed() && mentions() ? "top-right" : "none"}
                overlay={
                  <Show when={collapsed() && mentions()}>
                    <Unreads.Graphic count={mentions()} unread />
                  </Show>
                }
                fallback={
                  <Show
                    when={collapsed() && props.entry.servers.length}
                    fallback={<MdFolder />}
                  >
                    <FolderPreview servers={props.entry.servers} />
                  </Show>
                }
              />
            </FolderIcon>
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
              drag={props.drag}
            />
          )}
        </For>
      </Show>
    </FolderGroup>
  );
}

type RailDrag = ReturnType<typeof createRailDrag>;

/**
 * Holds the ring which shows a collapsed folder's colour
 */
const FolderIcon = styled("div", {
  base: {
    display: "grid",
    placeItems: "center",
    // the padding is what holds the ring off the icon itself
    padding: "2px",
    borderRadius: "var(--borderRadius-circle)",
  },
});

/**
 * Announcements are for screen readers, not for looking at
 */
const srOnly = css({
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
});

/**
 * Whether dropping now would fold into this entry
 * @param drag Rail drag
 * @param id Entry id
 */
function isFoldTarget(drag: RailDrag, id: string) {
  const intent = drag.intent();
  return intent?.type === "fold" && intent.target === id;
}

/**
 * Whether the drop would land immediately above this entry
 * @param drag Rail drag
 * @param id Entry id
 */
function isInsertionBefore(drag: RailDrag, id: string) {
  const intent = drag.intent();
  return intent?.type === "move" && intent.before === id;
}

/**
 * Ring drawn around the entry a drop would fold into
 */
const railFolding = css({
  "&:after": {
    content: "' '",
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "50px",
    height: "50px",
    borderRadius: "var(--borderRadius-circle)",
    outline: "2px solid var(--md-sys-color-primary)",
  },
});

/**
 * The entry being dragged stays in place, faded, so the list never moves
 */
const railHeld = css({
  opacity: 0.35,
});

/**
 * Line showing where a reorder would drop the entry
 */
const railInsertion = css({
  position: "absolute",
  top: "-2px",
  left: "6px",
  right: "6px",
  height: "4px",
  borderRadius: "2px",
  background: "var(--md-sys-color-primary)",
});

/**
 * The dragged entry, following the cursor
 */
const railGhost = css({
  position: "fixed",
  pointerEvents: "none",
  opacity: 0.85,
  zIndex: 1000,
});

/**
 * The first few servers in a folder, shown on the folder itself while it is
 * collapsed so you can still tell what is inside
 */
function FolderPreview(props: { servers: Server[] }) {
  return (
    <FolderPreviewBase>
      <For each={props.servers.slice(0, 4)}>
        {(server) => (
          <Avatar size={13} src={server.iconURL} fallback={server.name} />
        )}
      </For>
    </FolderPreviewBase>
  );
}

/**
 * Lays the preview icons out two to a row, centred for folders holding fewer
 * than four servers
 */
const FolderPreviewBase = styled("div", {
  base: {
    width: "100%",
    height: "100%",

    display: "flex",
    flexWrap: "wrap",
    gap: "2px",
    alignContent: "center",
    justifyContent: "center",
  },
});

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
