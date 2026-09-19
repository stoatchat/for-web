import {
  Accessor,
  JSX,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
  splitProps,
} from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import type { User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  Avatar,
  Badge,
  Deferred,
  Header,
  IconButton,
  List,
  ListItem,
  ListSubheader,
  NavigationRail,
  NavigationRailItem,
  OverflowingText,
  Spacer,
  UserStatus,
  main,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { HeaderIcon } from "./common/CommonHeader";

/**
 * Base layout of the friends page
 */
const Base = styled("div", {
  base: {
    width: "100%",
    display: "flex",
    flexDirection: "column",

    "& .FriendsList": {
      height: "100%",
      paddingInline: "var(--gap-lg)",
    },
  },
});

/**
 * Search input for the friends list
 */
const SearchInput = styled("input", {
  base: {
    height: "40px",
    flex: "0 1 240px",
    minWidth: 0,
    paddingInline: "16px",
    borderRadius: "var(--borderRadius-full)",

    // Header has 600 weight, reset for input text
    fontWeight: 400,
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",

    "&::placeholder": {
      color: "var(--md-sys-color-on-surface-variant)",
    },

    "&:focus-visible": {
      outline: "2px solid var(--md-sys-color-primary)",
    },

    // Header has no right padding on tablet, keep distance from the edge
    _tablet: {
      marginRight: "8px",
    },
  },
});

/**
 * Friends menu
 */
export function Friends() {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  /**
   * Reference to the parent scroll container
   */
  let scrollTargetElement!: HTMLDivElement;

  /**
   * Signal required for reacting to ref changes
   */
  const targetSignal = () => scrollTargetElement;

  /**
   * Generate lists of all users
   */
  const lists = createMemo(() => {
    const list = client()!.users.toList();

    const friends = list
      .filter((user) => user.relationship === "Friend")
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return {
      friends,
      online: friends.filter((user) => user.online),
      incoming: list
        .filter((user) => user.relationship === "Incoming")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      outgoing: list
        .filter((user) => user.relationship === "Outgoing")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      blocked: list
        .filter((user) => user.relationship === "Blocked")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  });

  /**
   * Search query state
   */
  const [searchQuery, setSearchQuery] = createSignal("");

  /**
   * Whether a search is currently active
   */
  const isSearching = () => searchQuery().trim() !== "";

  /**
   * Filtered lists of users matching the search query
   */
  const filteredLists = createMemo(() => {
    const query = searchQuery().trim().toLowerCase();
    const all = lists();
    if (!query) return all;

    /**
     * Whether the username or display name contains the query
     */
    const matches = (user: User) =>
      user.username.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query);

    return {
      friends: all.friends.filter(matches),
      online: all.online.filter(matches),
      incoming: all.incoming.filter(matches),
      outgoing: all.outgoing.filter(matches),
      blocked: all.blocked.filter(matches),
    };
  });

  // Pending request count stays constant regardless of search filter
  const pending = () => {
    const incoming = lists().incoming;
    return incoming.length > 99 ? "99+" : incoming.length;
  };

  const [page, setPage] = createSignal("online");

  return (
    <Base>
      <Header placement="primary">
        <HeaderIcon>
          <Symbol>group</Symbol>
        </HeaderIcon>
        <Trans>Friends</Trans>
        <Spacer />
        <SearchInput
          type="search"
          aria-label={t`Search`}
          placeholder={t`Search for users...`}
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Header>

      <main class={main()}>
        <div
          style={{
            position: "relative",
            "min-height": 0,
          }}
        >
          <NavigationRail contained value={page} onValue={setPage}>
            <div style={{ "margin-top": "6px", "margin-bottom": "12px" }}>
              <IconButton
                variant="filled"
                shape="square"
                onPress={() =>
                  openModal({
                    type: "add_friend",
                    client: client(),
                  })
                }
                use:floating={{
                  tooltip: {
                    placement: "right",
                    content: t`Add a new friend`,
                  },
                }}
              >
                <Symbol>add</Symbol>
              </IconButton>
            </div>

            <NavigationRailItem
              icon={<Symbol>waving_hand</Symbol>}
              value="online"
            >
              <Trans>Online</Trans>
            </NavigationRailItem>
            <NavigationRailItem icon={<Symbol>all_inbox</Symbol>} value="all">
              <Trans>All</Trans>
            </NavigationRailItem>
            <NavigationRailItem
              icon={<Symbol>notifications</Symbol>}
              value="pending"
            >
              <Trans>Pending</Trans>
              <Show when={pending()}>
                <Badge slot="badge" variant="large">
                  {pending()}
                </Badge>
              </Show>
            </NavigationRailItem>
            <NavigationRailItem icon={<Symbol>block</Symbol>} value="blocked">
              <Trans>Blocked</Trans>
            </NavigationRailItem>
          </NavigationRail>

          <Deferred>
            <div class="FriendsList" ref={scrollTargetElement} use:scrollable>
              <Switch
                fallback={
                  <People
                    title="Online"
                    users={filteredLists().online}
                    searching={isSearching()}
                    scrollTargetElement={targetSignal}
                  />
                }
              >
                <Match when={page() === "all"}>
                  <People
                    title="All"
                    users={filteredLists().friends}
                    searching={isSearching()}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
                <Match when={page() === "pending"}>
                  <People
                    title="Incoming"
                    users={filteredLists().incoming}
                    searching={isSearching()}
                    scrollTargetElement={targetSignal}
                  />
                  <People
                    title="Outgoing"
                    users={filteredLists().outgoing}
                    searching={isSearching()}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
                <Match when={page() === "blocked"}>
                  <People
                    title="Blocked"
                    users={filteredLists().blocked}
                    searching={isSearching()}
                    scrollTargetElement={targetSignal}
                  />
                </Match>
              </Switch>
            </div>
          </Deferred>
        </div>
      </main>
    </Base>
  );
}

/**
 * List of users
 */
function People(props: {
  users: User[];
  title: string;
  searching: boolean;
  scrollTargetElement: Accessor<HTMLDivElement>;
}) {
  return (
    <List>
      <ListSubheader>
        {props.title} {"–"} {props.users.length}
      </ListSubheader>

      <Show when={props.users.length === 0}>
        <ListItem disabled>
          <Show
            when={props.searching}
            fallback={<Trans>Nobody here right now!</Trans>}
          >
            <Trans>No users match your search</Trans>
          </Show>
        </ListItem>
      </Show>

      <VirtualContainer
        items={props.users}
        scrollTarget={props.scrollTargetElement()}
        itemSize={{ height: 58 }}
        // grid rendering:
        // itemSize={{ height: 60, width: 240 }}
        // crossAxisCount={(measurements) =>
        //   Math.floor(measurements.container.cross / measurements.itemSize.cross)
        // }
        // width: 100% needs to be removed from listentry below for this to work ^^^
      >
        {(item) => (
          <ContainerListEntry
            style={{
              ...item.style,
            }}
          >
            <Entry
              role="listitem"
              tabIndex={item.tabIndex}
              style={item.style}
              user={item.item}
            />
          </ContainerListEntry>
        )}
      </VirtualContainer>
    </List>
  );
}

const ContainerListEntry = styled("div", {
  base: {
    width: "100%",
  },
});

/**
 * Single user entry
 */
function Entry(
  props: { user: User } & Omit<
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >,
) {
  const { openModal } = useModals();
  const [local, remote] = splitProps(props, ["user"]);

  return (
    <a
      {...remote}
      use:floating={{
        contextMenu: () => <UserContextMenu user={local.user} />,
      }}
      onClick={() => openModal({ type: "user_profile", user: local.user })}
    >
      <ListItem>
        <Avatar
          slot="icon"
          size={36}
          src={local.user.animatedAvatarURL}
          holepunch={
            props.user.relationship === "Friend" ? "bottom-right" : "none"
          }
          overlay={
            <Show when={props.user.relationship === "Friend"}>
              <UserStatus.Graphic
                status={props.user.status?.presence ?? "Online"}
              />
            </Show>
          }
        />
        <OverflowingText>{local.user.displayName}</OverflowingText>
      </ListItem>
    </a>
  );
}
