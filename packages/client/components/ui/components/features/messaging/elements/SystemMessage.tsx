import { JSX, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import {
  ChannelEditSystemMessage,
  ChannelOwnershipChangeSystemMessage,
  ChannelRenamedSystemMessage,
  MessagePinnedSystemMessage,
  CallStartedSystemMessage,
  SystemMessage as SystemMessageClass,
  TextSystemMessage,
  User,
  UserModeratedSystemMessage,
  UserSystemMessage,
} from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { RenderAnchor } from "@revolt/markdown/plugins/anchors";
import { UserMention } from "@revolt/markdown/plugins/mentions";
import { useSmartParams } from "@revolt/routing";
import { formatTime, Time } from "@revolt/ui/components/utils";
import { Tooltip } from "@revolt/ui/components/floating";
import { useTime } from "@revolt/i18n";
import { time } from "@revolt/markdown/elements";

interface Props {
  /**
   * System Message
   */
  systemMessage: SystemMessageClass;

  /**
   * Menu generator
   */
  menuGenerator: (user?: User) => JSX.Directives["floating"];

  /**
   * Whether this is rendered within a server
   */
  isServer: boolean;
}

/**
 * System Message
 */
export function SystemMessage(props: Props) {
  const params = useSmartParams();
  const dayjs = useTime();

  return (
    <Base>
      <Switch fallback={props.systemMessage.type}>
        <Match when={props.systemMessage.type === "user_added"}>
          <Trans>
            <UserMention
              userId={
                (props.systemMessage as UserModeratedSystemMessage).userId
              }
            />{" "}
            has been added by{" "}
            <UserMention
              userId={(props.systemMessage as UserModeratedSystemMessage).byId}
            />
          </Trans>
        </Match>
        <Match
          when={props.systemMessage.type === "user_left" && !props.isServer}
        >
          <Trans>
            <UserMention
              userId={(props.systemMessage as UserSystemMessage).userId}
            />{" "}
            left the group
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "user_remove"}>
          <Trans>
            <UserMention
              userId={
                (props.systemMessage as UserModeratedSystemMessage).userId
              }
            />{" "}
            has been removed by{" "}
            <UserMention
              userId={(props.systemMessage as UserModeratedSystemMessage).byId}
            />
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "user_kicked"}>
          <Trans>
            <UserMention
              userId={(props.systemMessage as UserSystemMessage).userId}
            />{" "}
            has been kicked from the server
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "user_banned"}>
          <Trans>
            <UserMention
              userId={(props.systemMessage as UserSystemMessage).userId}
            />{" "}
            has been banned from the server
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "user_joined"}>
          <Trans>
            <UserMention
              userId={(props.systemMessage as UserSystemMessage).userId}
            />{" "}
            joined the server
          </Trans>
        </Match>
        <Match
          when={props.systemMessage.type === "user_left" && props.isServer}
        >
          <Trans>
            <UserMention
              userId={(props.systemMessage as UserSystemMessage).userId}
            />{" "}
            left the server
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "channel_renamed"}>
          <Trans>
            <UserMention
              userId={(props.systemMessage as ChannelRenamedSystemMessage).byId}
            />{" "}
            updated the group name to{" "}
            <strong>
              {(props.systemMessage as ChannelRenamedSystemMessage).name}
            </strong>
          </Trans>
        </Match>
        <Match
          when={props.systemMessage.type === "channel_description_changed"}
        >
          <Trans>
            <UserMention
              userId={(props.systemMessage as ChannelEditSystemMessage).byId}
            />{" "}
            updated the group description
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "channel_icon_changed"}>
          <Trans>
            <UserMention
              userId={(props.systemMessage as ChannelEditSystemMessage).byId}
            />{" "}
            updated the group icon{" "}
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "channel_ownership_changed"}>
          <Trans>
            <UserMention
              userId={
                (props.systemMessage as ChannelOwnershipChangeSystemMessage)
                  .fromId
              }
            />{" "}
            transferred group ownership to{" "}
            <UserMention
              userId={
                (props.systemMessage as ChannelOwnershipChangeSystemMessage)
                  .toId
              }
            />
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "message_pinned"}>
          <Trans>
            <UserMention
              userId={(props.systemMessage as MessagePinnedSystemMessage).byId}
            />{" "}
            pinned{" "}
            <RenderAnchor
              href={
                location.origin +
                (params().serverId ? `/server/${params().serverId}` : "") +
                `/channel/${params().channelId}/${(props.systemMessage as MessagePinnedSystemMessage).messageId}`
              }
            />
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "message_unpinned"}>
          <Trans>
            <UserMention
              userId={(props.systemMessage as MessagePinnedSystemMessage).byId}
            />{" "}
            unpinned{" "}
            <RenderAnchor
              href={
                location.origin +
                (params().serverId ? `/server/${params().serverId}` : "") +
                `/channel/${params().channelId}/${(props.systemMessage as MessagePinnedSystemMessage).messageId}`
              }
            />
          </Trans>
        </Match>
        <Match when={props.systemMessage.type === "call_started"}>
          <Show when={(props.systemMessage as CallStartedSystemMessage).finishedAt != null} fallback={
            <Trans>
              <UserMention
                userId={(props.systemMessage as CallStartedSystemMessage).byId}
              />{" "}
              started a call
            </Trans>
          }>
            <Trans>
              <UserMention
                userId={(props.systemMessage as CallStartedSystemMessage).byId}
              />{" "}
              started a call that lasted{" "}
            </Trans>
            <span class={time()} use:floating={{ tooltip: {
              placement: "top",
              content: () => <Time format="datetime" value={(props.systemMessage as CallStartedSystemMessage).finishedAt} />,
              aria:
                formatTime(dayjs, {
                  format: "datetime",
                  value: (props.systemMessage as CallStartedSystemMessage).finishedAt,
                }) as string
              }
            }}>
              <Time
                value={(props.systemMessage as CallStartedSystemMessage).finishedAt}
                referenceTime={(props.systemMessage as CallStartedSystemMessage).startedAt}
                hideSuffix={ true }
                format="relative"
              />
            </span>
          </Show>
        </Match>
        <Match when={props.systemMessage.type === "text"}>
          {(props.systemMessage as TextSystemMessage).content}
        </Match>
      </Switch>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    minHeight: "20px",
    alignItems: "center",
  },
});
