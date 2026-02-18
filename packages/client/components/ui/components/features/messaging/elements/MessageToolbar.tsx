import { Show } from "solid-js";

import { Message } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { MessageContextMenu } from "@revolt/app";
import { useUser } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Ripple } from "@revolt/ui/components/design";
import { iconSize } from "@revolt/ui/components/utils";

import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdEdit from "@material-design-icons/svg/outlined/edit.svg?component-solid";
import MdEmojiEmotions from "@material-design-icons/svg/outlined/emoji_emotions.svg?component-solid";
import MdMoreVert from "@material-design-icons/svg/outlined/more_vert.svg?component-solid";
import MdReply from "@material-design-icons/svg/outlined/reply.svg?component-solid";

import { startsWithPackPUA } from "@revolt/markdown/emoji/UnicodeEmoji";
import { CompositionMediaPicker } from "../composition";

export function MessageToolbar(props: { message?: Message }) {
  const user = useUser();
  const state = useState();
  const { openModal } = useModals();

  // todo: a11y for buttons; tabindex

  /**
   * Delete the message
   */
  function deleteMessage(ev: MouseEvent) {
    if (ev.shiftKey) {
      props.message?.delete();
    } else if (props.message) {
      openModal({
        type: "delete_message",
        message: props.message,
      });
    }
  }

  return (
    <Base class="Toolbar">
      <Show when={props.message?.channel?.havePermission("SendMessage")}>
        <div
          class={tool()}
          onClick={() => state.draft.addReply(props.message!, user()!.id)}
        >
          <Ripple />
          <MdReply {...iconSize(20)} />
        </div>
      </Show>
      <Show when={props.message?.channel?.havePermission("React")}>
        <CompositionMediaPicker
          onMessage={(content) =>
            props.message?.channel?.sendMessage({
              content,
              replies: [{ id: props.message.id, mention: true }],
            })
          }
          onTextReplacement={(emoji) =>
            props.message!.react(
              emoji.startsWith(":")
                ? emoji.slice(1, emoji.length - 1)
                : startsWithPackPUA(emoji)
                  ? emoji.slice(1)
                  : emoji,
            )
          }
        >
          {(triggerProps) => (
            <div
              ref={triggerProps.ref}
              class={tool()}
              onClick={triggerProps.onClickEmoji}
            >
              <Ripple />
              <MdEmojiEmotions {...iconSize(20)} />
            </div>
          )}
        </CompositionMediaPicker>
      </Show>
      <Show when={props.message?.author?.self}>
        <div
          class={tool()}
          onClick={() => state.draft.setEditingMessage(props.message)}
        >
          <Ripple />
          <MdEdit {...iconSize(20)} />
        </div>
      </Show>
      <Show
        when={
          props.message?.author?.self ||
          props.message?.channel?.havePermission("ManageMessages")
        }
      >
        <div class={tool()} onClick={deleteMessage}>
          <Ripple />
          <MdDelete {...iconSize(20)} />
        </div>
      </Show>
      <div
        class={tool()}
        use:floating={{
          contextMenu: () => <MessageContextMenu message={props.message!} />,
          contextMenuHandler: "click",
        }}
      >
        <Ripple />
        <MdMoreVert {...iconSize(20)} />
      </div>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    top: "-18px",
    right: "16px",
    position: "absolute",

    alignItems: "center",

    display: "none",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-xs)",
    boxShadow: "0 0 3px var(--md-sys-color-shadow)",

    fill: "var(--md-sys-color-on-secondary-container)",
    background: "var(--md-sys-color-secondary-container)",
  },
});

const tool = cva({
  base: {
    cursor: "pointer",
    position: "relative",
    padding: "var(--gap-sm)",
  },
});
