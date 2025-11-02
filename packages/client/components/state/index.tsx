import {
  JSX,
  Show,
  createContext,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";

import equal from "fast-deep-equal";
import localforage from "localforage";

import { AbstractStore, Store } from "./stores";
import { Auth } from "./stores/Auth";
import { Draft } from "./stores/Draft";
import { Experiments } from "./stores/Experiments";
import { Keybinds } from "./stores/Keybinds";
import { Layout } from "./stores/Layout";
import { LinkSafety } from "./stores/LinkSafety";
import { Locale } from "./stores/Locale";
import { NotificationOptions } from "./stores/NotificationOptions";
import { Ordering } from "./stores/Ordering";
import { Settings } from "./stores/Settings";
import { Sync } from "./stores/Sync";
import { Theme } from "./stores/Theme";
import { Voice } from "./stores/Voice";

export { SyncWorker } from "./SyncWorker";

/**
 * Introduce some delay before writing state to disk
 */
const DISK_WRITE_WAIT_MS = 1200;

/**
 * Stores for which we don't want to wait to write to
 */
const IGNORE_WRITE_DELAY = ["auth"];

/**
 * Global application state
 */
export class State {
  // internal data management
  private store: Store;
  private setStore: SetStoreFunction<Store>;
  private writeQueue: Record<string, number>;

  // define all stores
  auth = new Auth(this);
  draft = new Draft(this);
  experiments = new Experiments(this);
  keybinds = new Keybinds(this);
  layout = new Layout(this);
  linkSafety = new LinkSafety(this);
  locale = new Locale(this);
  notifications = new NotificationOptions(this);
  ordering = new Ordering(this);
  settings = new Settings(this);
  sync = new Sync(this);
  theme = new Theme(this);
  voice = new Voice(this);

  /**
   * Iterate over all available stores
   * @returns Array of stores
   */
  private iterStores() {
    return (
      Object.keys(this).filter(
        (key) =>
          (this[key as keyof State] as unknown as { _storeHint: boolean })
            ?._storeHint,
      ) as (keyof Store)[]
    ).map((key) => this[key] as AbstractStore<typeof key, Store[typeof key]>);
  }

  /**
   * Generate all store defaults / initial store
   * @returns Defaults object
   */
  private defaults() {
    const defaults: Partial<Store> = {};

    for (const store of this.iterStores()) {
      defaults[store.getKey()] = store.default() as never;
    }

    return defaults;
  }

  /**
   * Construct the global application state
   */
  constructor() {
    const [store, setStore] = createStore(this.defaults() as Store);

    this.store = store as never;
    this.setStore = setStore;
    this.writeQueue = {};
  }

  /**
   * Write some data to the store and disk
   */
  private write: SetStoreFunction<Store> = (...args: unknown[]) => {
    // pass the data to the store
    (this.setStore as (...args: unknown[]) => void)(...args);

    // resolve key
    const key = args[0] as string;

    // touch the key if syncable
    this.sync.touchIfSyncable(key);

    // remove existing queued task if it exists
    if (this.writeQueue[key]) {
      clearTimeout(this.writeQueue[key]);
    }

    // queue for writing to disk
    this.writeQueue[key] = setTimeout(
      () => {
        // remove from write queue
        delete this.writeQueue[key];

        // write the entire key to storage
        localforage.setItem(
          key,
          JSON.parse(
            JSON.stringify((this.store as Record<string, unknown>)[key]),
          ),
        );

        if (import.meta.env.DEV) {
          console.info("[store.save] Wrote state to disk.");
        }
      },
      IGNORE_WRITE_DELAY.includes(key) ? 0 : DISK_WRITE_WAIT_MS,
    ) as unknown as number;
  };

  /**
   * Write data to store / disk and then synchronise it
   */
  set: SetStoreFunction<Store> = (...args: unknown[]) => {
    // write to store and storage
    (this.write as (...args: unknown[]) => void)(...args);

    // run side-effects
    if (import.meta.env.DEV) {
      console.debug("[store] updated data", args[0]);
    }
  };

  /**
   * Get a store's value by its key
   * @param key Store's key
   * @returns Store's value
   */
  get<T extends keyof Store>(key: T): Store[T] {
    return this.store[key];
  }

  /**
   * Hydrate the state from disk and run side-effects
   */
  async hydrate() {
    // load all data first
    for (const store of this.iterStores()) {
      const data = await localforage.getItem(store.getKey());

      if (data) {
        // validate the incoming data
        const cleanData = store.clean(data);

        if (!equal(data, cleanData)) {
          // write back to disk if it has changed
          this.write(store.getKey(), cleanData);
        } else {
          this.setStore(store.getKey(), data);
        }
      }
    }

    // then run side-effects
    for (const store of this.iterStores()) {
      store.hydrate();
    }
  }
}

/**
 * State context
 */
const stateContext = createContext<State>(null! as State);

/**
 * Mount state context
 */
export function StateContext(props: { children: JSX.Element }) {
  const stateLocal = new State();
  const [ready, setReady] = createSignal(false);

  onMount(() => stateLocal.hydrate().then(() => setReady(true)));

  return (
    <stateContext.Provider value={stateLocal}>
      <Show when={ready()}>{props.children}</Show>
    </stateContext.Provider>
  );
}

/**
 * Use application state
 */
export function useState() {
  return useContext(stateContext);
}
