import { Trans } from "@lingui/solid/macro";
import { Show } from "solid-js";

import { useNotifications } from "@revolt/client";
import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column, Symbol } from "@revolt/ui";

import Sounds from "./Sounds";

/**
 * Notifications Page
 */
export default function Notifications(props: { isDesktop: boolean }) {
  const { settings } = useState();

  const { toggleNotificationPermission, togglePushPermission } =
    useNotifications();

  return (
    <Column gap="lg">
      <Column>
        <CategoryButton.Group>
          <Show when={settings.desktopNotificationsState !== "unsupported"}>
            <CategoryButton
              action={
                <Checkbox
                  checked={settings.desktopNotificationsState === "allowed"}
                />
              }
              onClick={() => toggleNotificationPermission(true)}
              icon={<Symbol size={22}>notifications</Symbol>}
              description={
                props.isDesktop ? (
                  <Trans>
                    Receive notifications while the app is open and in the
                    background.
                  </Trans>
                ) : (
                  <Trans>Receive notifications while the tab is open.</Trans>
                )
              }
            >
              <Trans>Enable Desktop Notifications</Trans>
            </CategoryButton>
          </Show>
          <Show when={!props.isDesktop}>
            <CategoryButton
              action={
                <Checkbox
                  checked={settings.pushNotificationsState === "allowed"}
                />
              }
              onClick={() => togglePushPermission(true)}
              icon={<Symbol size={22}>mark_unread_chat_alt</Symbol>}
              description={
                <Trans>
                  Receive push notifications while the app is closed.
                </Trans>
              }
            >
              <Trans>Enable Push Notifications</Trans>
            </CategoryButton>
          </Show>
        </CategoryButton.Group>
      </Column>
      <Sounds />
    </Column>
  );
}
