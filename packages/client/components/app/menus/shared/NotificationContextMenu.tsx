import { For, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import dayjs from "dayjs";
import { Channel } from "stoat.js";

import { useState } from "@revolt/state";
import { Column, Text, Time } from "@revolt/ui";

import MdAlternateEmail from "@material-design-icons/svg/outlined/alternate_email.svg?component-solid";
import MdNotificationsActive from "@material-design-icons/svg/outlined/notifications_active.svg?component-solid";
import MdNotificationsOff from "@material-design-icons/svg/outlined/notifications_off.svg?component-solid";

import MdDoNotDisturbOff from "@material-symbols/svg-400/outlined/do_not_disturb_off.svg?component-solid";
import MdDoNotDisturbOn from "@material-symbols/svg-400/outlined/do_not_disturb_on.svg?component-solid";
import MdNotificationSettings from "@material-symbols/svg-400/outlined/notification_settings.svg?component-solid";
import MdRadioButtonChecked from "@material-symbols/svg-400/outlined/radio_button_checked-fill.svg?component-solid";
import MdRadioButtonUnchecked from "@material-symbols/svg-400/outlined/radio_button_unchecked.svg?component-solid";

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
            symbol={MdDoNotDisturbOff}
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
          symbol={MdDoNotDisturbOn}
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
        symbol={MdNotificationSettings}
        buttonContent={<Trans>Notifications</Trans>}
      >
        <ContextMenuButton
          onClick={() =>
            state.notifications.setChannel(props.channel, undefined)
          }
          actionSymbol={
            typeof state.notifications.getChannel(props.channel) === "undefined"
              ? MdRadioButtonChecked
              : MdRadioButtonUnchecked
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
          icon={MdNotificationsActive}
          onClick={() => state.notifications.setChannel(props.channel, "all")}
          actionSymbol={
            state.notifications.getChannel(props.channel) === "all"
              ? MdRadioButtonChecked
              : MdRadioButtonUnchecked
          }
        >
          <Trans>All Messages</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={MdAlternateEmail}
          onClick={() =>
            state.notifications.setChannel(props.channel, "mention")
          }
          actionSymbol={
            state.notifications.getChannel(props.channel) === "mention"
              ? MdRadioButtonChecked
              : MdRadioButtonUnchecked
          }
        >
          <Trans>Mentions Only</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={MdNotificationsOff}
          onClick={() => state.notifications.setChannel(props.channel, "none")}
          actionSymbol={
            state.notifications.getChannel(props.channel) === "none"
              ? MdRadioButtonChecked
              : MdRadioButtonUnchecked
          }
        >
          <Trans>None</Trans>
        </ContextMenuButton>
      </ContextMenuSubMenu>
    </>
  );
}
