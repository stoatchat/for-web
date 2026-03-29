import {
  UNICODE_EMOJI_PACKS,
  UnicodeEmojiPacks,
} from "@revolt/markdown/emoji/UnicodeEmoji";

import { State } from "..";

import { AbstractStore } from ".";

interface SettingsDefinition {
  /**
   * Whether to enable desktop notifications
   * Stoat will try to get notification permission after login if it doesn't already.
   * TODO: implement
   */
  // "notifications:desktop": boolean;

  /**
   * Customise notification sounds
   * TODO: implement
   */
  // "notifications:sounds": SoundOptions;

  /**
   * Selected unicode emoji
   */
  "appearance:unicode_emoji": UnicodeEmojiPacks;

  // TODO: this should be part of theme
  // "appearance:ligatures": boolean;

  /**
   * Enable season effects
   * TODO: implement
   */
  // "appearance:seasonal": boolean;

  // TODO: this should be part of theme
  // "appearance:transparency": boolean;

  /**
   * Show message send button
   */
  "appearance:show_send_button": boolean;

  /**
   * Whether to render messages in compact mode
   */
  "appearance:compact_mode": boolean;

  /**
   * Indicate new users to Stoat
   * TODO: implement
   */
  // "appearance:show_account_age": boolean;

  /**
   * Whether to include 'copy ID' in context menus
   */
  "advanced:copy_id": boolean;

  /**
   * Whether to include admin panel links in context menus
   */
  "advanced:admin_panel": boolean;

  /**
   * Last read changelog index
   */
  "changelog:last_index": number;
}

/**
 * Map actual type to JavaScript type OR function to clean the value.
 */
type ValueType<T extends keyof SettingsDefinition> =
  SettingsDefinition[T] extends boolean
    ? "boolean"
    : SettingsDefinition[T] extends number
      ? "number"
      : SettingsDefinition[T] extends string
        ? "string"
        : (
            v: Partial<SettingsDefinition[T]>,
          ) => SettingsDefinition[T] | undefined;

/**
 * Expected types of settings keys, enforce some sort of validation is present for all keys.
 * If we cannot validate the value as a primitive, clean it up using a function.
 */
const EXPECTED_TYPES: { [K in keyof SettingsDefinition]: ValueType<K> } = {
  "appearance:unicode_emoji": "string",
  "appearance:show_send_button": "boolean",
  "appearance:compact_mode": "boolean",
  "advanced:copy_id": "boolean",
  "advanced:admin_panel": "boolean",
  "changelog:last_index": "number",
};

/**
 * In reality, this is a partial so we map it accordingly here.
 */
export type TypeSettings = Partial<SettingsDefinition>;

/**
 * Default values for settings, if applicable.
 */
const DEFAULT_VALUES: TypeSettings = {};

/**
 * Settings store
 */
export class Settings extends AbstractStore<"settings", TypeSettings> {
  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "settings");
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    /** nothing needs to be done */
  }

  /**
   * Generate default values
   */
  default(): TypeSettings {
    return {
      "appearance:unicode_emoji": "fluent-3d",
      "appearance:show_send_button": true,
      "appearance:compact_mode": false,
      "advanced:copy_id": false,
      "advanced:admin_panel": false,
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeSettings>): TypeSettings {
    const settings: TypeSettings = this.default();

    for (const key of Object.keys(input) as (keyof TypeSettings)[]) {
      const expectedType = EXPECTED_TYPES[key];

      if (typeof expectedType === "function") {
        const cleanedValue = (expectedType as (value: unknown) => unknown)(
          input[key],
        );
        if (cleanedValue) {
          settings[key] = cleanedValue as never;
        }
      } else if (key === "appearance:unicode_emoji") {
        if (UNICODE_EMOJI_PACKS.includes(input[key] as never)) {
          settings[key] = input[key];
        }
      } else if (typeof input[key] === expectedType) {
        settings[key] = input[key] as never;
      }
    }

    return settings;
  }

  /**
   * Set a settings key
   * @param key Colon-divided key
   * @param value Value
   */
  setValue<T extends keyof TypeSettings>(key: T, value: TypeSettings[T]) {
    this.set(key, value);
  }

  /**
   * Get a settings key
   * @param key Colon-divided key
   * @returns Value at key or default value
   */
  getValue<T extends keyof TypeSettings>(key: T) {
    return this.get()[key] ?? DEFAULT_VALUES[key];
  }
}
