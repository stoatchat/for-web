import { Show } from "solid-js";

import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { MessageContextMenu, useMessage } from "@revolt/app";
import { useUser } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Ripple } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils";

export function MessageToolbar() {
  const user = useUser();
  const state = useState();
  const { openModal } = useModals();
  const { message, reactPicker } = useMessage();

  let reactRef;

  // todo: a11y for buttons; tabindex

  /**
   * Delete the message
   */
  function deleteMessage(ev: MouseEvent) {
    if (ev.shiftKey) {
      message?.delete();
    } else if (message) {
      openModal({
        type: "delete_message",
        message: message,
      });
    }
  }

  return (
    <Base class="Toolbar">
      <Show when={message?.channel?.havePermission("SendMessage")}>
        <div
          class={tool()}
          onClick={() => state.draft.addReply(message!, user()!.id)}
        >
          <Ripple />
          <Symbol size={20}>reply</Symbol>
        </div>
      </Show>
      <Show when={message?.channel?.havePermission("React")}>
        <div
          ref={reactRef}
          class={tool()}
          onClick={(e) => reactPicker!()?.onClickEmoji(e, reactRef)}
        >
          <Ripple />
          <Symbol size={20}>mood</Symbol>
        </div>
      </Show>
      <Show when={message?.author?.self}>
        <div
          class={tool()}
          onClick={() => state.draft.setEditingMessage(message)}
        >
          <Ripple />
          <Symbol size={20}>edit</Symbol>
        </div>
      </Show>
      <Show
        when={
          message?.author?.self ||
          message?.channel?.havePermission("ManageMessages")
        }
      >
        <div class={tool()} onClick={deleteMessage}>
          <Ripple />
          <Symbol size={20}>delete</Symbol>
        </div>
      </Show>
      <div
        class={tool()}
        use:floating={{
          contextMenu: () => (
            <MessageContextMenu message={message!} reactPicker={reactPicker} />
          ),
          contextMenuHandler: "click",
        }}
      >
        <Ripple />
        <Symbol size={20}>more_vert</Symbol>
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
