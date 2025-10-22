import { For } from "solid-js";

import { Channel } from "stoat.js";

import { useState } from "@revolt/state";

import { DraftMessage } from "./DraftMessage";

interface Props {
  channel: Channel;
  tail: boolean;
  sentIds: string[];
}

/**
 *
 * @param props
 * @returns
 */
export function DraftMessages(props: Props) {
  const state = useState();

  const unsent = () =>
    state.draft
      .getPendingMessages(props.channel.id)
      .filter((draft) => draft.status === "sending")
      .filter((draft) => !props.sentIds.includes(draft.idempotencyKey));

  const failed = () =>
    state.draft
      .getPendingMessages(props.channel.id)
      .filter((draft) => draft.status !== "sending");

  return (
    <>
      <For each={unsent()}>
        {(draft, index) => (
          <DraftMessage
            draft={draft}
            channel={props.channel}
            tail={index() !== 0 || props.tail}
          />
        )}
      </For>
      <For each={failed()}>
        {(draft) => <DraftMessage draft={draft} channel={props.channel} />}
      </For>
    </>
  );
}
