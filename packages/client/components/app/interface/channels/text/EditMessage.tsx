import { Match, Switch, createSignal } from "solid-js";

import { useMutation } from "@tanstack/solid-query";
import { Message } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { KeybindAction, createKeybind } from "@revolt/keybinds";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { CompositionMediaPicker, IconButton, Text } from "@revolt/ui";
import { TextEditor2 } from "@revolt/ui/components/features/texteditor/TextEditor2";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { useSearchSpace } from "@revolt/ui/components/utils/autoComplete";

export function EditMessage(props: { message: Message }) {
  const state = useState();
  const client = useClient();
  const { openModal, isOpen, pop } = useModals();

  const [nodeReplacement, setNodeReplacement] = createSignal<
    readonly [string | "_focus"] | undefined
  >();

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
      if (content === props.message.content) {
        return;
      }

      change.mutate(content);
    } else if (isOpen("delete_message")) {
      void props.message.delete();
      pop();
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

  const searchSpace = useSearchSpace(() => props.message, client);

  return (
    <>
      <EditorBox class={css({ flexGrow: 1 })}>
        <TextEditor2
          autoFocus
          onComplete={saveMessage}
          onChange={state.draft.setEditingMessageContent}
          initialValue={initialValue}
          nodeReplacement={nodeReplacement()}
          autoCompleteSearchSpace={searchSpace}
        />

        <CompositionMediaPicker
          onMessage={() => {
            // noop
          }}
          onTextReplacement={(text) => setNodeReplacement([text])}
        >
          {(triggerProps) => (
            <EditorActions>
              <IconButton onPress={triggerProps.onClickEmoji}>
                <Symbol>emoticon</Symbol>
              </IconButton>
              <div ref={triggerProps.ref} />
            </EditorActions>
          )}
        </CompositionMediaPicker>
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
    position: "relative",
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-on-surface-container)",
    borderRadius: "var(--borderRadius-sm)",
    padding: "var(--gap-md)",
    paddingInlineEnd: "calc(var(--gap-md) + 36px)",
  },
});

const EditorActions = styled("div", {
  base: {
    position: "absolute",
    top: "var(--gap-sm)",
    right: "var(--gap-sm)",
    display: "flex",
    alignItems: "center",
    zIndex: 2,
  },
});

const Action = styled("span", {
  base: {
    fontWeight: 600,
    cursor: "pointer",
    color: "var(--md-sys-color-primary)",
  },
});
