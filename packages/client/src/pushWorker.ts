/// <reference lib="webworker" />

import { decodeTime } from "ulid";

declare let self: ServiceWorkerGlobalScope;

interface ChannelPartial {
  _id: string;
  channel_type: string;
  name?: string;
}

interface MessagePartial {
  _id: string;
}

interface StoatPushNotification {
  title?: string;
  author?: string;
  body: string;
  icon?: string;
  channel?: ChannelPartial;
  message?: MessagePartial;
  url?: string;
}

const scope = new URL(self.registration.scope),
  badgePath = new URL("../assets/web/monochrome.svg", scope).pathname,
  root = scope.origin,
  userId = scope.search.slice(2);

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (typeof event.notification.data === "string") {
    event.waitUntil(self.clients.openWindow(event.notification.data));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const notif: StoatPushNotification = JSON.parse(event.data.text());
  event.waitUntil(showNotification(notif));
});

/** Show push notification */
async function showNotification(notif: StoatPushNotification) {
  notif.title ||= notif.channel
    ? notif.channel.channel_type === "DirectMessage"
      ? notif.author || "Stoat"
      : `${notif.author} in ${notif.channel.name}`
    : "Stoat";

  //Redirect instance URL
  const url = notif.url && new URL(notif.url);
  notif.url = `${root}${url ? `/i/${url.host}${url.pathname}/` : "/app"}#uid=${userId}`;

  await self.registration.showNotification(notif.title, {
    icon: notif.icon,
    body: notif.body,
    data: notif.url,
    timestamp: notif.message ? decodeTime(notif.message._id) : Date.now(),
    badge: badgePath,
  } as never);
}
