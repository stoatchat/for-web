import { createMemo, Match, Show, Switch } from "solid-js";

import { useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { Channel, ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { floatingUserMenus } from "@revolt/app/menus/UserContextMenu";
import { useClient } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { userInformation } from "@revolt/markdown/users";
import {
  Avatar,
  Deferred,
  MenuButton,
  OverflowingText,
  Row,
  Tooltip,
  typography,
  Username,
  UserStatus,
} from "@revolt/ui";

interface Props {
  /**
   * Channel
   */
  channel: Channel;

  /**
   * Scroll target element
   */
  scrollTargetElement: HTMLDivElement;

  /**
   * Whether the server is very large and should not display all member information
   */
  isLargeServer?: boolean;
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
          isLargeServer={props.isLargeServer}
        />
      </Match>
    </Switch>
  );
}

/**
 * Server Member Sidebar
 */
export function ServerMemberSidebar(props: Props) {
  const client = useClient();

  type MemberRoleElement =
    | { t: 0; name: string; count: number; icon?: string | null }
    | { t: 1; member: ServerMember; icon?: never; isOnline: boolean };

  const elements = createMemo(() => {
    const hoistedRoles = props.channel.server!.orderedRoles.filter(
      (role) => role.hoist,
    );

    const restricted = props.channel.potentiallyRestrictedChannel;
    const byRole: Map<string, { member: ServerMember; displayName: string }[]> =
      new Map();
    byRole.set("default", []);
    byRole.set("offline", []);
    hoistedRoles.forEach((role) => byRole.set(role.id, []));

    for (const member of client().serverMembers.values()) {
      if (member.id.server !== props.channel.serverId) {
        continue;
      }
      // If the channel is restricted, check for permission
      if (restricted && !member.hasPermission(props.channel, "ViewChannel")) {
        continue;
      }

      // Only hit the store once to reduce watchers.
      // If you need to access anything on the member in a loop define a const here.
      const memberRoles = member.roles;
      const memberName = member.nickname ?? member.user?.displayName ?? "";

      if (!member.user?.online) {
        byRole.get("offline")!.push({
          member,
          displayName: memberName,
        });
        continue;
      }

      if (memberRoles.length) {
        let assigned;
        for (const hoistedRole of hoistedRoles) {
          if (memberRoles.includes(hoistedRole.id)) {
            byRole.get(hoistedRole.id)!.push({
              member,
              displayName: memberName,
            });
            assigned = true;
            break;
          }
        }

        if (assigned) continue;
      }

      byRole.get("default")!.push({
        member,
        displayName: memberName,
      });
    }

    const roles: { id: string; name: string; icon?: string }[] = [];

    const elements: MemberRoleElement[] = [];

    for (const role of hoistedRoles) {
      roles.push({
        id: role.id,
        name: role.name,
        icon: role.icon?.previewUrl,
      });
    }
    roles.push({ id: "default", name: "Online" });
    roles.push({ id: "offline", name: "Offline" });

    for (const role of roles) {
      const roleMembers = byRole
        .get(role.id)!
        .sort((a, b) => a.displayName?.localeCompare(b.displayName) || 0);

      if (!roleMembers?.length) {
        continue;
      }

      elements.push({
        t: 0,
        name: role.name,
        icon: role.icon,
        count: roleMembers.length,
      });

      for (const member of roleMembers) {
        elements.push({
          t: 1,
          member: member.member,
          isOnline: role.id !== "offline",
        });
      }
    }

    return elements;
  });

  const onlineMembers = createMemo(
    () => elements().filter((ele) => ele.t === 1 && ele.isOnline).length,
  );

  return (
    <Container>
      <Show when={!props.isLargeServer}>
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
                    <Show when={item.item.icon}>
                      <RoleIcon src={item.item.icon!} alt="" />
                    </Show>
                    <span>{(item.item as { name: string }).name}</span>
                    <span>
                      {" – "}
                      {(item.item as { count: number }).count}
                    </span>
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
              <Member user={item.item} group={props.channel} />
            </div>
          )}
        </VirtualContainer>
      </Deferred>
    </Container>
  );
}

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
    display: "flex",
    alignItems: "center",
    gap: "6px",

    ...typography.raw({ class: "label", size: "small" }),
  },
});

const RoleIcon = styled("img", {
  base: {
    width: "16px",
    height: "16px",
    borderRadius: "var(--borderRadius-sm)",
    objectFit: "cover",
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
function Member(props: {
  user?: User;
  member?: ServerMember;
  group?: Channel;
}) {
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
        (props.user ?? props.member?.user)?.bot,
        undefined,
        props.group,
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
