import { JSX, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import {
  CallStartedSystemMessage,
  ChannelEditSystemMessage,
  ChannelOwnershipChangeSystemMessage,
  ChannelRenamedSystemMessage,
  MessagePinnedSystemMessage,
  SystemMessage as SystemMessageClass,
  TextSystemMessage,
  User,
  UserModeratedSystemMessage,
  UserSystemMessage,
} from "stoat.js";
import { styled } from "styled-system/jsx";

import { useTime } from "@revolt/i18n";
import { useInstance } from "@revolt/instance";
import { time } from "@revolt/markdown/elements";
import { RenderAnchor } from "@revolt/markdown/plugins/anchors";
import { UserMention } from "@revolt/markdown/plugins/mentions";
import { useSmartParams } from "@revolt/routing";
import { formatTime, Time } from "@revolt/ui/components/utils";

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
  const instance = useInstance();
  const params = useSmartParams();
  const dayjs = useTime();

  // Break the lazy load chain. This is required to allow deletion of a
  // message. Having reactivity with this value will result in undefined errors
  // specifically in the delete message modal. Losing reactivity here is fine
  // and expected, the markdown renderer also loses reactivity when rendering
  // messages.
  // eslint-disable-next-line solid/reactivity
  const sm = props.systemMessage;

  return (
    <Base>
      <Switch fallback={sm.type}>
        <Match when={sm.type === "user_added"}>
          <Trans>
            <UserMention userId={(sm as UserModeratedSystemMessage).userId} />{" "}
            has been added by{" "}
            <UserMention userId={(sm as UserModeratedSystemMessage).byId} />
          </Trans>
        </Match>
        <Match when={sm.type === "user_left" && !props.isServer}>
          <Trans>
            <UserMention userId={(sm as UserSystemMessage).userId} /> left the
            group
          </Trans>
        </Match>
        <Match when={sm.type === "user_remove"}>
          <Trans>
            <UserMention userId={(sm as UserModeratedSystemMessage).userId} />{" "}
            has been removed by{" "}
            <UserMention userId={(sm as UserModeratedSystemMessage).byId} />
          </Trans>
        </Match>
        <Match when={sm.type === "user_kicked"}>
          <Trans>
            <UserMention userId={(sm as UserSystemMessage).userId} /> has been
            kicked from the server
          </Trans>
        </Match>
        <Match when={sm.type === "user_banned"}>
          <Trans>
            <UserMention userId={(sm as UserSystemMessage).userId} /> has been
            banned from the server
          </Trans>
        </Match>
        <Match when={sm.type === "user_joined"}>
          <Trans>
            <UserMention userId={(sm as UserSystemMessage).userId} /> joined the
            server
          </Trans>
        </Match>
        <Match when={sm.type === "user_left" && props.isServer}>
          <Trans>
            <UserMention userId={(sm as UserSystemMessage).userId} /> left the
            server
          </Trans>
        </Match>
        <Match when={sm.type === "channel_renamed"}>
          <Trans>
            <UserMention userId={(sm as ChannelRenamedSystemMessage).byId} />{" "}
            updated the group name to{" "}
            <strong>{(sm as ChannelRenamedSystemMessage).name}</strong>
          </Trans>
        </Match>
        <Match when={sm.type === "channel_description_changed"}>
          <Trans>
            <UserMention userId={(sm as ChannelEditSystemMessage).byId} />{" "}
            updated the group description
          </Trans>
        </Match>
        <Match when={sm.type === "channel_icon_changed"}>
          <Trans>
            <UserMention userId={(sm as ChannelEditSystemMessage).byId} />{" "}
            updated the group icon{" "}
          </Trans>
        </Match>
        <Match when={sm.type === "channel_ownership_changed"}>
          <Trans>
            <UserMention
              userId={(sm as ChannelOwnershipChangeSystemMessage).fromId}
            />{" "}
            transferred group ownership to{" "}
            <UserMention
              userId={(sm as ChannelOwnershipChangeSystemMessage).toId}
            />
          </Trans>
        </Match>
        <Match when={sm.type === "message_pinned"}>
          <Trans>
            <UserMention userId={(sm as MessagePinnedSystemMessage).byId} />{" "}
            pinned{" "}
            <RenderAnchor
              href={instance.href(
                (params().serverId ? `/server/${params().serverId}` : "") +
                  `/channel/${params().channelId}/${(sm as MessagePinnedSystemMessage).messageId}`,
              )}
            />
          </Trans>
        </Match>
        <Match when={sm.type === "message_unpinned"}>
          <Trans>
            <UserMention userId={(sm as MessagePinnedSystemMessage).byId} />{" "}
            unpinned{" "}
            <RenderAnchor
              href={instance.href(
                (params().serverId ? `/server/${params().serverId}` : "") +
                  `/channel/${params().channelId}/${(sm as MessagePinnedSystemMessage).messageId}`,
              )}
            />
          </Trans>
        </Match>
        <Match when={sm.type === "call_started"}>
          <Show
            when={(sm as CallStartedSystemMessage).finishedAt != null}
            fallback={
              <Trans>
                <UserMention userId={(sm as CallStartedSystemMessage).byId} />{" "}
                started a call
              </Trans>
            }
          >
            <Trans>
              <UserMention userId={(sm as CallStartedSystemMessage).byId} />{" "}
              started a call that lasted{" "}
            </Trans>
            <span
              class={time()}
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: () => (
                    <Time
                      format="datetime"
                      value={(sm as CallStartedSystemMessage).finishedAt}
                    />
                  ),
                  aria: formatTime(dayjs, {
                    format: "datetime",
                    value: (sm as CallStartedSystemMessage).finishedAt,
                  }) as string,
                },
              }}
            >
              <Time
                value={(sm as CallStartedSystemMessage).finishedAt}
                referenceTime={(sm as CallStartedSystemMessage).startedAt}
                hideSuffix={true}
                format="relative"
              />
            </span>
          </Show>
        </Match>
        <Match when={sm.type === "text"}>
          {(sm as TextSystemMessage).content}
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
