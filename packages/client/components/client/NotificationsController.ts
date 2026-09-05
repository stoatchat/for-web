import { useLingui } from "@lingui/solid/macro";

import { Client } from "stoat.js";

import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { useSnackbar } from "@revolt/ui";

import { IS_DEV, useClient } from ".";
import pushWorker from "/src/pushWorker?worker&url";

const PushPrefix = "/?@";
const pwPath = pushWorker.slice(0, pushWorker.lastIndexOf("/")) + PushPrefix;

export function useNotifications() {
  const { settings, auth } = useState();
  const { t } = useLingui();
  const getClient = useClient();
  const snackbar = useSnackbar();
  const { showError } = useModals();

  const supportsNotification = "Notification" in window;

  const onDeny = async (showModal?: boolean) => {
    settings.resetNotificationsState("denied");
    if (showModal) {
      showError(
        t`Failed to enable notifications. Stoat does not have notification permission.`,
      );
    }
    await killServiceWorkerSubscription(getClient());
  };

  const notificationStateMismatch = async () => {
    const areNotificationsAllowed =
      settings.desktopNotificationsState === "allowed" ||
      settings.pushNotificationsState === "allowed";

    const notificationPermissionGranted =
      !supportsNotification || Notification.permission === "granted";

    return (
      areNotificationsAllowed &&
      (!notificationPermissionGranted || !(await getPushWorker(getClient())))
    );
  };

  const initNotifications = async () => {
    if (
      settings.desktopNotificationsState === "default" ||
      (await notificationStateMismatch())
    ) {
      // We do this before permission checking because the constructor will still work fine if we don't have permission.
      if (supportsNotification) {
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
        } catch {
          // An error means not supported.
          settings.desktopNotificationsState = "unsupported";
        }
      } else {
        settings.desktopNotificationsState = "unsupported";
      }

      if (supportsNotification) {
        if ((await Notification.requestPermission()) === "granted") {
          settings.desktopNotificationsState = "allowed";
          await enablePushSubscription();
        } else {
          await onDeny();
        }
      } else {
        await enablePushSubscription();
      }
    }

    //Unproductive workers will not be tolerated in Soviet Russia
    const sesList = auth.getSessions().map((s) => pwPath + s.userId);
    for (const worker of await navigator.serviceWorker.getRegistrations()) {
      if (worker.scope.indexOf(PushPrefix) !== -1) {
        const wUrl = new URL(worker.scope);
        if (!sesList.includes(wUrl.pathname + wUrl.search)) {
          console.warn(
            `[push] Unregistered dead worker for ${wUrl.search.slice(1)}`,
          );
          worker.unregister();
        }
      }
    }
  };

  const toggleNotificationPermission = async (modalOnDeny?: boolean) => {
    if (settings.desktopNotificationsState !== "allowed") {
      if ((await Notification.requestPermission()) === "granted") {
        settings.desktopNotificationsState = "allowed";
      } else {
        await onDeny(modalOnDeny);
      }
    } else {
      settings.desktopNotificationsState = "denied";
    }
  };

  const enablePushSubscription = async () => {
    settings.pushNotificationsState = "allowed";
    try {
      await setUpServiceWorkerSubscription(getClient());
    } catch (e) {
      console.error(e);
      snackbar.show({
        message: t`Failed to enable push notifications. Please try again later.`,
      });
      settings.pushNotificationsState = "default";
    }
  };

  const togglePushPermission = async (modalOnDeny?: boolean) => {
    if (settings.pushNotificationsState !== "allowed") {
      if (supportsNotification) {
        if ((await Notification.requestPermission()) === "granted") {
          await enablePushSubscription();
        } else {
          await onDeny(modalOnDeny);
        }
      } else {
        // On safari mobile, just enable push notifications.
        await enablePushSubscription();
      }
    } else {
      settings.pushNotificationsState = "denied";
      await killServiceWorkerSubscription(getClient());
    }
  };

  return {
    toggleNotificationPermission,
    togglePushPermission,
    initNotifications,
  };
}

async function setUpServiceWorkerSubscription(client: Client) {
  if (IS_DEV) {
    console.log("Skipping push worker in dev.");
    return;
  }

  if (!client.configured() || !client.user) {
    throw "Client not configured";
  }

  const worker = await navigator.serviceWorker.register(pushWorker, {
    scope: pwPath + client.user.id,
    type: "module",
  });

  if (!worker) {
    throw "Failed to add push worker";
  }

  if (!worker.active)
    await new Promise<void>((res, rej) => {
      const sw = (worker.installing || worker.waiting)!;
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated") res();
        if (sw.state === "redundant") rej("Failed to activate push worker");
      });
    });

  const subscription =
    (await worker.pushManager.getSubscription()) ||
    (await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: client.configuration!.vapid,
    }));

  client.api.post("/push/subscribe", {
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64URL(
      subscription.getKey("p256dh") || new ArrayBuffer(),
    ),
    auth: arrayBufferToBase64URL(
      subscription.getKey("auth") || new ArrayBuffer(),
    ),
  });
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const intArray = new Uint8Array(buffer);
  return intArray.toBase64({ alphabet: "base64url" });
}

async function getPushWorker(client: Client) {
  const scope = client.user && pwPath + client.user.id;
  if (!scope) return;
  const worker = await navigator.serviceWorker.getRegistration(scope);
  if (!worker) return;
  const wUrl = new URL(worker.scope);
  //Check if scope *actually* matches, because root worker may be returned
  if (wUrl.pathname + wUrl.search === scope) return worker;
}

/** Exported for the client controller. Don't use this unless you have to. */
export async function killServiceWorkerSubscription(
  client: Client,
  loggingOut?: boolean,
) {
  if (IS_DEV) {
    console.log("Skipping killing push worker in dev.");
    return;
  }

  const worker = await getPushWorker(client);
  if (!worker) return;
  const subscription = await worker.pushManager.getSubscription();
  if ((await subscription?.unsubscribe()) && !loggingOut) {
    await client.api.post("/push/unsubscribe");
  }
  await worker.unregister();
}
