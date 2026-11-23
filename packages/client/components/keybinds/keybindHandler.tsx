import {
  type JSXElement,
  createContext,
  createEffect,
  onCleanup,
  useContext,
} from "solid-js";

import {
  ACTION_PRIORITY,
  KeybindAction,
  resolveKeybind,
} from "./keybindActions";
import { DEFAULT_MAC_SEQUENCES, DEFAULT_SEQUENCES } from "./keybindSequences";

type KeybindContext = {
  createKeybind: (keybind: KeybindAction, callback: () => void) => void;
};

const keybindContext = createContext<KeybindContext>(null! as KeybindContext);

/**
 * Keybinds whose browser default must be suppressed
 * (e.g. Ctrl+K focuses the address/search bar in Firefox)
 */
const PREVENT_DEFAULT = new Set<KeybindAction>([KeybindAction.QUICK_SWITCH]);

export function KeybindContext(props: { children: JSXElement }) {
  /**
   * Keep track of active callbacks for each keybind action
   */
  const listeners = ACTION_PRIORITY.reduce(
    (d, k) => ({ ...d, [k]: new Set<{ callback: () => void }>() }),
    {} as Record<KeybindAction, Set<{ callback: () => void }>>,
  );

  const isBound = (action: KeybindAction) => listeners[action].size > 0;

  /**
   * Sequences for use
   */
  const sequences = navigator.platform.startsWith("Mac")
    ? DEFAULT_MAC_SEQUENCES
    : DEFAULT_SEQUENCES;

  /**
   * Handle key down event by resolving and firing the highest-priority matching keybind
   */
  function onKeyDown(event: KeyboardEvent) {
    const fired = resolveKeybind(event, sequences, isBound);
    if (!fired) return;

    if (PREVENT_DEFAULT.has(fired)) {
      event.preventDefault();
    }

    if (event.repeat) return;

    if (import.meta.env.DEV) {
      console.debug("[keybinds] Fired", fired, {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
      });
    }

    for (const entry of [...listeners[fired]]) {
      if (listeners[fired].has(entry)) {
        entry.callback();
      }
    }
  }

  document.body.addEventListener("keydown", onKeyDown);

  onCleanup(() => {
    document.body.removeEventListener("keydown", onKeyDown);
  });

  return (
    <keybindContext.Provider
      value={{
        createKeybind(keybind, callback) {
          const entry = { callback };
          listeners[keybind].add(entry);
          onCleanup(() => listeners[keybind].delete(entry));
        },
      }}
    >
      {props.children}
    </keybindContext.Provider>
  );
}

/**
 * Wrapper for contextual createKeybind function
 * @param keybind Keybind
 * @param callback Callback
 */
export function createKeybind(keybind: KeybindAction, callback: () => void) {
  const { createKeybind } = useContext(keybindContext);
  createKeybind(keybind, callback);
}

/**
 * Declarative keybind component
 */
export function Keybind(props: {
  keybind: KeybindAction;
  onPressed: () => void;
}) {
  createEffect(() => createKeybind(props.keybind, props.onPressed));
  return null;
}
