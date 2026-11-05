import { For, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import dayjs from "dayjs";
import { Channel } from "stoat.js";

import { useState } from "@revolt/state";
import { Column, Symbol, Text, Time } from "@revolt/ui";

import { ContextMenuButton, ContextMenuSubMenu } from "../ContextMenu";

export function NotificationContextMenu(props: { channel: Channel }) {
  const state = useState();

  return (
    <>
      <Show
        when={!state.notifications.isChannelMuted(props.channel)}
        fallback={
          <ContextMenuButton
            onClick={() =>
              state.notifications.setChannelMute(props.channel, undefined)
            }
            symbol={<Symbol size={16}>do_not_disturb_off</Symbol>}
            _titleCase={false}
          >
            <Column gap="none">
              <Trans>Unmute Channel</Trans>
              <Show
                when={state.notifications.getChannelMute(props.channel)?.until}
              >
                <Text class="label" size="small">
                  <Trans>
                    Muted until{" "}
                    <Time
                      format="datetime"
                      value={
                        state.notifications.getChannelMute(props.channel)!.until
                      }
                    />
                  </Trans>
                </Text>
              </Show>
            </Column>
          </ContextMenuButton>
        }
      >
        <ContextMenuSubMenu
          onClick={() => state.notifications.setChannelMute(props.channel, {})}
          buttonContent={<Trans>Mute Channel</Trans>}
          symbol={<Symbol size={16}>do_not_disturb_on</Symbol>}
        >
          <For
            each={
              [
                [15, <Trans>For 15 minutes</Trans>],
                [60, <Trans>For 1 hour</Trans>],
                [180, <Trans>For 3 hours</Trans>],
                [480, <Trans>For 8 hours</Trans>],
                [1440, <Trans>For 24 hours</Trans>],
                [undefined, <Trans>Until I turn it back on</Trans>],
              ] as const
            }
          >
            {([timeMin, i18n]) => (
              <ContextMenuButton
                onClick={() =>
                  state.notifications.setChannelMute(props.channel, {
                    until: timeMin
                      ? +dayjs().add(timeMin, "minutes")
                      : undefined,
                  })
                }
                _titleCase={false}
              >
                {i18n}
              </ContextMenuButton>
            )}
          </For>
        </ContextMenuSubMenu>
      </Show>

      <ContextMenuSubMenu
        symbol={<Symbol size={16}>notification_settings</Symbol>}
        buttonContent={<Trans>Notifications</Trans>}
      >
        <ContextMenuButton
          onClick={() =>
            state.notifications.setChannel(props.channel, undefined)
          }
          actionSymbol={
            typeof state.notifications.getChannel(props.channel) ===
            "undefined" ? (
              <Symbol size={16}>radio_button_checked</Symbol>
            ) : (
              <Symbol size={16}>radio_button_unchecked</Symbol>
            )
          }
        >
          <Column gap="none">
            <Show when={props.channel.server} fallback={<Trans>Default</Trans>}>
              <Trans>Server Default</Trans>
            </Show>
            <Text class="label" size="small">
              <Switch fallback={<Trans>None</Trans>}>
                <Match
                  when={
                    props.channel.server
                      ? state.notifications.computeForServer(
                          props.channel.server!,
                        ) === "all"
                      : true
                  }
                >
                  <Trans>All Messages</Trans>
                </Match>
                <Match
                  when={
                    props.channel.server &&
                    state.notifications.computeForServer(
                      props.channel.server!,
                    ) === "mention"
                  }
                >
                  <Trans>Mentions Only</Trans>
                </Match>
              </Switch>
            </Text>
          </Column>
        </ContextMenuButton>

        <ContextMenuButton
          icon={<Symbol size={16}>notifications_active</Symbol>}
          onClick={() => state.notifications.setChannel(props.channel, "all")}
          actionSymbol={
            state.notifications.getChannel(props.channel) === "all" ? (
              <Symbol size={16}>radio_button_checked</Symbol>
            ) : (
              <Symbol size={16}>radio_button_unchecked</Symbol>
            )
          }
        >
          <Trans>All Messages</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={<Symbol size={16}>alternate_email</Symbol>}
          onClick={() =>
            state.notifications.setChannel(props.channel, "mention")
          }
          actionSymbol={
            state.notifications.getChannel(props.channel) === "mention" ? (
              <Symbol size={16}>radio_button_checked</Symbol>
            ) : (
              <Symbol size={16}>radio_button_unchecked</Symbol>
            )
          }
        >
          <Trans>Mentions Only</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={<Symbol size={16}>notifications_off</Symbol>}
          onClick={() => state.notifications.setChannel(props.channel, "none")}
          actionSymbol={
            state.notifications.getChannel(props.channel) === "none" ? (
              <Symbol size={16}>radio_button_checked</Symbol>
            ) : (
              <Symbol size={16}>radio_button_unchecked</Symbol>
            )
          }
        >
          <Trans>None</Trans>
        </ContextMenuButton>
      </ContextMenuSubMenu>
    </>
  );
}
