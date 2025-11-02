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
import { TypeSettings } from "./Settings";
import { TypeSynchronisation } from "./Sync";
import { TypeTheme } from "./Theme";
import { TypeVoice } from "./Voice";

export type Store = {
  auth: TypeAuth;
  draft: TypeDraft;
  experiments: TypeExperiments;
  keybinds: TypeKeybinds;
  layout: TypeLayout;
  linkSafety: TypeLinkSafety;
  locale: TypeLocale;
  notifications: TypeNotificationOptions;
  ordering: TypeOrdering;
  settings: TypeSettings;
  sync: TypeSynchronisation;
  theme: TypeTheme;
  voice: TypeVoice;
};

/**
 * Abstract store implementation
 */
export abstract class AbstractStore<T extends keyof Store, D> {
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
  protected set: SetStoreFunction<Store[T]> = (...args: any[]) => {
    (this.state.set as any)(this.key, ...args);
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
