import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import type { API } from "stoat.js";
import { Channel, Server } from "stoat.js";

import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";

export type CategoryData = Omit<API.Category, "channels"> & {
  channels: Channel[];
};

/**
 * Context menu for categories
 */
export function CategoryContextMenu(props: {
  server: Server;
  category: CategoryData;
}) {
  const state = useState();
  const { openModal } = useModals();

  /**
   * Mark category as read
   */
  function markAsRead() {
    props.category.channels
      .filter((channel) => channel.unread || channel.mentions?.size)
      .forEach((channel) => channel.ack());
  }

  /**
   * Create a new channel
   */
  function createChannel() {
    openModal({
      type: "create_channel",
      server: props.server,
      categoryId: props.category.id,
    });
  }

  /**
   * Create a new category
   */
  function createCategory() {
    openModal({
      type: "create_category",
      server: props.server,
    });
  }

  /**
   * Delete category
   */
  function deleteCategory() {
    openModal({
      type: "delete_category",
      server: props.server,
      categoryId: props.category.id,
    });
  }

  function editCategoryName() {
    openModal({
      type: "edit_category",
      server: props.server,
      category: props.category,
    });
  }

  /**
   * Copy category id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.category.id);
  }

  /**
   * Determine if any channel in category has unread messages or pending mentions
   */
  const hasUnread = () => {
    return props.category.channels.some(
      (channel) => channel?.unread || channel?.mentions?.size,
    );
  };

  return (
    <ContextMenu>
      <Show when={hasUnread()}>
        <ContextMenuButton
          icon={<Symbol size={16}>mark_chat_read</Symbol>}
          onClick={markAsRead}
        >
          <Trans>Mark as read</Trans>
        </ContextMenuButton>
        <ContextMenuDivider />
      </Show>

      <Show when={props.server.havePermission("ManageChannel")}>
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
        <ContextMenuButton
          icon={<Symbol size={16}>edit</Symbol>}
          onClick={editCategoryName}
        >
          <Trans>Rename category</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={<Symbol size={16}>delete</Symbol>}
          onClick={deleteCategory}
          destructive
        >
          <Trans>Delete category</Trans>
        </ContextMenuButton>
      </Show>

      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuDivider />
      </Show>

      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton
          icon={<Symbol size={16}>badge</Symbol>}
          onClick={copyId}
        >
          <Trans>Copy category ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}
