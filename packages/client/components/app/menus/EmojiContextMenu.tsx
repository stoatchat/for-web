import { Trans } from "@lingui/solid/macro";
import { Show } from "solid-js";

import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui";

import { ContextMenu, ContextMenuButton } from "./ContextMenu";

export function EmojiContextMenu(props: { id: string }) {
  const { favourites } = useState();

  return (
    <ContextMenu
      // Prevent context menu closing the picker. This is here to reduce scope
      // of the change, if it's needed elsewhere it can be lifted into the
      // ContextMenu Base component.
      onmousedown={(e) => e.stopPropagation()}
    >
      <ContextMenuButton
        symbol={
          <Symbol fill={!favourites.emojis().includes(props.id)}>star</Symbol>
        }
        onClick={() => favourites.toggleEmoji(props.id)}
      >
        <Show
          when={favourites.emojis().includes(props.id)}
          fallback={<Trans>Favourite emoji</Trans>}
        >
          <Trans>Unfavourite emoji</Trans>
        </Show>
      </ContextMenuButton>
    </ContextMenu>
  );
}
