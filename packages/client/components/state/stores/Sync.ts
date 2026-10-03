import { batch } from "solid-js";

import { ReactiveSet } from "@solid-primitives/set";
import { Client } from "stoat.js";

import { State } from "..";

import { AbstractStore, SYNCED_KEYS, SyncedStore } from ".";

export interface TypeSynchronisation {
  revision: Record<keyof SyncedStore, number>;
}

/**
 * Synchronisation orchestration
 */
export class Sync extends AbstractStore<"sync", TypeSynchronisation> {
  /**
   * Block sync for remote updates
   */
  #blockSync: Set<keyof SyncedStore>;

  /**
   * Keys that need to be synced out
   */
  #syncQueue: ReactiveSet<keyof SyncedStore>;

  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "sync");
    this.#blockSync = new Set();
    this.#syncQueue = new ReactiveSet();
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {}

  /**
   * Generate default values
   */
  default(): TypeSynchronisation {
    return {
      revision: {
        ordering: 0,
        notifications: 0,
        "release-notes": 0,
        "server-folders": 0,
      },
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeSynchronisation>): TypeSynchronisation {
    return {
      revision: Object.keys(input.revision ?? {})
        .filter((key) => SYNCED_KEYS.includes(key as keyof SyncedStore))
        .filter((key) => input.revision?.[key as keyof SyncedStore])
        .reduce(
          (d, k) => ({ ...d, [k]: input.revision?.[k as keyof SyncedStore] }),
          {} as TypeSynchronisation["revision"],
        ),
    };
  }

  /**
   * Synchronise data into store
   * @param client Client
   */
  async initialSync(client: Client) {
    const response = await client.api.post("/sync/settings/fetch", {
      keys: SYNCED_KEYS,
    });

    for (const key in response) {
      const [ts, data] = response[key];
      this.merge(ts, key as keyof SyncedStore, data);
    }
  }

  /**
   * Send data to remote
   * @param client Client
   */
  async save(client: Client) {
    // find all keys for sync
    const keys = this.#syncQueue.keys().toArray();

    // due to API constraints, merge ts down
    const ts = +new Date();

    // generate payload
    const payload = keys.reduce(
      (d, k) => ({
        ...d,
        [k]: JSON.stringify(this.state.get(k)),
      }),
      {
        timestamp: ts,
      },
    );

    // apply new ts and remove all of the keys
    batch(() =>
      keys.forEach((key) => {
        this.set("revision", key, ts);
        this.#syncQueue.delete(key);
      }),
    );

    // send data to the server
    await client.api.post("/sync/settings/set", payload);
  }

  /**
   * Get revision for key
   * @param key Key
   * @returns Revision timestamp
   */
  private ts(key: keyof SyncedStore) {
    return this.get().revision[key];
  }

  /**
   * Update timestamp for key
   * @param key Key
   */
  touch(key: keyof SyncedStore) {
    if (this.#blockSync.has(key)) {
      this.#blockSync.delete(key);
      return;
    }

    this.set("revision", key, +new Date());
    this.#syncQueue.add(key);
  }

  /**
   * Update timestamp for key
   * @param key Key
   */
  touchIfSyncable(key: string) {
    if (SYNCED_KEYS.includes(key as keyof SyncedStore)) {
      this.touch(key as keyof SyncedStore);
    }
  }

  /**
   * Merge data
   * @param ts Timestamp
   * @param key Store key
   * @param data Data to merge
   */
  merge(ts: number, key: keyof SyncedStore, data: string) {
    if (import.meta.env.DEV)
      console.info(`[sync] merge ${key} at ${ts} with`, data);

    // Parse the json blob before in-case the data is malformed.
    const blob = JSON.parse(data);
    if (!this.ts(key) || ts > this.ts(key)) {
      // if ts is newer or this value does not exist on the local store, hydrate the store with it
      this.set("revision", key, ts);
      this.#blockSync.add(key);
      this.state[key].setFromSync(blob);
    } else if (ts !== this.ts(key)) {
      // if ts is old, trigger write to synchronise to remote, but only if the data has been updated
      if (!this.state[key].equalsClean(blob)) {
        this.touch(key);
      }
    }
  }

  /**
   * Consume client events
   * @param event Update event
   */
  consumeEvent(event: Record<string, [number, string]>) {
    for (const key in event) {
      if (SYNCED_KEYS.includes(key as keyof SyncedStore)) {
        const [ts, data] = event[key];
        this.merge(ts, key as keyof SyncedStore, data);
      }
    }
  }

  /**
   * Whether there are items in queue to sync
   */
  get shouldSync() {
    return this.#syncQueue.values().next().done === false;
  }
}
