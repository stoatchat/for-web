import { Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { File } from "revolt.js";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";

/**
 * Context menu for files
 */
export function FileContextMenu(props: { file: File }) {
  /**
   * Opens the file preview in a new tab
   */
  function OpenFile() {
    window.open(props.file.previewUrl, "_blank");
  }

  /**
   * Copies the link to the original url of the file
   */
  function CopyLink() {
    navigator.clipboard.writeText(props.file.originalUrl);
  }

  /**
   * Download the file in original quality, the original file link automatically starts a download
   */
  function SaveFile() {
    window.open(props.file.originalUrl, "_blank");
  }

  return (
    <ContextMenu>
      <ContextMenuButton onClick={OpenFile}>
        <Trans>Open file</Trans>
      </ContextMenuButton>
      <ContextMenuButton onClick={CopyLink}>
        <Trans>Copy link</Trans>
      </ContextMenuButton>
      <ContextMenuButton onClick={SaveFile}>
        <Trans>Save file</Trans>
      </ContextMenuButton>
    </ContextMenu>
  );
}
