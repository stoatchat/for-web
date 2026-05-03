import type { Accessor, JSX, Setter } from "solid-js";
import {
  Show,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";

import "mdui/components/snackbar.js";

export type SnackbarItem = {
  id: string;
  message: string;
  action?: string;
  closeable?: boolean;
  autoCloseDelay?: number;
  messageLine?: 1 | 2;
  placement?:
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end";
  onAction?: () => void;
  onClose?: () => void;
  closeOnAction?: boolean;
};

export type ShowSnackbarOptions = Omit<SnackbarItem, "id"> & {
  /**
   * Immediately replace the currently visible snackbar instead of queuing.
   * Use when the new message supersedes outdated information already on screen.
   */
  replaceActive?: boolean;
};

/**
 * Manages a queue of active snackbars
 */
export class SnackbarController {
  items: Accessor<SnackbarItem[]>;
  setItems: Setter<SnackbarItem[]>;

  constructor() {
    const [items, setItems] = createSignal<SnackbarItem[]>([]);
    this.items = items;
    this.setItems = setItems;

    this.show = this.show.bind(this);
    this.dismiss = this.dismiss.bind(this);
  }

  /**
   * Push a new snackbar onto the queue, or immediately replace the active one.
   * Snackbars with an action default to no auto-close; without an action they
   * default to 5 seconds.
   * @returns The id of the new snackbar
   */
  show(opts: ShowSnackbarOptions): string {
    const { replaceActive, ...rest } = opts;
    const id = Math.random().toString(36).slice(2);
    const autoCloseDelay = rest.autoCloseDelay ?? (rest.action ? 0 : 5000);
    const item: SnackbarItem = { ...rest, id, autoCloseDelay };

    if (replaceActive) {
      this.setItems((items) => [item, ...items.slice(1)]);
    } else {
      this.setItems((items) => [...items, item]);
    }

    return id;
  }

  /**
   * Remove a snackbar by id
   */
  dismiss(id: string): void {
    this.setItems((items) => items.filter((item) => item.id !== id));
  }
}

export const SnackbarContext = createContext<SnackbarController>();

/**
 * Access the nearest SnackbarController
 */
export function useSnackbar(): SnackbarController {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used inside SnackbarProvider");
  return ctx;
}

type ProviderProps = {
  controller: SnackbarController;
  children: JSX.Element;
};

/**
 * Provides snackbar context and renders the active snackbar into the floating portal.
 *
 * Position is controlled by the CSS custom property `--snackbar-offset-bottom`,
 * which shifts the snackbar upward via translateY. Default is 0px (flush with the
 * viewport bottom per mdui placement). Set it on `:root` to push above the chatbar:
 *
 * ```css
 * :root { --snackbar-offset-bottom: 80px; }
 * ```
 */
export function SnackbarProvider(props: ProviderProps) {
  return (
    <SnackbarContext.Provider value={props.controller}>
      {props.children}
      <Portal mount={document.getElementById("floating")!}>
        <Show when={props.controller.items()[0]} keyed>
          {(item) => (
            <Snackbar
              {...item}
              onClose={() => {
                item.onClose?.();
                props.controller.dismiss(item.id);
              }}
              onAction={() => item.onAction?.()}
            />
          )}
        </Show>
      </Portal>
    </SnackbarContext.Provider>
  );
}

type SnackbarProps = SnackbarItem & {
  onClose: () => void;
  onAction: () => void;
};

/**
 * Snackbars provide brief, non-intrusive feedback about an operation.
 *
 * @library MDUI
 * @specification https://m3.material.io/components/snackbar/overview
 */
function Snackbar(props: SnackbarProps) {
  let el: HTMLElement | undefined;

  // mdui only animates when `open` transitions false -> true, so start closed
  const [open, setOpen] = createSignal(false);

  onMount(() => {
    if (!el) return;

    // Dismiss from queue when the close animation starts
    el.addEventListener("close", props.onClose);

    el.addEventListener("action-click", () => {
      props.onAction();
      if (props.closeOnAction) {
        setOpen(false);
      }
    });

    // Let mdui commit the initial closed state before triggering the open
    // transition; without this both changes land in the same microtask and
    // mdui skips the enter animation.
    requestAnimationFrame(() => setOpen(true));
  });

  onCleanup(() => {
    if (!el) return;
    el.removeEventListener("close", props.onClose);
  });

  return (
    <mdui-snackbar
      ref={el}
      open={open()}
      placement={props.placement ?? "bottom"}
      action={props.action}
      closeable={props.closeable}
      auto-close-delay={props.autoCloseDelay}
      message-line={props.messageLine}
      style={{
        translate: "0 calc(-1 * var(--snackbar-offset-bottom, 80px))",
      }}
    >
      {props.message}
    </mdui-snackbar>
  );
}
