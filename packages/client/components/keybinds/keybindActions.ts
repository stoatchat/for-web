import { ReactiveSet } from "@solid-primitives/set";

export enum KeybindAction {
  /**
   * Navigate to channel above current channel
   */
  NAVIGATION_CHANNEL_UP = "navigation_channel_up",

  /**
   * Navigate to channel below current channel
   */
  NAVIGATION_CHANNEL_DOWN = "navigation_channel_down",

  /**
   * Navigate to server above current server
   */
  NAVIGATION_SERVER_UP = "navigation_server_up",

  /**
   * Navigate to server below current server
   */
  NAVIGATION_SERVER_DOWN = "navigation_server_down",

  /**
   * Mark channel as read, jump to the end of conversation, and focus composition
   */
  CHAT_JUMP_END = "chat_jump_end",

  /**
   * Mark server as read
   */
  CHAT_MARK_SERVER_AS_READ = "chat_mark_server_as_read",

  /**
   * Focus the message composition
   */
  CHAT_FOCUS_COMPOSITION = "chat_focus_composition",

  /**
   * Remove attachment or reply from message composition
   */
  CHAT_REMOVE_COMPOSITION_ELEMENT = "chat_remove_composition_element",

  /**
   * Cancel editing the current message
   */
  CHAT_CANCEL_EDITING = "chat_cancel_editing",

  /**
   * Close the currently active modal
   */
  CLOSE_MODAL = "close_modal",

  /**
   * Close the currently floating element
   */
  CLOSE_FLOATING = "close_floating",

  /**
   * Close the open and ephemeral sidebar
   */
  CLOSE_SIDEBAR = "close_sidebar",

  /**
   * Global search
   */
  SEARCH = "search",
}

/**
 * Priority of actions relative to each other
 */
export const ACTION_PRIORITY: KeybindAction[] = [
  // 'Escape' bindings
  KeybindAction.CLOSE_FLOATING,
  KeybindAction.CLOSE_MODAL,
  KeybindAction.CLOSE_SIDEBAR,
  KeybindAction.CHAT_CANCEL_EDITING,
  KeybindAction.CHAT_REMOVE_COMPOSITION_ELEMENT,
  KeybindAction.CHAT_MARK_SERVER_AS_READ,
  KeybindAction.CHAT_JUMP_END,

  // Navigation conflicts
  KeybindAction.NAVIGATION_SERVER_UP,
  KeybindAction.NAVIGATION_SERVER_DOWN,
  KeybindAction.NAVIGATION_CHANNEL_UP,
  KeybindAction.NAVIGATION_CHANNEL_DOWN,

  // ... all others
  KeybindAction.SEARCH,
  KeybindAction.CHAT_FOCUS_COMPOSITION,
];

/**
 * Filter keybinds with special logic
 * @param keybind Keybind to filter
 * @param currentlyBound Other keybinds currently bound
 * @returns Whether to include this keybind
 */
export function keybindFilter(
  keybind: KeybindAction,
  activeKeys: ReactiveSet<string>,
  currentlyBound: Record<KeybindAction, number>,
  target: HTMLElement | null,
) {
  if (keybind === KeybindAction.CHAT_FOCUS_COMPOSITION) {
    // don't allow focusing if modal/floating is open
    // or if we're editing a message
    if (
      currentlyBound[KeybindAction.CLOSE_FLOATING] ||
      currentlyBound[KeybindAction.CLOSE_MODAL] ||
      currentlyBound[KeybindAction.CHAT_CANCEL_EDITING]
    )
      return false;

    // don't allow focusing if another input element is currently being typed into
    if (isTypingContext(target)) return false;

    // don't allow focusing if modifier key is pressed... except for paste
    if (
      (activeKeys.has("Control") || activeKeys.has("Meta")) &&
      !(activeKeys.has("v") || activeKeys.has("a"))
    )
      return false;
  }

  return true;
}

export function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.nodeName === "MDUI-TEXT-FIELD"
  );
}
