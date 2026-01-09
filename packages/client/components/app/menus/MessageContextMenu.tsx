import { For, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { File, Message } from "stoat.js";

import { useClient, useUser } from "@revolt/client";
import { CustomEmoji, UnicodeEmoji } from "@revolt/markdown/emoji";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";

import MdBadge from "@material-design-icons/svg/outlined/badge.svg?component-solid";
import MdContentCopy from "@material-design-icons/svg/outlined/content_copy.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdDeleteSweep from "@material-design-icons/svg/outlined/delete_sweep.svg?component-solid";
import MdDownload from "@material-design-icons/svg/outlined/download.svg?component-solid";
import MdEdit from "@material-design-icons/svg/outlined/edit.svg?component-solid";
import MdLink from "@material-design-icons/svg/outlined/link.svg?component-solid";
import MdMarkChatUnread from "@material-design-icons/svg/outlined/mark_chat_unread.svg?component-solid";
import MdOpenInNew from "@material-design-icons/svg/outlined/open_in_new.svg?component-solid";
import MdPin from "@material-design-icons/svg/outlined/pin_invoke.svg?component-solid";
import MdReply from "@material-design-icons/svg/outlined/reply.svg?component-solid";
import MdReport from "@material-design-icons/svg/outlined/report.svg?component-solid";
import MdShare from "@material-design-icons/svg/outlined/share.svg?component-solid";
import MdShield from "@material-design-icons/svg/outlined/shield.svg?component-solid";

import MdSentimentContent from "@material-symbols/svg-400/outlined/sentiment_content.svg?component-solid";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
  ContextMenuSubMenu,
} from "./ContextMenu";

/**
 * Context menu for messages
 */
export function MessageContextMenu(props: { message?: Message; file?: File }) {
  const user = useUser();
  const state = useState();
  const client = useClient();
  const { openModal, showError } = useModals();

  /**
   * Reply to this message
   */
  function reply() {
    state.draft.addReply(props.message!, user()!.id);
  }

  /**
   * Mark message as unread
   */
  function markAsUnread() {
    props.message!.ack(true, false, true);
  }

  /**
   * Copy message contents to clipboard
   */
  function copyText() {
    navigator.clipboard.writeText(props.message!.content);
  }

  /**
   * Report the message
   */
  function report() {
    openModal({
      type: "report_content",
      target: props.message!,
      client: client(),
    });
  }

  /**
   * Delete the message
   */
  function deleteMessage(ev: MouseEvent) {
    if (ev.shiftKey) {
      props.message!.delete();
    } else {
      openModal({
        type: "delete_message",
        message: props.message!,
      });
    }
  }

  /**
   * Open message in Stoat Admin Panel
   */
  function openAdminPanel() {
    window.open(
      `https://legacy-admin.stoatinternal.com/panel/inspect/message/${props.message!.id}`,
      "_blank",
    );
  }

  /**
   * Copy message link to clipboard
   */
  function copyLink() {
    navigator.clipboard.writeText(
      `${location.origin}${
        props.message!.server ? `/server/${props.message!.server?.id}` : ""
      }/channel/${props.message!.channelId}/${props.message!.id}`,
    );
  }

  /**
   * Copy message id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.message!.id);
  }

  /**
   * Opens the file preview in a new tab
   */
  function OpenFile() {
    window.open(props.file?.originalUrl, "_blank");
  }

  /**
   * Copies the link to the original url of the file
   */
  function CopyLink() {
    navigator.clipboard.writeText(props.file?.originalUrl ?? "");
  }

  return (
    <ContextMenu>
      <Show when={props.file}>
        <ContextMenuButton icon={MdOpenInNew} onClick={OpenFile}>
          <Trans>Open file</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={MdLink} onClick={CopyLink}>
          <Trans>Copy link</Trans>
        </ContextMenuButton>
        <a
          target="_blank"
          download={props.file?.filename}
          href={props.file?.originalUrl}
        >
          <ContextMenuButton icon={MdDownload}>
            <Trans>Save file</Trans>
          </ContextMenuButton>
        </a>

        <ContextMenuDivider />
      </Show>
      <Show when={props.message}>
        <Show when={props.message!.channel?.havePermission("SendMessage")}>
          <ContextMenuButton icon={MdReply} onClick={reply}>
            <Trans>Reply</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuButton icon={MdMarkChatUnread} onClick={markAsUnread}>
          <Trans>Mark as unread</Trans>
        </ContextMenuButton>
        <ContextMenuButton icon={MdContentCopy} onClick={copyText}>
          <Trans>Copy text</Trans>
        </ContextMenuButton>
        <ContextMenuDivider />
        <Show
          when={
            props.message!.author?.self &&
            props.message!.channel?.havePermission("SendMessage")
          }
        >
          <ContextMenuButton
            icon={MdEdit}
            onClick={() => state.draft.setEditingMessage(props.message!)}
          >
            <Trans>Edit message</Trans>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.message!.channel?.type === "DirectMessage" ||
            props.message!.channel?.havePermission("ManageMessages")
          }
        >
          <ContextMenuButton
            icon={MdPin}
            onClick={() => {
              if (props.message!.pinned) {
                props.message!.unpin().catch(showError);
              } else {
                props.message!.pin().catch(showError);
              }
            }}
          >
            <Switch fallback={<Trans>Pin message</Trans>}>
              <Match when={props.message!.pinned}>
                <Trans>Unpin message</Trans>
              </Match>
            </Switch>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.message!.reactions.size &&
            props.message!.channel?.havePermission("ManageMessages")
          }
        >
          <ContextMenuSubMenu
            icon={MdDeleteSweep}
            onClick={() => props.message!.clearReactions()}
            destructive
            buttonContent={<Trans>Remove reaction</Trans>}
          >
            <For each={[...props.message!.reactions.keys()]}>
              {(key) => (
                <ContextMenuButton
                  onClick={() => props.message!.unreact(key, true)}
                >
                  <Switch fallback={<UnicodeEmoji emoji={key} />}>
                    <Match when={key.length === 26}>
                      <CustomEmoji id={key} />
                    </Match>
                  </Switch>
                </ContextMenuButton>
              )}
            </For>
          </ContextMenuSubMenu>
        </Show>
        <Show when={props.message!.reactions.size}>
          <ContextMenuButton
            symbol={MdSentimentContent}
            onClick={() => props.message!.clearReactions()}
            destructive
          >
            <Trans>Remove all reactions</Trans>
          </ContextMenuButton>
        </Show>
        <Show
          when={
            props.message!.author?.self ||
            props.message!.channel?.havePermission("ManageMessages")
          }
        >
          <ContextMenuButton
            icon={MdDelete}
            onClick={deleteMessage}
            destructive
          >
            <Trans>Delete message</Trans>
          </ContextMenuButton>
        </Show>
        <Show when={!props.message!.author?.self}>
          <ContextMenuButton icon={MdReport} onClick={report} destructive>
            <Trans>Report message</Trans>
          </ContextMenuButton>
        </Show>
        <ContextMenuDivider />
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
            <Trans>Copy message ID</Trans>
          </ContextMenuButton>
        </Show>
      </Show>
    </ContextMenu>
  );
}
