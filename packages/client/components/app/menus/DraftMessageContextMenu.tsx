import { Trans } from "@lingui-solid/solid/macro";
import { Show } from "solid-js";
import type { Channel } from "stoat.js";

import { useClient } from "@revolt/client";
import { useState } from "@revolt/state";
import type { UnsentMessage } from "@revolt/state/stores/Draft";

import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";
import MdContentCopy from "@material-design-icons/svg/outlined/content_copy.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdRefresh from "@material-design-icons/svg/outlined/refresh.svg?component-solid";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "./ContextMenu";

interface Props {
  draft: UnsentMessage;
  channel: Channel;
}

/**
 * Context menu for draft messages
 */
export function DraftMessageContextMenu(props: Props) {
  const state = useState();
  const client = useClient();

  /**
   * Retry sending the draft message
   */
  function retrySend() {
    state.draft.retrySend(client(), props.channel, props.draft.idempotencyKey);
  }

  /**
   * Copy draft message text to clipboard
   */
  function copyText() {
    if (props.draft.content) {
      navigator.clipboard.writeText(props.draft.content);
    }
  }

  /**
   * Delete the draft message
   */
  function deleteMessage() {
    state.draft.cancelSend(props.channel, props.draft.idempotencyKey);
  }

  return (
    <Show when={props.draft.status !== "sending"}>
      <ContextMenu>
        <Show when={false}>
          <ContextMenuButton icon={MdClose} onClick={deleteMessage} destructive>
            <Trans>Cancel message</Trans>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.draft.status === "failed" || props.draft.status === "unsent"
          }
        >
          <ContextMenuButton icon={MdRefresh} onClick={retrySend}>
            <Trans>Retry sending</Trans>
          </ContextMenuButton>
          <Show when={props.draft.content}>
            <ContextMenuButton icon={MdContentCopy} onClick={copyText}>
              <Trans>Copy text</Trans>
            </ContextMenuButton>
          </Show>
          <ContextMenuDivider />
          <ContextMenuButton
            icon={MdDelete}
            onClick={deleteMessage}
            destructive
          >
            <Trans>Delete message</Trans>
          </ContextMenuButton>
        </Show>
      </ContextMenu>
    </Show>
  );
}
