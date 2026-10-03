import isEqual from "lodash.isequal";
import { SetStoreFunction } from "solid-js/store";

import { State } from "..";

import { TypeAuth } from "./Auth";
import { TypeDraft } from "./Draft";
import { TypeExperiments } from "./Experiments";
import { TypeKeybinds } from "./Keybinds";
import { TypeLayout } from "./Layout";
import { TypeLinkSafety } from "./LinkSafety";
import { TypeLocale } from "./Locale";
import { TypeNotificationOptions } from "./NotificationOptions";
import { TypeOrdering } from "./Ordering";
import { TypeReleaseNotes } from "./ReleaseNotes";
import { TypeServerFolders } from "./ServerFolders";
import { TypeSettings } from "./Settings";
import { TypeSounds } from "./Sounds";
import { TypeSynchronisation } from "./Sync";
import { TypeTheme } from "./Theme";
import { TypeVoice } from "./Voice";

export type Store = UnsyncedStore & SyncedStore;

export type UnsyncedStore = {
  auth: TypeAuth;
  draft: TypeDraft;
  experiments: TypeExperiments;
  keybinds: TypeKeybinds;
  layout: TypeLayout;
  linkSafety: TypeLinkSafety;
  locale: TypeLocale;
  settings: TypeSettings;
  sounds: TypeSounds;
  sync: TypeSynchronisation;
  theme: TypeTheme;
  voice: TypeVoice;
};

export type SyncedStore = {
  notifications: TypeNotificationOptions;
  ordering: TypeOrdering;
  "release-notes": TypeReleaseNotes;
  "server-folders": TypeServerFolders;
};

/**
 * An array of each key of SyncedStore. Required for cleaning. When adding a
 * store into the SyncedStore type above, add its string key value here.
 */
export const SYNCED_KEYS: (keyof SyncedStore)[] = [
  "notifications",
  "ordering",
  "release-notes",
  "server-folders",
];

/**
 * Abstract store implementation
 */
export abstract class AbstractStore<T extends keyof Store, D extends Store[T]> {
  /**
   * Marker used to determine whether this is a store
   */
  private readonly _storeHint = true;

  /**
   * Reference to the current state
   */
  protected readonly state: State;

  /**
   * This store's key
   */
  private readonly key: T;

  /**
   * Construct a new store
   * @param state Reference to current state
   * @param key This store's key
   */
  constructor(state: State, key: T) {
    this.state = state;
    this.key = key;
  }

  /**
   * Get this store's key
   * @returns Key
   */
  getKey(): T {
    return this.key;
  }

  /**
   * Set some value in this store
   */
  protected set: SetStoreFunction<Store[T]> = (...args: unknown[]) => {
    (this.state.set as unknown as (...args: unknown[]) => void)(
      this.key,
      ...args,
    );
  };

  /**
   * Get this store's value
   */
  protected get() {
    return this.state.get(this.key);
  }

  /**
   * Hydrate external context
   */
  abstract hydrate(): void;

  /**
   * Generate default values
   */
  abstract default(): D;

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  abstract clean(input: Partial<D>): D;
}

export abstract class AbstractSyncedStore<
  T extends keyof SyncedStore,
  D extends Store[T],
> extends AbstractStore<T, D> {
  /**
   * Whether the stored value in this Synced Store is equal to the passed store type.
   */
  equals(other: D): boolean {
    return isEqual(this.get(), other);
  }

  /**
   * Whether the stored value in this Synced Store is equal to the passed unparsed store
   * type. This function calls clean on the data passed before checking equality.
   */
  equalsClean(data: Partial<D>): boolean {
    return this.equals(this.clean(data));
  }

  /**
   * Set the state to the data passed, cleaning it first.
   */
  setFromSync(data: Partial<D>) {
    this.state.set(this.getKey(), this.clean(data));
  }
}
