import { Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";

import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";

import MdBadge from "@material-design-icons/svg/outlined/badge.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdGroupAdd from "@material-design-icons/svg/outlined/group_add.svg?component-solid";
import MdLibraryAdd from "@material-design-icons/svg/outlined/library_add.svg?component-solid";
import MdLogout from "@material-design-icons/svg/outlined/logout.svg?component-solid";
import MdMarkChatRead from "@material-design-icons/svg/outlined/mark_chat_read.svg?component-solid";
import MdSettings from "@material-design-icons/svg/outlined/settings.svg?component-solid";
import MdShare from "@material-design-icons/svg/outlined/share.svg?component-solid";
import MdShield from "@material-design-icons/svg/outlined/shield.svg?component-solid";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";
import { NotificationContextMenu } from "./shared/NotificationContextMenu";

/**
 * Context menu for channels
 */
export function ChannelContextMenu(props: { channel: Channel }) {
  const state = useState();
  const { openModal } = useModals();

  /**
   * Mark channel as read
   */
  function markAsRead() {
    props.channel.ack();
  }

  /**
   * Create a new invite
   */
  function createInvite() {
    openModal({
      type: "create_invite",
      channel: props.channel,
    });
  }

  /**
   * Create a new channel
   */
  function createChannel() {
    openModal({
      type: "create_channel",
      server: props.channel.server!,
    });
  }

  /**
   * Edit channel
   */
  function editChannel() {
    openModal({
      type: "settings",
      config: "channel",
      context: props.channel,
    });
  }

  /**
   * Delete channel
   */
  function deleteChannel() {
    openModal({
      type: "delete_channel",
      channel: props.channel,
    });
  }

  /**
   * Open channel in Stoat Admin Panel
   */
  function openAdminPanel() {
    window.open(
      `https://legacy-admin.stoatinternal.com/panel/inspect/channel/${props.channel.id}`,
      "_blank",
    );
  }

  /**
   * Copy channel link to clipboard
   */
  function copyLink() {
    navigator.clipboard.writeText(
      `${location.origin}${
        props.channel.server ? `/server/${props.channel.server?.id}` : ""
      }/channel/${props.channel.id}`,
    );
  }

  /**
   * Copy channel id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.channel.id);
  }

  return (
    <ContextMenu>
      <Show
        when={
          props.channel.unread || props.channel.havePermission("InviteOthers")
        }
      >
        <Show when={props.channel.unread}>
          <ContextMenuButton icon={MdMarkChatRead} onClick={markAsRead}>
            <Trans>Mark as read</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.channel.havePermission("InviteOthers")}>
          <ContextMenuButton icon={MdGroupAdd} onClick={createInvite}>
            <Trans>Create invite</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuDivider />
      </Show>

      <NotificationContextMenu channel={props.channel} />

      <ContextMenuDivider />

      <Show when={props.channel.server?.havePermission("ManageChannel")}>
        <ContextMenuButton icon={MdLibraryAdd} onClick={createChannel}>
          <Trans>Create channel</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.channel.havePermission("ManageChannel")}>
        <ContextMenuButton icon={MdSettings} onClick={editChannel}>
          <Trans>Open channel settings</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={props.channel.type === "Group" ? MdLogout : MdDelete}
          onClick={deleteChannel}
          destructive
        >
          <Switch fallback={<Trans>Delete channel</Trans>}>
            <Match when={props.channel.type === "Group"}>
              <Trans>Leave group</Trans>
            </Match>
          </Switch>
        </ContextMenuButton>
      </Show>

      <Show
        when={
          props.channel.server?.havePermission("ManageChannel") ||
          props.channel.havePermission("ManageChannel")
        }
      >
        <ContextMenuDivider />
      </Show>

      <Show when={state.settings.getValue("advanced:admin_panel")}>
        <ContextMenuButton icon={MdShield} onClick={openAdminPanel}>
          <Trans>Admin Panel</Trans>
        </ContextMenuButton>
      </Show>
      <ContextMenuButton icon={MdShare} onClick={copyLink}>
        <Trans>Copy link</Trans>
      </ContextMenuButton>
      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton icon={MdBadge} onClick={copyId}>
          <Trans>Copy channel ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}
