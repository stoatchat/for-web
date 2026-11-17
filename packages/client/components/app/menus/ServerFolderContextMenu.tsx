import { Trans } from "@lingui/solid/macro";
import { Show } from "solid-js";
import { Server } from "stoat.js";

import { useModals } from "@revolt/modal";
import { ServerFolder, useState } from "@revolt/state";
import { Symbol } from "@revolt/ui";

import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdDriveFileRenameOutline from "@material-design-icons/svg/outlined/drive_file_rename_outline.svg?component-solid";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";

/**
 * Context menu for server folders
 */
export function ServerFolderContextMenu(props: {
  folder: ServerFolder;
  servers: Server[];
}) {
  const state = useState();
  const { openModal } = useModals();

  /**
   * Rename the folder
   */
  function rename() {
    openModal({
      type: "edit_server_folder",
      folder: props.folder,
    });
  }

  /**
   * Remove the folder, keeping its servers
   */
  function remove() {
    state.ordering.deleteFolder(props.folder.id);
  }

  function hasUnread() {
    return props.servers.some((server) => server.unread);
  }

  function markAsRead() {
    props.servers
      .filter((server) => server.unread)
      .forEach((server) => server.ack());
  }

  return (
    <ContextMenu>
      <Show when={hasUnread()}>
        <ContextMenuButton
          symbol={<Symbol>mark_chat_read</Symbol>}
          onClick={markAsRead}
        >
          <Trans>Mark folder as read</Trans>
        </ContextMenuButton>
        <ContextMenuDivider />
      </Show>
      <ContextMenuButton icon={MdDriveFileRenameOutline} onClick={rename}>
        <Trans>Edit folder</Trans>
      </ContextMenuButton>
      <ContextMenuDivider />
      <ContextMenuButton icon={MdDelete} destructive onClick={remove}>
        <Trans>Delete folder</Trans>
      </ContextMenuButton>
    </ContextMenu>
  );
}
