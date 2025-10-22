import { For, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import type { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient, useUser } from "@revolt/client";
import { Markdown } from "@revolt/markdown";
import { userInformation } from "@revolt/markdown/users";
import { useState } from "@revolt/state";
import type { UnsentMessage } from "@revolt/state/stores/Draft";
import {
  Avatar,
  MessageContainer,
  MessageReply,
  SizedContent,
  Text,
  Username,
} from "@revolt/ui";

import { DraftMessageContextMenu } from "../../../menus/DraftMessageContextMenu";

interface Props {
  draft: UnsentMessage;
  channel: Channel;
  tail?: boolean;
}

/**
 * Unsent message preview
 */
export function DraftMessage(props: Props) {
  const user = useUser();
  const state = useState();
  const client = useClient();
  const userInfo = () => userInformation(user(), props.channel.server?.member);

  return (
    <MessageContainer
      tail={
        props.tail && (!props.draft.replies || props.draft.replies.length === 0)
      }
      avatar={<Avatar src={userInfo().avatar} size={36} />}
      timestamp={
        props.draft.status === "sending" ? (
          <Trans>Sending...</Trans>
        ) : props.draft.status === "failed" ? (
          <Trans>Failed to send</Trans>
        ) : (
          <Trans>Unsent message</Trans>
        )
      }
      sendStatus={props.draft.status === "sending" ? "sending" : "failed"}
      username={<Username username={userInfo().username} />}
      header={
        <For each={props.draft.replies}>
          {(reply) => (
            <MessageReply
              message={client().messages.get(reply.id)}
              mention={reply.mention}
            />
          )}
        </For>
      }
      contextMenu={() => (
        <DraftMessageContextMenu draft={props.draft} channel={props.channel} />
      )}
      compact={state.settings.getValue("appearance:compact_mode")}
    >
      <BreakText>
        <Markdown content={props.draft.content!} />
      </BreakText>
      <For each={props.draft.files}>
        {(id) => {
          const file = state.draft.getFile(id);

          return (
            <>
              <Text class="label">
                Uploading file `{file.file.name}`...{" "}
                {(file.uploadProgress[0]() * 100).toFixed()}%
              </Text>
              <Switch>
                <Match when={file.dimensions}>
                  <SizedContent
                    width={file.dimensions![0]}
                    height={file.dimensions![1]}
                  >
                    <img src={file.dataUri} />
                  </SizedContent>
                </Match>
              </Switch>
            </>
          );
        }}
      </For>
    </MessageContainer>
  );
}

/**
 * Break all text and prevent overflow from math blocks
 */
const BreakText = styled("div", {
  base: {
    wordBreak: "break-word",

    "& .math": {
      overflowX: "auto",
      overflowY: "hidden",
      maxHeight: "100vh",
    },
  },
});
