import {
  Accessor,
  JSX,
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";

import { createDateNow } from "@solid-primitives/date";
import equal from "fast-deep-equal";
import localforage from "localforage";

import { LoadingScreen } from "@revolt/ui";
import { SlideDrawer } from "@revolt/ui/components/navigation/SlideDrawer";

import { AbstractStore, Store } from "./stores";
import { Auth } from "./stores/Auth";
import { Draft } from "./stores/Draft";
import { Experiments } from "./stores/Experiments";
import { Hosts } from "./stores/Hosts";
import { Keybinds } from "./stores/Keybinds";
import { Layout } from "./stores/Layout";
import { LinkSafety } from "./stores/LinkSafety";
import { Locale } from "./stores/Locale";
import { NotificationOptions } from "./stores/NotificationOptions";
import { Ordering } from "./stores/Ordering";
import { ReleaseNotes } from "./stores/ReleaseNotes";
import { Settings } from "./stores/Settings";
import { Sounds } from "./stores/Sounds";
import { Sync } from "./stores/Sync";
import { Theme } from "./stores/Theme";
import { Voice } from "./stores/Voice";

export { ALLOWED_IMAGE_TYPES } from "./stores/Draft";
export type { Sounds, TypeSounds } from "./stores/Sounds";
export { SyncWorker } from "./SyncWorker";

/**
 * Introduce some delay before writing state to disk
 */
const DISK_WRITE_WAIT_MS = 1200;

/**
 * Stores for which we don't want to wait to write to
 */
const IGNORE_WRITE_DELAY = ["auth"];

const WriteQueue = new Map<string, NodeJS.Timeout>();

/**
 * Global application state
 */
export class State {
  // internal data management
  private store: Store;
  private setStore: SetStoreFunction<Store>;
  private db?: LocalForage;
  private dbGlobal: LocalForage;

  appDrawer;
  setAppDrawer;
  diagDrawer;
  setDiagDrawer;

  /** A reactive Date() that updates once per minute */
  datePerMinute: Accessor<Date> = createDateNow(6e4)[0];

  /** A reactive Date() that updates only when the day changes */
  datePerDay: Accessor<Date> = (() => {
    const poll = createDateNow(1000)[0];
    const [get, set] = createSignal();
    createEffect(() => set(poll().getDay()));
    const date = createMemo(() => (get(), new Date()));
    return date;
  })();

  // define all stores
  auth = new Auth(this);
  host = new Hosts(this);
  draft = new Draft(this);
  experiments = new Experiments(this);
  keybinds = new Keybinds(this);
  layout = new Layout(this);
  linkSafety = new LinkSafety(this);
  locale = new Locale(this);
  notifications = new NotificationOptions(this);
  ordering = new Ordering(this);
  "release-notes" = new ReleaseNotes(this);
  settings = new Settings(this);
  sync = new Sync(this);
  theme = new Theme(this);
  voice = new Voice(this);
  sounds = new Sounds(this);

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
  private defaults(localOnly = false) {
    const defaults: Partial<Store> = {};

    for (const store of this.iterStores())
      if (!localOnly || !store.global)
        defaults[store.getKey()] = store.default() as never;

    return defaults;
  }

  /**
   * Construct the global application state
   */
  constructor() {
    this.dbGlobal = localforage.createInstance({ storeName: "global" });

    const [store, setStore] = createStore(this.defaults() as Store);
    this.store = store as never;
    this.setStore = setStore;

    const [ad, setAd] = createSignal<SlideDrawer>();
    this.appDrawer = ad;
    this.setAppDrawer = setAd;

    const [dd, setDd] = createSignal<SlideDrawer>();
    this.diagDrawer = dd;
    this.setDiagDrawer = setDd;
  }

  /**
   * Write some data to the store and disk
   */
  private write = (key: string, global: boolean, ...args: unknown[]) => {
    const dbLocal = this.db; //Cache in case it changes before timeout

    // pass the data to the store
    (this.setStore as (...args: unknown[]) => void)(key, ...args);

    // touch the key if syncable
    this.sync.touchIfSyncable(key);

    //Read-only before init
    if (!global && !dbLocal) return;
    const db = global ? this.dbGlobal : dbLocal!,
      qKey = (db.config().storeName || "") + "|" + key;

    // remove existing queued task if it exists
    clearTimeout(WriteQueue.get(qKey));

    // queue for writing to disk
    WriteQueue.set(
      qKey,
      setTimeout(
        () => {
          // remove from write queue
          WriteQueue.delete(qKey);

          // write the entire key to storage
          const dataStr = JSON.stringify(
            (this.store as Record<string, unknown>)[key],
          );
          db.setItem(key, JSON.parse(dataStr));
          //Backup for auth
          if (key === "auth") localStorage.setItem(key, dataStr);

          if (import.meta.env.DEV) console.info(`[store] Wrote ${key} to disk`);
        },
        IGNORE_WRITE_DELAY.includes(key) ? 0 : DISK_WRITE_WAIT_MS,
      ),
    );
  };

  /**
   * Write data to store / disk and then synchronise it
   */
  set = (key: string, global: boolean, ...args: unknown[]) => {
    // write to store and storage
    this.write(key, global, ...args);

    // run side-effects
    if (import.meta.env.DEV) console.debug("[store] updated data", args[0]);
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
   * Hydrate the state from disk and run side-effects.
   * Global should only run on init; Local runs whenever session changes
   */
  async hydrate(global = false) {
    if (global) {
      //Wait for write queue to finish
      if (WriteQueue.size)
        await new Promise<void>((res) => {
          const tmr = setInterval(() => {
            if (WriteQueue.size) return;
            clearInterval(tmr);
            res();
          }, 50);
        });
    } else {
      //Reset defaults
      if (this.db)
        for (const [key, data] of Object.entries(this.defaults(true)))
          this.setStore(key as keyof Store, data);

      //If session exists, use session store
      const ses = this.store.auth.session;
      this.db =
        ses &&
        localforage.createInstance({
          storeName: `${ses.host ?? ""}@${ses.userId}`,
        });
    }

    // load all data first
    if (global || this.db)
      for (const store of this.iterStores())
        if (store.global === global) {
          const key = store.getKey();
          let data = await (store.global ? this.dbGlobal : this.db!).getItem(
            key,
          );

          //Load auth from backup
          if (!data && key === "auth") {
            const authBack = localStorage.getItem(key);
            if (authBack) data = JSON.parse(authBack);
          }

          if (data) {
            // validate the incoming data
            const cleanData = store.clean(data);
            // write back to disk if it has changed
            if (!equal(data, cleanData))
              this.write(key, store.global, cleanData);
            else this.setStore(key, data);
          }
        }

    // then run side-effects
    for (const store of this.iterStores())
      if (store.global === global) store.hydrate();

    //Clear old sessions via some hackery
    if (global) {
      const stores = (this.dbGlobal as { _dbInfo?: { db?: IDBDatabase } })
        ._dbInfo?.db?.objectStoreNames;
      if (stores) {
        const ses = this.store.auth.session,
          sesNames = [...(ses ? [ses] : []), ...this.store.auth.saved].map(
            (s) => `${s.host ?? ""}@${s.userId}`,
          );
        for (const key of stores)
          if (
            key === "keyvaluepairs" ||
            (key.indexOf("@") !== -1 && !sesNames.includes(key))
          ) {
            console.warn(`[store] Deleted unused db ${key}`);
            await localforage.dropInstance({ storeName: key });
          }
      }
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
  const state = new State();
  const [ready, setReady] = createSignal(false);

  onMount(() => state.hydrate(true).then(() => setReady(true)));

  return (
    <stateContext.Provider value={state}>
      <Show when={ready()} fallback={<LoadingScreen />}>
        {props.children}
      </Show>
    </stateContext.Provider>
  );
}

/**
 * Use application state
 */
export function useState() {
  return useContext(stateContext);
}
