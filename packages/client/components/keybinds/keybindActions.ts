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
   * Quick Switch
   */
  QUICK_SWITCH = "quick_switch",
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
  KeybindAction.QUICK_SWITCH,
  KeybindAction.CHAT_FOCUS_COMPOSITION,
];

export type KeybindEvent = Pick<
  KeyboardEvent,
  "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "target"
>;

export function normalizeKey(key: string) {
  return key.length === 1 ? key.toLowerCase() : key;
}

export function matchesSequence(
  sequence: (string | RegExp)[],
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"
  >,
) {
  const key = normalizeKey(event.key);
  return sequence.every((part) => {
    if (part instanceof RegExp) return part.test(key);
    switch (part) {
      case "Control":
        return event.ctrlKey;
      case "Meta":
        return event.metaKey;
      case "Alt":
        return event.altKey;
      case "Shift":
        return event.shiftKey;
      default:
        return key === part;
    }
  });
}

/**
 * Filter keybinds with special logic
 * @param keybind Keybind to filter
 * @param event Keyboard event
 * @param key Normalized event key
 * @param isBound Check whether a keybind is currently bound
 * @param target Event target
 * @returns Whether to include this keybind
 */
export function keybindFilter(
  keybind: KeybindAction,
  event: Pick<KeyboardEvent, "ctrlKey" | "metaKey">,
  key: string,
  isBound: (action: KeybindAction) => boolean,
  target: EventTarget | null,
) {
  if (keybind === KeybindAction.CHAT_FOCUS_COMPOSITION) {
    // don't allow focusing if modal/floating is open
    // or if we're editing a message
    if (
      isBound(KeybindAction.CLOSE_FLOATING) ||
      isBound(KeybindAction.CLOSE_MODAL) ||
      isBound(KeybindAction.CHAT_CANCEL_EDITING)
    )
      return false;

    // don't allow focusing if another input element is currently being typed into
    if (isTypingContext(target)) return false;

    // don't allow focusing if modifier key is pressed... except for paste
    if ((event.ctrlKey || event.metaKey) && key !== "v" && key !== "a")
      return false;
  }

  return true;
}

/**
 * Resolve the highest-priority bound keybind matching the given keyboard event
 */
export function resolveKeybind(
  event: KeybindEvent,
  sequences: Record<KeybindAction, (string | RegExp)[]>,
  isBound: (action: KeybindAction) => boolean,
): KeybindAction | undefined {
  if (!event.key) return undefined;

  const target = event.target;
  const isInput = isTypingContext(target);
  const key = normalizeKey(event.key);

  return ACTION_PRIORITY.find((keybind) => {
    if (!isBound(keybind)) return false;
    if (!keybindFilter(keybind, event, key, isBound, target)) return false;

    // prevent standard character keybinds from firing inside inputs
    if (
      isInput &&
      !sequences[keybind].some(
        (k) =>
          k === "Control" ||
          k === "Meta" ||
          k === "Alt" ||
          k === "Escape" ||
          k === "Enter",
      )
    ) {
      return false;
    }

    return matchesSequence(sequences[keybind], event);
  });
}

export function isTypingContext(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement))
    return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.nodeName === "MDUI-TEXT-FIELD"
  );
}
