import { Match, Show, Switch, createEffect, createMemo, on } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { useQuery } from "@tanstack/solid-query";
import { Channel, ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { floatingUserMenus } from "@revolt/app/menus/UserContextMenu";
import { useClient } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { userInformation } from "@revolt/markdown/users";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import {
  Avatar,
  Deferred,
  IconButton,
  MenuButton,
  OverflowingText,
  Profile,
  Row,
  Tooltip,
  UserStatus,
  Username,
  typography,
} from "@revolt/ui";

import MdAccountCircle from "@material-design-icons/svg/outlined/account_circle.svg?component-solid";
import MdBadge from "@material-design-icons/svg/outlined/badge.svg?component-solid";
import MdBlock from "@material-design-icons/svg/outlined/block.svg?component-solid";
import MdPersonRemove from "@material-design-icons/svg/outlined/person_remove.svg?component-solid";
import MdReport from "@material-design-icons/svg/outlined/report.svg?component-solid";

interface Props {
  /**
   * Channel
   */
  channel: Channel;

  /**
   * Scroll target element
   */
  scrollTargetElement: HTMLDivElement;
}

/**
 * Member Sidebar
 */
export function MemberSidebar(props: Props) {
  return (
    <Switch>
      <Match when={props.channel.type === "Group"}>
        <GroupMemberSidebar
          channel={props.channel}
          scrollTargetElement={props.scrollTargetElement}
        />
      </Match>
      <Match when={props.channel.type === "TextChannel"}>
        <ServerMemberSidebar
          channel={props.channel}
          scrollTargetElement={props.scrollTargetElement}
        />
      </Match>
      <Match when={props.channel.type === "DirectMessage"}>
        <DirectMessageSidebar
          channel={props.channel}
          scrollTargetElement={props.scrollTargetElement}
        />
      </Match>
    </Switch>
  );
}

/**
 * Servers to not fetch all members for
 */
const LARGE_SERVERS = [
  "01F7ZSBSFHQ8TA81725KQCSDDP",
  "01G3PKD1YJ2H484MDX6KP9WRBN",
  // top servers on discover
  "01K313D0VP0HPNG30DNZ4Q672H",
  "01J31CCMTYKFPGCM13VRP3B289",
  "01H2Y4Y97PW6584PHN1TAVN5WR",
  "01HVKQBBQ3DQVVNK3M8DHXV30D",
  "01GDS83RMZW89AV0BZG24NEXYC",
  "01J5W0XERBBGK77BMDVPZJ20JW",
];

/**
 * Server Member Sidebar
 */
export function ServerMemberSidebar(props: Props) {
// ... rest of the file ...
  const client = useClient();

  // todo: useQuery
  createEffect(
    on(
      () => props.channel.serverId,
      (serverId) =>
        props.channel.server?.syncMembers(
          LARGE_SERVERS.includes(serverId) ? true : false,
          200,
        ),
    ),
  );

  // Stage 1: Find roles and members
  const stage1 = createMemo(() => {
    const hoistedRoles = props.channel.server!.orderedRoles.filter(
      (role) => role.hoist,
    );

    const members = client().serverMembers.filter(
      (member) => member.id.server === props.channel.serverId,
    );

    return [members, hoistedRoles] as const;
  });

  // Stage 2: Filter members by permissions (if necessary)
  const stage2 = createMemo(() => {
    const [members] = stage1();
    if (props.channel.potentiallyRestrictedChannel) {
      return members.filter((member) =>
        member.hasPermission(props.channel, "ViewChannel"),
      );
    } else {
      return members;
    }
  });

  // Stage 3: Categorise each member entry into role lists
  const stage3 = createMemo(() => {
    const [, hoistedRoles] = stage1();
    const members = stage2();

    const byRole: Record<string, ServerMember[]> = { default: [], offline: [] };
    hoistedRoles.forEach((role) => (byRole[role.id] = []));

    for (const member of members) {
      if (!member.user?.online) {
        byRole["offline"].push(member);
        continue;
      }

      if (member.roles.length) {
        let assigned;
        for (const hoistedRole of hoistedRoles) {
          if (member.roles.includes(hoistedRole.id)) {
            byRole[hoistedRole.id].push(member);
            assigned = true;
            break;
          }
        }

        if (assigned) continue;
      }

      byRole["default"].push(member);
    }

    return [
      ...hoistedRoles.map((role) => ({
        role,
        members: byRole[role.id],
      })),
      {
        role: {
          id: "default",
          name: "Online",
        },
        members: byRole["default"],
      },
      {
        role: {
          id: "offline",
          name: "Offline",
        },
        members: byRole["offline"],
      },
    ].filter((entry) => entry.members.length);
  });

  // Stage 4: Perform sorting on role lists
  const roles = createMemo(() => {
    const roles = stage3();

    return roles.map((entry) => ({
      ...entry,
      members: [...entry.members].sort(
        (a, b) =>
          (a.nickname ?? a.user?.displayName)?.localeCompare(
            b.nickname ?? b.user?.displayName ?? "",
          ) || 0,
      ),
    }));
  });

  // Stage 5: Flatten into a single list with caching
  const objectCache = new Map();

  const elements = createMemo(() => {
    const elements: (
      | { t: 0; name: string; count: number }
      | { t: 1; member: ServerMember }
    )[] = [];

    // Create elements
    for (const role of roles()) {
      const roleElement = objectCache.get(role.role.name + role.members.length);
      if (roleElement) {
        elements.push(roleElement);
      } else {
        elements.push({
          t: 0,
          name: role.role.name,
          count: role.members.length,
        });
      }

      for (const member of role.members) {
        const memberElement = objectCache.get(member.id);
        if (memberElement) {
          elements.push(memberElement);
        } else {
          elements.push({
            t: 1,
            member,
          });
        }
      }
    }

    // Flush cache
    objectCache.clear();

    // Populate cache
    for (const element of elements) {
      if (element.t === 0) {
        objectCache.set(element.name + element.count, element);
      } else {
        objectCache.set(element.member.id, element);
      }
    }

    return elements;
  });

  const onlineMembers = createMemo(
    () =>
      client().serverMembers.filter(
        (member) =>
          (member.id.server === props.channel.serverId &&
            member.user?.online) ||
          false,
      ).length,
  );

  return (
    <Container>
      <Show when={!LARGE_SERVERS.includes(props.channel.serverId)}>
        <MemberTitle bottomMargin="yes">
          <Row align>
            <UserStatus size="0.7em" status="Online" />
            {onlineMembers()} members online
          </Row>
        </MemberTitle>
      </Show>

      <Deferred>
        <VirtualContainer
          items={elements()}
          scrollTarget={props.scrollTargetElement}
          itemSize={{ height: 42 }}
        >
          {(item) => (
            <div
              style={{
                ...item.style,
                width: "100%",
              }}
            >
              <Switch
                fallback={
                  <CategoryTitle>
                    {(item.item as { name: string }).name} {"–"}{" "}
                    {(item.item as { count: number }).count}
                  </CategoryTitle>
                }
              >
                <Match when={item.item.t === 1}>
                  <Member
                    member={(item.item as { member: ServerMember }).member}
                  />
                </Match>
              </Switch>
            </div>
          )}
        </VirtualContainer>
      </Deferred>
    </Container>
  );
}

/**
 * Group Member Sidebar
 */
export function GroupMemberSidebar(props: Props) {
  return (
    <Container>
      <MemberTitle>
        <Row align>{props.channel.recipientIds.size} members</Row>
      </MemberTitle>

      <Deferred>
        <VirtualContainer
          items={props.channel.recipients.toSorted((a, b) =>
            a.displayName.localeCompare(b.displayName),
          )}
          scrollTarget={props.scrollTargetElement}
          itemSize={{ height: 42 }}
        >
          {(item) => (
            <div
              style={{
                ...item.style,
                width: "100%",
              }}
            >
              <Member user={item.item} />
            </div>
          )}
        </VirtualContainer>
      </Deferred>
    </Container>
  );
}

/**
 * Direct Message Sidebar
 */
export function DirectMessageSidebar(props: Props) {
  const { openModal } = useModals();
  const client = useClient();
  const state = useState();
  const { t } = useLingui();

  const recipient = () => props.channel.recipient;

  const query = useQuery(() => ({
    queryKey: ["profile", recipient()?.id],
    queryFn: () => recipient()?.fetchProfile(),
    enabled: !!recipient(),
  }));

  return (
    <Container>
      <Show when={recipient()}>
        <ProfileWrapper>
          <Profile.Banner
            width={3}
            user={recipient()!}
            bannerUrl={query.data?.animatedBannerURL}
            onClick={
              query.data?.banner
                ? () =>
                    openModal({ type: "image_viewer", file: query.data!.banner! })
                : undefined
            }
            onClickAvatar={(e) => {
              e.stopPropagation();

              if (recipient()!.avatar) {
                openModal({ type: "image_viewer", file: recipient()!.avatar });
              }
            }}
          />

          <ActionsWrapper>
            <Tooltip content={t`Profile`} placement="top">
              <IconButton
                onPress={() =>
                  openModal({ type: "user_profile", user: recipient()! })
                }
              >
                <MdAccountCircle />
              </IconButton>
            </Tooltip>
            <Show when={recipient()?.relationship === "Friend"}>
              <Tooltip content={t`Remove Friend`} placement="top">
                <IconButton onPress={() => recipient()?.removeFriend()}>
                  <MdPersonRemove />
                </IconButton>
              </Tooltip>
            </Show>
            <Tooltip content={t`Block User`} placement="top">
              <IconButton onPress={() => recipient()?.blockUser()}>
                <MdBlock />
              </IconButton>
            </Tooltip>
            <Tooltip content={t`Report User`} placement="top">
              <IconButton
                onPress={() =>
                  openModal({
                    type: "report_content",
                    target: recipient()!,
                    client: client(),
                  })
                }
              >
                <MdReport />
              </IconButton>
            </Tooltip>
            <Show when={state.settings.getValue("advanced:copy_id")}>
              <Tooltip content={t`Copy User ID`} placement="top">
                <IconButton
                  onPress={() =>
                    navigator.clipboard.writeText(recipient()!.id)
                  }
                >
                  <MdBadge />
                </IconButton>
              </Tooltip>
            </Show>
          </ActionsWrapper>

          <ProfileContent>
            <Profile.Status user={recipient()!} />
            <Profile.Badges user={recipient()!} />
            <Profile.Bio content={query.data?.content} full />
            <Profile.Joined user={recipient()!} />
            <Profile.Mutuals user={recipient()!} />
          </ProfileContent>
        </ProfileWrapper>
      </Show>
    </Container>
  );
}

/**
 * Integrated wrapper for the entire profile
 */
const ProfileWrapper = styled("div", {
  base: {
    background: "var(--md-sys-color-surface-container-low)",
    borderRadius: "var(--borderRadius-xl)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    margin: "var(--gap-md)",
    marginRight: 0,
  },
});

/**
 * Wrapper for profile actions to center them
 */
const ActionsWrapper = styled("div", {
  base: {
    display: "flex",
    justifyContent: "center",
    padding: "var(--gap-md)",
    background: "var(--md-sys-color-surface-container)",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    "& > *": {
      justifyContent: "center !important",
    },
  },
});

/**
 * Simplified content section for profile details
 */
const ProfileContent = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    padding: "var(--gap-md)",
    gap: "var(--gap-md)",

    // Aggressive overrides for ProfileCard to make it look like simple list items
    "& [class*='ProfileCard']": {
      background: "transparent !important",
      padding: "0 !important",
      borderRadius: "0 !important",
      alignItems: "center !important",
      textAlign: "center !important",
      gap: "var(--gap-xs) !important",
      height: "auto !important",
      minHeight: "0 !important",
    },

    // Style the titles (Joined, Mutuals, etc.)
    "& [class*='ProfileCard'] [class*='title']": {
      fontSize: "0.65rem !important",
      textTransform: "uppercase",
      opacity: 0.5,
      fontWeight: "800",
      letterSpacing: "0.05em",
    },

    // Separators between sections
    "& > *:not(:last-child)": {
      borderBottom: "1px solid var(--md-sys-color-outline-variant)",
      paddingBottom: "var(--gap-md) !important",
    },

    // Bio special handling (Left aligned content but centered title)
    "& [class*='Bio']": {
      textAlign: "left !important",
      alignItems: "flex-start !important",
    },
    "& [class*='Bio'] [class*='title']": {
      alignSelf: "center",
    },

    // Mutuals icons alignment
    "& [class*='Mutuals'] div[class*='grid']": {
      justifyContent: "center !important",
    },
  },
});

/**
 * Container styles
 */
const Container = styled("div", {
  base: {
    paddingRight: "var(--gap-md)",
    width: "var(--layout-width-channel-sidebar)",
  },
});

/**
 * Category Title
 */
const CategoryTitle = styled("div", {
  base: {
    padding: "28px 14px 0",
    color: "var(--md-sys-color-on-surface)",

    ...typography.raw({ class: "label", size: "small" }),
  },
});

/**
 * Member title
 */
const MemberTitle = styled("div", {
  base: {
    marginTop: "12px",
    marginLeft: "14px",
    color: "var(--md-sys-color-on-surface)",

    ...typography.raw({ class: "label", size: "small" }),
  },
  variants: {
    bottomMargin: {
      no: {},
      yes: {
        marginBottom: "-12px",
      },
    },
  },
});

/**
 * Styles required to correctly display name and status
 */
const NameStatusStack = styled("div", {
  base: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
});

/**
 * Member
 */
function Member(props: { user?: User; member?: ServerMember }) {
  const { t } = useLingui();

  /**
   * Create user information
   */
  const user = () =>
    userInformation((props.user ?? props.member?.user)!, props.member);

  /**
   * Get user status
   */
  const status = () =>
    (props.user ?? props.member?.user)?.statusMessage((s) =>
      s === "Online"
        ? t`Online`
        : s === "Busy"
          ? t`Busy`
          : s === "Focus"
            ? t`Focus`
            : s === "Idle"
              ? t`Idle`
              : t`Offline`,
    );

  return (
    <div
      use:floating={floatingUserMenus(
        (props.user ?? props.member?.user)!,
        props.member,
      )}
    >
      <MenuButton
        size="normal"
        attention={
          (props.user ?? props.member?.user)?.online ? "active" : "muted"
        }
        icon={
          <Avatar
            src={user().avatar}
            size={32}
            holepunch="bottom-right"
            overlay={
              <UserStatus.Graphic
                status={(props.user ?? props.member?.user)?.presence}
              />
            }
          />
        }
      >
        <NameStatusStack>
          <OverflowingText>
            <Username username={user().username} colour={user().colour!} />
          </OverflowingText>
          <Show when={status()}>
            <Tooltip
              content={() => <TextWithEmoji content={status()!} />}
              placement="top-start"
              aria={status()!}
            >
              <OverflowingText class={typography({ class: "_status" })}>
                <TextWithEmoji content={status()!} />
              </OverflowingText>
            </Tooltip>
          </Show>
        </NameStatusStack>
      </MenuButton>
    </div>
  );
}
