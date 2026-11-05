import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { Channel } from "stoat.js";

import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui";
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
  const instance = useInstance();
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

  function getCategory(channel: Channel) {
    const cats = channel.server!.orderedChannels;
    let cat, ch;
    for (cat of cats)
      for (ch of cat.channels) if (ch.id === channel.id) return cat.id;
  }

  /**
   * Create a new channel
   */
  function createChannel() {
    openModal({
      type: "create_channel",
      server: props.channel.server!,
      categoryId: getCategory(props.channel),
    });
  }

  /**
   * Create a new category
   */
  function createCategory() {
    openModal({
      type: "create_category",
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
      `https://admin.stoatinternal.com/panel/inspect/channel/${props.channel.id}`,
      "_blank",
    );
  }

  /**
   * Copy channel link to clipboard
   */
  function copyLink() {
    navigator.clipboard.writeText(
      instance.href(
        `${
          props.channel.server ? `/server/${props.channel.server?.id}` : ""
        }/channel/${props.channel.id}`,
      ),
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
          props.channel.unread ||
          !!props.channel.mentions?.size ||
          props.channel.havePermission("InviteOthers")
        }
      >
        <Show when={props.channel.unread || !!props.channel.mentions?.size}>
          <ContextMenuButton
            icon={<Symbol size={16}>mark_chat_read</Symbol>}
            onClick={markAsRead}
          >
            <Trans>Mark as read</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={props.channel.havePermission("InviteOthers")}>
          <ContextMenuButton
            icon={<Symbol size={16}>group_add</Symbol>}
            onClick={createInvite}
          >
            <Trans>Create invite</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuDivider />
      </Show>

      <NotificationContextMenu channel={props.channel} />

      <ContextMenuDivider />

      <Show when={props.channel.server?.havePermission("ManageChannel")}>
        <ContextMenuButton
          icon={<Symbol size={16}>library_add</Symbol>}
          onClick={createChannel}
        >
          <Trans>Create channel</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={<Symbol size={16}>library_add</Symbol>}
          onClick={createCategory}
        >
          <Trans>Create category</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={props.channel.havePermission("ManageChannel")}>
        <ContextMenuButton
          icon={<Symbol size={16}>settings</Symbol>}
          onClick={editChannel}
        >
          <Trans>Open channel settings</Trans>
        </ContextMenuButton>
        <Show when={props.channel.type !== "Group"}>
          <ContextMenuButton
            icon={<Symbol size={16}>delete</Symbol>}
            onClick={deleteChannel}
            destructive
          >
            <Trans>Delete channel</Trans>
          </ContextMenuButton>
        </Show>{" "}
      </Show>
      <Show when={props.channel.type === "Group"}>
        <ContextMenuButton
          icon={<Symbol size={16}>logout</Symbol>}
          onClick={deleteChannel}
          destructive
        >
          <Trans>Leave group</Trans>
        </ContextMenuButton>
      </Show>

      <Show
        when={
          props.channel.server?.havePermission("ManageChannel") ||
          props.channel.havePermission("ManageChannel") ||
          props.channel.type === "Group"
        }
      >
        <ContextMenuDivider />
      </Show>

      <Show when={state.settings.getValue("advanced:admin_panel")}>
        <ContextMenuButton
          icon={<Symbol size={16}>shield</Symbol>}
          onClick={openAdminPanel}
        >
          <Trans>Admin Panel</Trans>
        </ContextMenuButton>
      </Show>
      <ContextMenuButton
        icon={<Symbol size={16}>share</Symbol>}
        onClick={copyLink}
      >
        <Trans>Copy link</Trans>
      </ContextMenuButton>
      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton
          icon={<Symbol size={16}>badge</Symbol>}
          onClick={copyId}
        >
          <Trans>Copy channel ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}
