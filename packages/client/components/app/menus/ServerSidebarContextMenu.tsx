import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { Server } from "stoat.js";

import { useModals } from "@revolt/modal";

import { Symbol } from "@revolt/ui";
import { ContextMenu, ContextMenuButton } from "./ContextMenu";

/**
 * Context menu for server sidebar
 */
export function ServerSidebarContextMenu(props: { server: Server }) {
  const { openModal } = useModals();

  /**
   * Create a new channel
   */
  function createChannel() {
    openModal({
      type: "create_channel",
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
    </ContextMenu>
  );
}
