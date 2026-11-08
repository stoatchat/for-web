/// <reference lib="webworker" />

import localforage from "localforage";
import { API } from "stoat.js";
import { decodeTime } from "ulid";

import { CONFIGURATION } from "@revolt/common";
import { Session, TypeAuth } from "@revolt/state/stores/Auth";

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

interface TypeCache {
  unreads?: API.ChannelUnread[];
  unreadTime: number;
}

/** Time before unread fetch is stale (2 min) */
const UnreadStale = 120000;

const scope = new URL(self.registration.scope),
  badgePath = new URL("../assets/web/monochrome.svg", scope).pathname,
  root = scope.origin,
  userId = scope.search.slice(2),
  db = localforage.createInstance({ storeName: "global" });

let waitDB: Promise<void> | null,
  waitUnread: Promise<void> | null,
  session: Session,
  cache: TypeCache;

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (typeof event.notification.data === "string") {
    event.waitUntil(self.clients.openWindow(event.notification.data));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const notif: StoatPushNotification = JSON.parse(event.data.text());

  event.waitUntil(
    (async () => {
      if (
        !notif.channel ||
        !notif.message ||
        (await isUnread(notif.channel._id, notif.message._id))
      )
        await showNotification(notif);
    })(),
  );
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

/** True if message is unread */
async function isUnread(chanId: string, msgId: string) {
  try {
    await loadDB();
    if (!session.token) return true;

    //Load unreads
    await fetchUnreads();

    //Check if newer
    const unread = cache.unreads!.find((u) => u._id.channel === chanId);
    return unread && msgId > unread.last_id!;
  } catch (e) {
    console.error(e);
    return true;
  }
}

/** Fetch unreads list */
async function fetchUnreads() {
  if (waitUnread) return waitUnread;
  return (waitUnread = (async () => {
    try {
      const time = Date.now();
      if (!cache.unreads || time - cache.unreadTime > UnreadStale) {
        const res = await fetch(
          CONFIGURATION.DEFAULT_API_URL + "/sync/unreads",
          {
            headers: { "x-session-token": session.token },
          },
        );
        if (!res.ok) throw "HTTP Error " + res.status;

        //Save to DB
        cache.unreads = await res.json();
        cache.unreadTime = time;
        await db.setItem("cache", cache);
      }
    } finally {
      waitUnread = null;
    }
  })());
}

/** Wait for DB to load*/
async function loadDB() {
  if (waitDB) return waitDB;
  return (waitDB = (async () => {
    try {
      //Get token
      const auth = (await db.getItem("auth")) as TypeAuth;
      if (auth.session) auth.saved.push(auth.session);
      session = auth.saved.find((s) => s.userId === userId)!;
      if (!session) throw `Session for @${userId} not found`;

      //Load cache
      cache = (await db.getItem("cache")) || ({} as TypeCache);
      cache.unreadTime ||= 0;

      const time = Date.now();
      if (!cache.unreads || time - cache.unreadTime > UnreadStale) {
        delete cache.unreads;
        cache.unreadTime = 0;
        await db.setItem("cache", cache);
      }
    } catch (e) {
      waitDB = null;
      throw e;
    }
  })());
}
