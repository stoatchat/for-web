import {
  type JSXElement,
  Accessor,
  createContext,
  createEffect,
  onCleanup,
  useContext,
} from "solid-js";

import type { Client, User } from "stoat.js";

import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { fetchLatestChangelog } from "@revolt/modal/modals/Changelog";
import { useState } from "@revolt/state";

import ClientController from "./Controller";

export type { default as ClientController } from "./Controller";

export { useNotifications } from "./NotificationsController";
export { SoundContext, SoundController, useSound } from "./Sounds";

const clientContext = createContext(null! as ClientController);

/**
 * Mount the modal controller
 */
export function ClientContext(props: { children: JSXElement }) {
  const { openModal } = useModals();
  const state = useState();
  const instance = useInstance();

  const controller = new ClientController(state, instance);
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

  return (
    <clientContext.Provider value={controller}>
      {props.children}
    </clientContext.Provider>
  );
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
