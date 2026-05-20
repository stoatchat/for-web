import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { batch, Show } from "solid-js";

import {
  killServiceWorkerSubscription,
  setUpServiceWorkerSubscription,
  useClient,
} from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, iconSize, useSnackbar } from "@revolt/ui";

import MdMarkUnreadChatAlt from "@material-design-icons/svg/outlined/mark_unread_chat_alt.svg?component-solid";
import MdNotifications from "@material-design-icons/svg/outlined/notifications.svg?component-solid";
import MdSpeaker from "@material-design-icons/svg/outlined/speaker.svg?component-solid";

/**
 * Notifications Page
 */
export default function Notifications(props: { isDesktop: boolean }) {
  const { t } = useLingui();
  const getClient = useClient();
  const state = useState();
  const snackbar = useSnackbar();

  const { showError } = useModals();

  function onDeny() {
    batch(() => {
      state.settings.setValue("notifications:desktop", "denied");
      state.settings.setValue("notifications:push", "denied");
      killServiceWorkerSubscription(getClient());
    });
    showError(
      t`Failed to enable notifications. Stoat does not have notification permission.`,
    );
  }

  function toggleNotificationPermission() {
    if (state.settings.getValue("notifications:desktop") !== "allowed") {
      Notification.requestPermission().then((permission) => {
        if (permission === "denied") {
          onDeny();
        } else {
          state.settings.setValue("notifications:desktop", "allowed");
        }
      });
    } else {
      state.settings.setValue("notifications:desktop", "denied");
    }
  }

  function togglePushPermission() {
    if (state.settings.getValue("notifications:push") !== "allowed") {
      if (Notification) {
        Notification.requestPermission().then((permission) => {
          if (permission === "denied") {
            onDeny();
          } else {
            state.settings.setValue("notifications:push", "allowed");
            setUpServiceWorkerSubscription(getClient()).then((succeeded) => {
              if (succeeded) {
                return;
              }
              snackbar.show({
                message: t`Failed to enable push notifications. Please try again later.`,
              });
              state.settings.setValue("notifications:push", "default");
            });
          }
        });
      } else {
        // On safari mobile, just enable push notifications.
        state.settings.setValue("notifications:push", "allowed");
        setUpServiceWorkerSubscription(getClient()).then((succeeded) => {
          if (succeeded) {
            return;
          }
          snackbar.show({
            message: t`Failed to enable push notifications. Please try again later.`,
          });
          state.settings.setValue("notifications:push", "default");
        });
      }
    } else {
      state.settings.setValue("notifications:push", "denied");
      killServiceWorkerSubscription(getClient());
    }
  }

  return (
    <CategoryButton.Group>
      {/* Safari on mobile will not have the Notification object. */}
      <Show when={Notification}>
        <CategoryButton
          action={
            <Checkbox
              checked={
                state.settings.getValue("notifications:desktop") === "allowed"
              }
              onChange={toggleNotificationPermission}
            />
          }
          onClick={toggleNotificationPermission}
          icon={<MdNotifications {...iconSize(22)} />}
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
              checked={
                state.settings.getValue("notifications:push") === "allowed"
              }
              onChange={togglePushPermission}
            />
          }
          onClick={togglePushPermission}
          icon={<MdMarkUnreadChatAlt {...iconSize(22)} />}
          description={
            <Trans>Receive push notifications while the app is closed.</Trans>
          }
        >
          <Trans>Enable Push Notifications</Trans>
        </CategoryButton>
      </Show>

      {/* This is not shown because it is disabled, but it is not commented out so that lingui will still process it. */}
      <Show when={false}>
        <CategoryButton.Collapse
          title={<Trans>Sounds</Trans>}
          icon={<MdSpeaker {...iconSize(22)} />}
        >
          <CategoryButton
            action={<Checkbox checked onChange={(value) => void value} />}
            onClick={() => void 0}
            icon="blank"
          >
            <Trans>Message Received</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox onChange={(value) => void value} />}
            onClick={() => void 0}
            icon="blank"
          >
            <Trans>Message Sent</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked onChange={(value) => void value} />}
            onClick={() => void 0}
            icon="blank"
          >
            <Trans>User Joined Call</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked onChange={(value) => void value} />}
            onClick={() => void 0}
            icon="blank"
          >
            <Trans>User Left Call</Trans>
          </CategoryButton>
        </CategoryButton.Collapse>
      </Show>
    </CategoryButton.Group>
  );
}
