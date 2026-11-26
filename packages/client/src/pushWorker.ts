/// <reference lib="webworker" />
export {}; //Prevents type error

declare let self: ServiceWorkerGlobalScope;

interface ChannelPartial {
  channel_type: string;
  name?: string;
}

interface StoatPushNotification {
  title?: string;
  author?: string;
  body: string;
  icon?: string;
  channel?: ChannelPartial;
  url?: string;
}

const scope = new URL(self.registration.scope),
  root = scope.origin,
  userId = scope.search.slice(2);

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (typeof event.notification.data === "string") {
    event.waitUntil(self.clients.openWindow(event.notification.data));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const notif: StoatPushNotification = JSON.parse(event.data.text());

  notif.title ||= notif.channel
    ? notif.channel.channel_type === "DirectMessage"
      ? notif.author || "Stoat"
      : `${notif.author} in ${notif.channel.name}`
    : "Stoat";

  //Redirect instance URL
  const url = notif.url && new URL(notif.url);
  notif.url = `${root}${url ? `/i/${url.host}${url.pathname}/` : "/app"}#uid=${userId}`;

  event.waitUntil(
    self.registration.showNotification(notif.title, {
      icon: notif.icon,
      body: notif.body,
      data: notif.url,
    }),
  );
});
