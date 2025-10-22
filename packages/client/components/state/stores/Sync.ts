import { batch } from "solid-js";

import { ReactiveSet } from "@solid-primitives/set";
import { Client } from "stoat.js";

import { State } from "..";

import { AbstractStore } from ".";

type SynchronisedStores = "ordering" | "notifications";

const STORE_KEYS: SynchronisedStores[] = ["ordering", "notifications"];

export interface TypeSynchronisation {
  revision: Record<SynchronisedStores, number>;
}

/**
 * Synchronisation orchestration
 */
export class Sync extends AbstractStore<"sync", TypeSynchronisation> {
  /**
   * Block sync for remote updates
   */
  #blockSync: Set<SynchronisedStores>;

  /**
   * Keys that need to be synced out
   */
  #syncQueue: ReactiveSet<SynchronisedStores>;

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
      },
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeSynchronisation>): TypeSynchronisation {
    return {
      revision: Object.keys(input.revision ?? {})
        .filter((key) => STORE_KEYS.includes(key as SynchronisedStores))
        .filter((key) => input.revision?.[key as SynchronisedStores])
        .reduce(
          (d, k) => ({ ...d, [k]: input.revision?.[k as SynchronisedStores] }),
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
      keys: STORE_KEYS,
    });

    for (const key in response) {
      const [ts, data] = response[key];
      this.merge(ts, key as SynchronisedStores, data);
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
  private ts(key: SynchronisedStores) {
    return this.get().revision[key];
  }

  /**
   * Update timestamp for key
   * @param key Key
   */
  touch(key: SynchronisedStores) {
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
    if (STORE_KEYS.includes(key as SynchronisedStores)) {
      this.touch(key as SynchronisedStores);
    }
  }

  /**
   * Merge data
   * @param ts Timestamp
   * @param key Store key
   * @param data Data to merge
   */
  merge(ts: number, key: SynchronisedStores, data: string) {
    if (import.meta.env.DEV)
      console.info(`[sync] merge ${key} at ${ts} with`, data);

    if (ts > this.ts(key)) {
      // if ts is newer, hydrate the store with it
      const parsed = this.state[key].clean(JSON.parse(data));
      this.set("revision", key, ts);
      this.#blockSync.add(key);
      this.state.set(key, parsed);
    } else if (ts !== this.ts(key)) {
      // if ts is old, trigger write to synchronise to remote
      this.touch(key);
    }
  }

  /**
   * Consume client events
   * @param event Update event
   */
  consumeEvent(event: Record<string, [number, string]>) {
    for (const key in event) {
      if (STORE_KEYS.includes(key as SynchronisedStores)) {
        const [ts, data] = event[key];
        this.merge(ts, key as SynchronisedStores, data);
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
