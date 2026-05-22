import { useLingui } from "@lingui-solid/solid/macro";
import { batch } from "solid-js";

import { Client } from "stoat.js";

import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { useSnackbar } from "@revolt/ui";

import { IS_DEV, useClient } from ".";

export function useNotifications() {
  const state = useState();
  const { t } = useLingui();
  const getClient = useClient();
  const snackbar = useSnackbar();
  const { showError } = useModals();

  const onDeny = (showModal?: boolean) => {
    batch(() => {
      if (state.settings.getValue("notifications:desktop") !== "unsupported") {
        state.settings.setValue("notifications:desktop", "denied");
      }
      state.settings.setValue("notifications:push", "denied");
      killServiceWorkerSubscription(getClient());
    });
    if (showModal) {
      showError(
        t`Failed to enable notifications. Stoat does not have notification permission.`,
      );
    }
  };

  const initNotifications = () => {
    if (state.settings.getValue("notifications:desktop") === "default") {
      // We do this before permission checking because the constructor will still work fine if we don't have permission.
      let supportsDesktopNotifications = !!Notification;
      if (supportsDesktopNotifications) {
        try {
          const noti = new Notification(
            "This is what notifications will look like. You shouldn't see this for long.",
            { silent: true },
          );
          // Close the notification just after showing
          // On very slow desktop systems, 100 ms just isn't long enough. Skill issue I guess.
          noti.addEventListener("show", () =>
            setTimeout(() => noti.close(), 100),
          );
          supportsDesktopNotifications = true;
        } catch {
          // An error means not supported.
          supportsDesktopNotifications = false;
        }
      }

      if (!supportsDesktopNotifications) {
        state.settings.setValue("notifications:desktop", "unsupported");
      }
      if (Notification) {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            if (supportsDesktopNotifications) {
              toggleNotificationPermission();
            }
            togglePushPermission();
          } else {
            onDeny(false);
          }
        });
      } else {
        togglePushPermission();
      }
    }
  };

  const toggleNotificationPermission = (modalOnDeny?: boolean) => {
    if (state.settings.getValue("notifications:desktop") !== "allowed") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          state.settings.setValue("notifications:desktop", "allowed");
        } else {
          onDeny(modalOnDeny);
        }
      });
    } else {
      state.settings.setValue("notifications:desktop", "denied");
    }
  };

  const enablePushSubscription = () => {
    const snackbarMessage = t`Failed to enable push notifications. Please try again later.`;
    setUpServiceWorkerSubscription(getClient()).then((succeeded) => {
      if (succeeded) {
        return;
      }
      snackbar.show({
        message: snackbarMessage,
      });
      state.settings.setValue("notifications:push", "default");
    });
  };

  const togglePushPermission = (modalOnDeny?: boolean) => {
    if (state.settings.getValue("notifications:push") !== "allowed") {
      if (Notification) {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            state.settings.setValue("notifications:push", "allowed");
            enablePushSubscription();
          } else {
            onDeny(modalOnDeny);
          }
        });
      } else {
        // On safari mobile, just enable push notifications.
        state.settings.setValue("notifications:push", "allowed");
        enablePushSubscription();
      }
    } else {
      state.settings.setValue("notifications:push", "denied");
      killServiceWorkerSubscription(getClient());
    }
  };

  return {
    desktopState: () => state.settings.getValue("notifications:desktop"),
    pushState: () => state.settings.getValue("notifications:push"),
    toggleNotificationPermission,
    togglePushPermission,
    initNotifications,
  };
}

async function setUpServiceWorkerSubscription(
  client: Client,
): Promise<boolean> {
  if (IS_DEV) {
    console.log(
      "I would have set up the service worker with push notifications in production.",
    );
    return true;
  }
  return await navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      if (!registration || !client.configured() || !client.configuration)
        return false;
      return registration.pushManager
        .getSubscription()
        .then(async (subscription) => {
          if (subscription) return subscription;

          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: client.configuration!.vapid,
          });
        })
        .then((subscription) => {
          client.api.post("/push/subscribe", {
            endpoint: subscription.endpoint,
            p256dh: arrayBufferToBase64URL(
              subscription.getKey("p256dh") || new ArrayBuffer(),
            ),
            auth: arrayBufferToBase64URL(
              subscription.getKey("auth") || new ArrayBuffer(),
            ),
          });
          return true;
        });
    });
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const intArray = new Uint8Array(buffer);
  // Todo: Upon upgrading the target of this repo, use Uint8Array.prototype.toBase64() instead of this.
  const binaryString = [...intArray.values()]
    .map((byte) => String.fromCodePoint(byte))
    .join("");
  const base64String = btoa(binaryString);
  return base64String
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Exported for the client controller. Don't use this unless you have to.
export function killServiceWorkerSubscription(client: Client) {
  if (IS_DEV) {
    console.log(
      "I would have killed the service worker push notifications in production.",
    );
    return;
  }
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (!registration) return;
    registration.pushManager.getSubscription().then((subscription) =>
      subscription?.unsubscribe().then((successful) => {
        if (successful) {
          client.api.post("/push/unsubscribe");
        }
      }),
    );
  });
}
