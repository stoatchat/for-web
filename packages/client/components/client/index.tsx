import {
  Accessor,
  type JSXElement,
  createContext,
  createEffect,
  on,
  onCleanup,
  useContext,
} from "solid-js";

import type { Client, User } from "stoat.js";

import { useModals } from "@revolt/modal";
import { State } from "@revolt/state";

import ClientController from "./Controller";

export type { default as ClientController } from "./Controller";

const clientContext = createContext(null! as ClientController);

/**
 * Mount the modal controller
 */
export function ClientContext(props: { state: State; children: JSXElement }) {
  const { openModal } = useModals();

  const controller = new ClientController(props.state);
  onCleanup(() => controller.dispose());

  createEffect(
    on(
      () => controller.lifecycle.policyAttentionRequired(),
      (attentionRequired) => {
        if (typeof attentionRequired !== "undefined") {
          const [changes, acknowledge] = attentionRequired;

          openModal({
            type: "policy_change",
            changes,
            acknowledge,
          });
        }
      },
    ),
  );

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
  const { login, logout, selectUsername, lifecycle, isLoggedIn, isError } =
    useContext(clientContext);

  return {
    login,
    logout,
    selectUsername,
    lifecycle,
    isLoggedIn,
    isError,
  };
}

/**
 * Get the currently active client if one is available
 * @returns Client
 */
export function useClient(): Accessor<Client> {
  const controller = useContext(clientContext);
  return () => controller.getCurrentClient()!;
}

/**
 * Get the currently logged in user
 * @returns User
 */
export function useUser(): Accessor<User | undefined> {
  const controller = useContext(clientContext);
  return () => controller.getCurrentClient()!.user;
}

/**
 * Plain API client with no authentication
 * @returns API Client
 */
export function useApi() {
  return useContext(clientContext).api;
}

export const IS_DEV = import.meta.env.DEV;
