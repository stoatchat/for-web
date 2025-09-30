import { Component, Match, Show, Switch, createMemo } from "solid-js";

import { Channel } from "revolt.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { Navigate, useParams } from "@revolt/routing";
import { Demo } from "@revolt/rtc/Demo";
import { useState } from "@revolt/state";
import { Header, Text } from "@revolt/ui";

import { AgeGate } from "./AgeGate";
import { ChannelHeader } from "./ChannelHeader";
import { TextChannel } from "./text/TextChannel";

/**
 * Channel layout
 */
const Base = styled("div", {
  base: {
    minWidth: 0,
    flexGrow: 1,
    display: "flex",
    position: "relative",
    flexDirection: "column",
  },
});

export interface ChannelPageProps {
  channel: Channel;
}

const TEXT_CHANNEL_TYPES: Channel["type"][] = [
  "TextChannel",
  "DirectMessage",
  "Group",
  "SavedMessages",
];

/**
 * Channel component
 */
export const ChannelPage: Component = () => {
  const state = useState();
  const params = useParams();
  const client = useClient();
  const channel = createMemo(() => client()!.channels.get(params.channel)!);

  return (
    <Base>
      <AgeGate
        enabled={channel().mature}
        contentId={channel().id}
        contentName={"#" + channel().name}
        contentType="channel"
      >
        <Switch fallback="Unknown channel type!">
          <Match when={!channel()}>
            <Navigate href={"../.."} />
          </Match>
          <Match when={TEXT_CHANNEL_TYPES.includes(channel()!.type)}>
            <TextChannel channel={channel()} />
          </Match>
          <Match when={channel()!.type === "VoiceChannel"}>
            <Header placement="primary">
              <ChannelHeader channel={channel()} />
            </Header>
            <Show
              when={state.experiments.isEnabled("voice_chat")}
              fallback={
                <Text>
                  We are working on bringing you a new voice experience shortly.{" "}
                  <br /> Sorry for the inconvenience.
                </Text>
              }
            >
              <Demo />
            </Show>
          </Match>
        </Switch>
      </AgeGate>
    </Base>
  );
};
