import { Trans } from "@lingui-solid/solid/macro";
import { useNavigate } from "@solidjs/router";
import { type JSX, Match, Show, Switch } from "solid-js";
import type { Channel, Message, ServerMember, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";
import { dismissFloatingElements, Slider, Text } from "@revolt/ui";

import MdAccountCircle from "@material-design-icons/svg/outlined/account_circle.svg?component-solid";
import MdAddCircleOutline from "@material-design-icons/svg/outlined/add_circle_outline.svg?component-solid";
import MdAdminPanelSettings from "@material-design-icons/svg/outlined/admin_panel_settings.svg?component-solid";
import MdAlternateEmail from "@material-design-icons/svg/outlined/alternate_email.svg?component-solid";
import MdAssignmentInd from "@material-design-icons/svg/outlined/assignment_ind.svg?component-solid";
import MdBadge from "@material-design-icons/svg/outlined/badge.svg?component-solid";
import MdBlock from "@material-design-icons/svg/outlined/block.svg?component-solid";
import MdCancel from "@material-design-icons/svg/outlined/cancel.svg?component-solid";
import MdChat from "@material-design-icons/svg/outlined/chat.svg?component-solid";
import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";
import MdDoNotDisturbOn from "@material-design-icons/svg/outlined/do_not_disturb_on.svg?component-solid";
import MdFace from "@material-design-icons/svg/outlined/face.svg?component-solid";
import MdMicOff from "@material-design-icons/svg/outlined/mic_off.svg?component-solid";
import MdPersonAddAlt from "@material-design-icons/svg/outlined/person_add_alt.svg?component-solid";
import MdPersonRemove from "@material-design-icons/svg/outlined/person_remove.svg?component-solid";
import MdReport from "@material-design-icons/svg/outlined/report.svg?component-solid";
import MdChecked from "@material-symbols/svg-400/outlined/check_box.svg?component-solid";
import MdUnchecked from "@material-symbols/svg-400/outlined/check_box_outline_blank.svg?component-solid";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";
import { NotificationContextMenu } from "./shared/NotificationContextMenu";

/**
 * Context menu for users
 */
export function UserContextMenu(props: {
  user: User;
  channel?: Channel;
  member?: ServerMember;
  contextMessage?: Message;
  inVoice?: boolean;
  isScreenshare?: boolean;
}) {
  // TODO: if we take serverId instead, we could dynamically fetch server member here
  // same for the floating menu I guess?
  const state = useState();
  const client = useClient();
  const navigate = useNavigate();
  const { openModal, modals } = useModals();

  // server context
  const params = useSmartParams();

  /**
   * Open direct message channel
   */
  function openDm() {
    props.user.openDM().then((channel) => navigate(channel.url));
  }

  /**
   * Delete channel
   */
  function closeDm() {
    openModal({
      type: "delete_channel",
      channel: props.channel!,
    });
  }

  /**
   * Whether the user's profile modal is already open
   */
  function isProfileOpen() {
    return !!modals.find(
      (m) =>
        m.props.type === "user_profile" &&
        m.props.user.id === props.user.id &&
        m.show,
    );
  }

  /**
   * Open user profile
   */
  function openProfile() {
    if (isProfileOpen()) return;

    openModal({
      type: "user_profile",
      user: props.user,
    });

    dismissFloatingElements();
  }

  /**
   * Mention the user
   */
  function mention() {
    if (!state.draft._setNodeReplacement) return;
    state.draft._setNodeReplacement([props.user.toString()]);
  }

  /**
   * Edit server identity for user
   */
  function editIdentity() {
    openModal({
      type: "server_identity",
      member: props.member!,
    });
  }

  /**
   * Report the user
   */
  function reportUser() {
    openModal({
      type: "report_content",
      target: props.user!,
      client: client(),
      contextMessage: props.contextMessage,
    });
  }

  /**
   * Edit this user's roles
   */
  function editRoles() {
    openModal({
      type: "user_profile_roles",
      member: props.member!,
    });
  }

  /**
   * Kick the member
   */
  function kickMember() {
    openModal({
      type: "kick_member",
      member: props.member!,
    });
  }

  /**
   * Ban the member
   */
  function banMember() {
    openModal({
      type: "ban_member",
      member: props.member!,
    });
  }

  /**
   * Ban the user
   */
  function banUser() {
    openModal({
      type: "ban_non_member",
      user: props.user!,
      server: client().servers.get(params().serverId!)!,
    });
  }

  /**
   * Add friend
   */
  function addFriend() {
    props.user.addFriend();
  }

  /**
   * Remove friend
   */
  function removeFriend() {
    props.user.removeFriend();
  }

  /**
   * Block user
   */
  function blockUser() {
    props.user.blockUser();
  }

  /**
   * Unblock user
   */
  function unblockUser() {
    props.user.unblockUser();
  }

  /**
   * Open user in Stoat Admin Panel
   */
  function openAdminPanel() {
    window.open(
      `https://old-admin.stoatinternal.com/panel/inspect/user/${props.user.id}`,
      "_blank",
    );
  }

  /**
   * Copy user id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.user.id);
  }

  /**
   * Remove user from group
   */
  function removeMember() {
    openModal({
      type: "remove_member",
      user: props.user,
      group: props.channel!,
    });
  }

  /**
   * Whether the user can edit identity on this server
   */
  function canEditIdentity() {
    return (
      props.member &&
      (props.user.self
        ? props.member!.server!.havePermission("ChangeNickname") ||
          props.member!.server!.havePermission("ChangeAvatar")
        : (props.member!.server!.havePermission("ManageNicknames") ||
            props.member!.server!.havePermission("RemoveAvatars")) &&
          props.member!.inferiorTo(props.member!.server!.member!))
    );
  }

  /**
   * Whether the user can edit roles for this member
   */
  function canEditRoles() {
    return (
      props.member &&
      (props.member?.server?.owner?.self ||
        (props.member?.server?.havePermission("AssignRoles") &&
          props.member.inferiorTo(props.member.server.member!)))
    );
  }

  /**
   * Whether the user can kick this member
   */
  function canKick() {
    return (
      !props.user.self &&
      props.member?.server?.havePermission("KickMembers") &&
      props.member.inferiorTo(props.member.server.member!)
    );
  }

  /**
   * Whether the user can ban this member
   */
  function canBan() {
    return (
      !props.user.self &&
      props.member?.server?.havePermission("BanMembers") &&
      props.member.inferiorTo(props.member.server.member!)
    );
  }

  /**
   * Whether the user can ban a non-member in the current server
   */
  function canBanNonMember() {
    return (
      !props.user.self &&
      props.member?.server?.havePermission("BanMembers") &&
      params().serverId &&
      !props.member
    );
  }

  /**
   * Whether the user can remove a member from the current group
   */
  function canRemoveMemberFromGroup() {
    return (
      props.channel?.type === "Group" &&
      !props.user.self &&
      props.channel.owner?.id !== props.user.id &&
      (props.channel.havePermission("ManageChannel") ||
        props.channel.owner?.self)
    );
  }

  return (
    <ContextMenu class="UserContextMenu">
      {/* Voice controls */}
      <Show when={props.inVoice && !props.user.self && !props.isScreenshare}>
        <ContextMenuButton
          onMouseDown={(e) => e.stopImmediatePropagation()}
          onClick={(e) => e.stopImmediatePropagation()}
        >
          <Text class="label">
            <Trans>Volume</Trans>
          </Text>
          <Slider
            min={0}
            max={3}
            step={0.1}
            value={state.voice.getUserVolume(props.user.id)}
            onInput={(event) =>
              state.voice.setUserVolume(
                props.user.id,
                event.currentTarget.value,
              )
            }
            labelFormatter={(label) => (label * 100).toFixed(0) + "%"}
          />
        </ContextMenuButton>
        <ContextMenuButton
          icon={MdMicOff}
          onClick={() =>
            state.voice.setUserMuted(
              props.user.id,
              !state.voice.getUserMuted(props.user.id),
            )
          }
          actionSymbol={
            state.voice.getUserMuted(props.user.id) ? MdChecked : MdUnchecked
          }
        >
          <Trans>Mute</Trans>
        </ContextMenuButton>
        <ContextMenuDivider />
      </Show>
      <Show when={props.isScreenshare && !props.user.self}>
        <ContextMenuButton
          onMouseDown={(e) => e.stopImmediatePropagation()}
          onClick={(e) => e.stopImmediatePropagation()}
        >
          <Text class="label">
            <Trans>Screen Share Volume</Trans>
          </Text>
          <Slider
            min={0}
            max={3}
            step={0.1}
            value={state.voice.getScreenShareVolume(props.user.id)}
            onInput={(event) =>
              state.voice.setScreenShareVolume(
                props.user.id,
                event.currentTarget.value,
              )
            }
            labelFormatter={(label) => (label * 100).toFixed(0) + "%"}
          />
        </ContextMenuButton>
        <ContextMenuButton
          icon={MdMicOff}
          onClick={() =>
            state.voice.setScreenShareMuted(
              props.user.id,
              !state.voice.getScreenShareMuted(props.user.id),
            )
          }
          actionSymbol={
            state.voice.getScreenShareMuted(props.user.id)
              ? MdChecked
              : MdUnchecked
          }
        >
          <Trans>Mute Screen Share</Trans>
        </ContextMenuButton>

        <ContextMenuDivider />
      </Show>

      {/* Quick actions: Profile, Message, Mention */}
      <ContextMenuButton icon={MdAccountCircle} onClick={openProfile}>
        <Trans>Profile</Trans>
      </ContextMenuButton>
      <Show when={props.user.relationship === "Friend"}>
        <ContextMenuButton icon={MdChat} onClick={openDm}>
          <Trans>Message</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.channel?.type === "TextChannel"}>
        <ContextMenuButton icon={MdAlternateEmail} onClick={mention}>
          <Trans>Mention</Trans>
        </ContextMenuButton>
      </Show>

      {/* DM-specific section */}
      <Show when={props.channel?.type === "DirectMessage"}>
        <ContextMenuDivider />
        <ContextMenuButton icon={MdClose} onClick={closeDm} destructive>
          <Trans>Close chat</Trans>
        </ContextMenuButton>
        <NotificationContextMenu channel={props.channel!} />
      </Show>

      {/* Server identity and roles */}
      <Show when={canEditIdentity() || canEditRoles()}>
        <ContextMenuDivider />
        <Show when={canEditIdentity()}>
          <ContextMenuButton icon={MdFace} onClick={editIdentity}>
            <Switch fallback={<Trans>Edit identity</Trans>}>
              <Match when={props.user.self}>
                <Trans>Edit your identity</Trans>
              </Match>
            </Switch>
          </ContextMenuButton>
        </Show>
        <Show when={canEditRoles()}>
          <ContextMenuButton icon={MdAssignmentInd} onClick={editRoles}>
            <Trans>Edit roles</Trans>
          </ContextMenuButton>
        </Show>
      </Show>

      {/* Social: friend requests */}
      <Show
        when={
          !props.user.self &&
          (props.user.relationship === "None" ||
            props.user.relationship === "Incoming" ||
            props.user.relationship === "Outgoing")
        }
      >
        <ContextMenuDivider />
        <Show when={props.user.relationship === "None" && !props.user.bot}>
          <ContextMenuButton icon={MdPersonAddAlt} onClick={addFriend}>
            <Trans>Add friend</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Incoming"}>
          <ContextMenuButton icon={MdPersonAddAlt} onClick={addFriend}>
            <Trans>Accept friend request</Trans>
          </ContextMenuButton>
          <ContextMenuButton icon={MdCancel} onClick={removeFriend} destructive>
            <Trans>Reject friend request</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Outgoing"}>
          <ContextMenuButton icon={MdCancel} onClick={removeFriend} destructive>
            <Trans>Cancel friend request</Trans>
          </ContextMenuButton>
        </Show>
      </Show>

      {/* Moderation: kick, ban */}
      {/** TODO: #287 timeout users */}
      <Show
        when={
          canRemoveMemberFromGroup() ||
          (props.member && (canKick() || canBan()))
        }
      >
        <ContextMenuDivider />
        <Show when={canRemoveMemberFromGroup()}>
          <ContextMenuButton
            icon={MdPersonRemove}
            onClick={removeMember}
            destructive
          >
            <Trans>Remove Member</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={canKick()}>
          <ContextMenuButton
            icon={MdPersonRemove}
            onClick={kickMember}
            destructive
          >
            <Trans>Kick member</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={canBan()}>
          <ContextMenuButton
            icon={MdDoNotDisturbOn}
            onClick={banMember}
            destructive
          >
            <Trans>Ban member</Trans>
          </ContextMenuButton>
        </Show>
      </Show>
      <Show when={canBanNonMember()}>
        <ContextMenuDivider />
        <ContextMenuButton
          icon={MdDoNotDisturbOn}
          onClick={banUser}
          destructive
        >
          <Trans>Ban user</Trans>
        </ContextMenuButton>
      </Show>

      {/* Safety: remove friend, block, report */}
      <Show when={!props.user.self}>
        <ContextMenuDivider />
        <Show when={props.user.relationship === "Friend"}>
          <ContextMenuButton
            icon={MdPersonRemove}
            onClick={removeFriend}
            destructive
          >
            <Trans>Remove friend</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship !== "Blocked"}>
          <ContextMenuButton icon={MdBlock} onClick={blockUser} destructive>
            <Trans>Block user</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.user.relationship === "Blocked"}>
          <ContextMenuButton icon={MdAddCircleOutline} onClick={unblockUser}>
            <Trans>Unblock user</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuButton icon={MdReport} onClick={reportUser} destructive>
          <Trans>Report user</Trans>
        </ContextMenuButton>
      </Show>

      {/* Developer tools */}
      <Show
        when={
          state.settings.getValue("advanced:admin_panel") ||
          state.settings.getValue("advanced:copy_id")
        }
      >
        <ContextMenuDivider />
      </Show>
      <Show when={state.settings.getValue("advanced:admin_panel")}>
        <ContextMenuButton icon={MdAdminPanelSettings} onClick={openAdminPanel}>
          <Trans>Admin Panel</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton icon={MdBadge} onClick={copyId}>
          <Trans>Copy user ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}

/**
 * Provide floating user menus on this element
 * @param user User
 * @param member Server Member
 * @param contextMessage Message
 * @param contextGroup Group
 */
export function floatingUserMenus(
  user: User,
  member?: ServerMember,
  contextMessage?: Message,
  contextGroup?: Channel,
): JSX.Directives["floating"] & object {
  return {
    userCard: {
      user,
      member,
      // we could use message to display masquerade info in user card
    },
    /**
     * Build user context menu
     */
    contextMenu() {
      return (
        <UserContextMenu
          user={user}
          member={member}
          contextMessage={contextMessage}
          channel={contextMessage?.channel ?? contextGroup}
        />
      );
    },
  };
}

export function floatingUserMenusFromMessage(message: Message) {
  return message.author
    ? floatingUserMenus(message.author!, message.member, message)
    : {}; // TODO: webhook menu
}
