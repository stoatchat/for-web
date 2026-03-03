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
  const payload = event.data.text();
  const notification: StoatPushNotification = JSON.parse(payload);

  if (!notification.title) {
    if (notification.channel) {
      if (notification.channel.channel_type === "DirectMessage") {
        notification.title = notification.author || "Stoat";
      } else {
        notification.title = `${notification.author} in ${notification.channel.name}`;
      }
    } else {
      notification.title = "Stoat";
    }
  }

  //Redirect instance URL
  const url = notification.url && new URL(notification.url);
  notification.url = `${root}${url ? `/i/${url.host}${url.pathname}` : ""}#uid=${userId}`;

  event.waitUntil(
    self.registration.showNotification(notification.title || "Stoat", {
      icon: notification.icon,
      body: notification.body,
      data: notification.url,
    }),
  );
});
