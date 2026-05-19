import { KeybindAction } from "./keybindActions";

/**
 * Sequences are a set of keys that must be pressed at the same time
 */
export const DEFAULT_SEQUENCES: Record<KeybindAction, (string | RegExp)[]> = {
  [KeybindAction.NAVIGATION_CHANNEL_UP]: ["Alt", "ArrowDown"],
  [KeybindAction.NAVIGATION_CHANNEL_DOWN]: ["Alt", "ArrowDown"],
  [KeybindAction.NAVIGATION_SERVER_UP]: ["Control", "Alt", "ArrowUp"],
  [KeybindAction.NAVIGATION_SERVER_DOWN]: ["Control", "Alt", "ArrowDown"],
  [KeybindAction.CHAT_JUMP_END]: ["Escape"],
  [KeybindAction.CHAT_MARK_SERVER_AS_READ]: ["Shift", "Escape"],
  [KeybindAction.CHAT_FOCUS_COMPOSITION]: [/^[^ ]$/],
  [KeybindAction.CHAT_REMOVE_COMPOSITION_ELEMENT]: ["Escape"],
  [KeybindAction.CHAT_CANCEL_EDITING]: ["Escape"],
  [KeybindAction.CLOSE_MODAL]: ["Escape"],
  [KeybindAction.CLOSE_FLOATING]: ["Escape"],
  [KeybindAction.CLOSE_SIDEBAR]: ["Escape"],
};

/**
 * Sequences are a set of keys that must be pressed at the same time
 * (macOS version)
 */
export const DEFAULT_MAC_SEQUENCES: Record<KeybindAction, (string | RegExp)[]> =
  {
    [KeybindAction.NAVIGATION_CHANNEL_UP]: ["Alt" /* Command */, "ArrowUp"],
    [KeybindAction.NAVIGATION_CHANNEL_DOWN]: ["Alt" /* Command */, "ArrowDown"],
    [KeybindAction.NAVIGATION_SERVER_UP]: [
      "Control",
      "Alt" /* Command */,
      "ArrowUp",
    ],
    [KeybindAction.NAVIGATION_SERVER_DOWN]: [
      "Control",
      "Alt" /* Command */,
      "ArrowDown",
    ],
    [KeybindAction.CHAT_JUMP_END]: ["Escape"],
    [KeybindAction.CHAT_MARK_SERVER_AS_READ]: ["Shift", "Escape"],
    [KeybindAction.CHAT_FOCUS_COMPOSITION]: [/^[^ ]$/],
    [KeybindAction.CHAT_REMOVE_COMPOSITION_ELEMENT]: ["Escape"],
    [KeybindAction.CHAT_CANCEL_EDITING]: ["Escape"],
    [KeybindAction.CLOSE_MODAL]: ["Escape"],
    [KeybindAction.CLOSE_FLOATING]: ["Escape"],
    [KeybindAction.CLOSE_SIDEBAR]: ["Escape"],
  };
