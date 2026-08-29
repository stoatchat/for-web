import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { Server } from "stoat.js";

import { useModals } from "@revolt/modal";

import MdGrid3x3 from "@material-design-icons/svg/outlined/grid_3x3.svg?component-solid";
import MdHeadsetMic from "@material-design-icons/svg/outlined/headset_mic.svg?component-solid";
import MdLibraryAdd from "@material-design-icons/svg/outlined/library_add.svg?component-solid";

import { ContextMenu, ContextMenuButton } from "./ContextMenu";

/**
 * Context menu for server sidebar
 */
export function ServerSidebarContextMenu(props: { server: Server }) {
  const { openModal } = useModals();

  /**
   * Create a new channel
   */
  function createChannel(channelType: "Text" | "Voice") {
    openModal({
      type: "create_channel",
      channelType,
      server: props.server!,
    });
  }

  /**
   * Create a new category
   */
  function createCategory() {
    openModal({
      type: "create_category",
      server: props.server!,
    });
  }

  return (
    <ContextMenu>
      <Show when={props.server?.havePermission("ManageChannel")}>
        <ContextMenuButton
          icon={MdGrid3x3}
          onClick={() => createChannel("Text")}
        >
          <Trans>Create channel</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={MdHeadsetMic}
          onClick={() => createChannel("Voice")}
        >
          <Trans>Create voice channel</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={MdLibraryAdd} onClick={createCategory}>
          <Trans>Create category</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}
