import { Trans } from "@lingui/solid/macro";

import { useModals } from "@revolt/modal";
import { ServerFolder, useState } from "@revolt/state";

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
export function ServerFolderContextMenu(props: { folder: ServerFolder }) {
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

  return (
    <ContextMenu>
      <ContextMenuButton icon={MdDriveFileRenameOutline} onClick={rename}>
        <Trans>Rename folder</Trans>
      </ContextMenuButton>
      <ContextMenuDivider />
      <ContextMenuButton icon={MdDelete} destructive onClick={remove}>
        <Trans>Delete folder</Trans>
      </ContextMenuButton>
    </ContextMenu>
  );
}
