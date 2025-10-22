import { Match, Switch } from "solid-js";

import { useMutation } from "@tanstack/solid-query";
import { Message } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Text, TextEditor } from "@revolt/ui";
import { generateSearchSpaceFrom } from "@revolt/ui/components/utils/autoComplete";

export function EditMessage(props: { message: Message }) {
  const state = useState();
  const client = useClient();
  const { openModal } = useModals();

  const initialValue = [state.draft.editingMessageContent || ""] as const;

  const change = useMutation(() => ({
    mutationFn: (content: string) => props.message.edit({ content }),
    onSuccess() {
      state.draft.setEditingMessage(undefined);
    },
    onError(error) {
      openModal({ type: "error2", error });
    },
  }));

  function saveMessage() {
    const content = state.draft.editingMessageContent;

    if (content?.length) {
      state.draft._setNodeReplacement?.(["_focus"]); // focus message box
      change.mutate(content);
    } else {
      openModal({
        type: "delete_message",
        message: props.message,
      });
    }
  }

  createKeybind(KeybindAction.CHAT_CANCEL_EDITING, () => {
    state.draft.setEditingMessage(undefined);
    state.draft._setNodeReplacement?.(["_focus"]); // focus message box
  });

  return (
    <>
      <EditorBox class={css({ flexGrow: 1 })}>
        <TextEditor
          autoFocus
          onComplete={saveMessage}
          onChange={state.draft.setEditingMessageContent}
          initialValue={initialValue}
          autoCompleteSearchSpace={generateSearchSpaceFrom(
            props.message,
            client(),
          )}
        />
      </EditorBox>

      <Switch
        fallback={
          <Text size="small">
            escape to{" "}
            <Action onClick={() => state.draft.setEditingMessage(undefined)}>
              cancel
            </Action>{" "}
            &middot; enter to <Action onClick={saveMessage}>save</Action>
          </Text>
        }
      >
        <Match when={change.isPending}>
          <Text size="small">Saving message...</Text>
        </Match>
      </Switch>
    </>
  );
}

const EditorBox = styled("div", {
  base: {
    background: "var(--md-sys-color-primary-container)",
    color: "var(--md-sys-color-on-primary-container)",
    borderRadius: "var(--borderRadius-sm)",
    padding: "var(--gap-md)",
  },
});

const Action = styled("span", {
  base: {
    fontWeight: 600,
    cursor: "pointer",
    color: "var(--md-sys-color-primary)",
  },
});
