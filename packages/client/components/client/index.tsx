import {
  type JSXElement,
  Accessor,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  Show,
  useContext,
} from "solid-js";

import type { Client, User } from "stoat.js";

import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { fetchLatestChangelog } from "@revolt/modal/modals/Changelog";
import { useState } from "@revolt/state";
import { LoadingScreen } from "@revolt/ui";

import ClientController from "./Controller";

export type { default as ClientController } from "./Controller";
export { useNotifications } from "./NotificationsController";
export { SoundContext, SoundController, useSound } from "./Sounds";

const clientContext = createContext(null! as ClientController);

/**
 * Mount the modal controller
 */
export function ClientContext(props: {
  children: JSXElement;
  preLoad: JSXElement;
}) {
  const { openModal } = useModals();
  const state = useState();
  const instance = useInstance();
  const [ready, setReady] = createSignal(false);

  const controller = new ClientController(state, instance, setReady);
  onCleanup(() => controller.dispose());

  let fetchedChangelog = false;
  createEffect(() => {
    if (!controller.isLoggedIn() || fetchedChangelog) return;
    fetchedChangelog = true;

    fetchLatestChangelog().then((changelog) => {
      if (!changelog) return;
      if (state["release-notes"].lastSeenId === changelog.id) return;

      state["release-notes"].markSeen(changelog.id, changelog.published_at);

      openModal({
        type: "changelog",
        changelog,
      });
    });
  });

  createEffect(() => {
    const policy = controller.lifecycle.policyAttentionRequired();
    if (policy) {
      const [changes, acknowledge] = policy;

      openModal({
        type: "policy_change",
        changes,
        acknowledge,
      });
    }
  });

  createEffect(() => {
    if (ready()) {
      const badgeVal =
        //Friend requests
        instance.client.users.filter((user) => user.relationship === "Incoming")
          .length +
        //Unread DMs
        instance.client.channels.filter((chan) => chan.unread).length;
      //TODO This is causing all messages to appear unread wtf
      //TODO Server unreads?
      setBadge(badgeVal);
    }
  });

  return (
    <clientContext.Provider value={controller}>
      <Show when={ready()} fallback={<LoadingScreen />}>
        {props.children}
      </Show>
      {props.preLoad}
    </clientContext.Provider>
  );
}

let origIcon: string;

/** Set the favicon notification badge */
async function setBadge(value?: number) {
  const icon = document.querySelector(
      'link[rel="shortcut icon"]',
    ) as HTMLLinkElement,
    c = document.createElement("canvas"),
    ctx = c.getContext("2d")!,
    img = new Image(),
    radius = 14;

  origIcon ||= icon.href;
  if (!value) {
    icon.href = origIcon;
    return;
  }

  return new Promise<void>((res, rej) => {
    img.onload = () => {
      c.width = img.width;
      c.height = img.height;
      ctx.drawImage(img, 0, 0);

      const fontSize = radius * 2,
        ofsX = value > 9 ? Math.round(radius / 2) : 0,
        badgeX = c.width - radius,
        badgeY = c.height - radius;

      //Draw badge
      ctx.beginPath();
      ctx.roundRect(
        badgeX - radius - ofsX,
        badgeY - radius,
        radius * 2 + ofsX,
        radius * 2,
        radius,
      );
      ctx.fillStyle = "#e30";
      ctx.fill();
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(
        value > 9 ? "9+" : `${value}`,
        badgeX - Math.floor(ofsX / 2),
        badgeY + 2,
      );

      icon.href = c.toDataURL("image/png");
      res();
    };
    img.onerror = rej;
    img.src = origIcon;
  });
}

/**
 * Get various lifecycle objects
 * @returns Lifecycle information
 */
export function useClientLifecycle() {
  return useContext(clientContext);
}

/**
 * Get the currently active client
 * @returns Client
 */
export function useClient(): Accessor<Client> {
  const instance = useInstance();
  return () => instance.client;
}

/**
 * Get the currently logged in user
 * @returns User
 */
export function useUser(): Accessor<User | undefined> {
  const instance = useInstance();
  return () => instance.client.user;
}

/**
 * Plain API client with no authentication
 * @returns API Client
 */
export function useApi() {
  return useContext(clientContext).api;
}

export const IS_DEV = import.meta.env.DEV;
