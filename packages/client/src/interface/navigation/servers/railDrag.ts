import { createSignal, onCleanup } from "solid-js";

import { useLingui } from "@lingui/solid/macro";

/**
 * How far the pointer must travel before a press turns into a drag, so that
 * clicking a server still navigates to it
 */
const DRAG_THRESHOLD_PX = 5;

/**
 * Portion of an entry, measured from its middle, which folds rather than
 * reorders when you drop on it
 */
const FOLD_BAND = 0.5;

export type RailEntry = {
  id: string;

  /**
   * Folders can be reordered but not folded into one another
   */
  kind: "server" | "folder";

  /**
   * Folder this entry sits inside, when it is a member of an expanded one
   */
  parent?: string;
};

/**
 * How far to the side of the rail the pointer has to go before a drop is
 * treated as "somewhere else" and abandoned
 */
const CANCEL_MARGIN_PX = 80;

export type RailIntent =
  | { type: "fold"; target: string }
  | {
      type: "move";

      /**
       * Entry the dragged one would land in front of, or the end of the list
       */
      before: string | undefined;

      /**
       * Folder it would land inside, if any
       */
      parent: string | undefined;
    };

/**
 * Drag handling for the server rail
 *
 * The rail deliberately does not rearrange itself while you drag: entries stay
 * where they are and an indicator shows where the drop will land. That is what
 * makes dropping *onto* an entry possible at all, since an entry which steps
 * out of the way as you approach can never be a target.
 */
export function createRailDrag(options: {
  entries: () => RailEntry[];
  container: () => HTMLElement | undefined;
  disabled?: () => boolean;
  /**
   * Name to read out when announcing what is being moved
   */
  label?: (id: string) => string | undefined;
  onFold: (target: string, incoming: string) => void;
  onMove: (
    moved: string,
    before: string | undefined,
    parent: string | undefined,
  ) => void;
}) {
  const { t } = useLingui();

  const elements = new Map<string, HTMLElement>();

  const [dragging, setDragging] = createSignal<string>();
  const [carrying, setCarrying] = createSignal<string>();
  const [status, setStatus] = createSignal("");
  const [intent, setIntent] = createSignal<RailIntent>();
  const [pointer, setPointer] = createSignal<{ x: number; y: number }>();

  let armed: { id: string; x: number; y: number } | undefined;

  /**
   * Work out what dropping at the given position would do
   *
   * Boxes are measured fresh each time so that scrolling the rail mid-drag
   * doesn't leave us aiming at where things used to be.
   * @param y Pointer position
   * @param held Entry being dragged
   */
  function intentAt(
    x: number,
    y: number,
    held: string,
  ): RailIntent | undefined {
    const rail = options.container()?.getBoundingClientRect();
    if (
      rail &&
      (x < rail.left - CANCEL_MARGIN_PX || x > rail.right + CANCEL_MARGIN_PX)
    ) {
      return undefined;
    }

    const source = options.entries().find((entry) => entry.id === held);

    const boxes = options
      .entries()
      .map((entry) => ({ entry, el: elements.get(entry.id) }))
      .filter((row): row is { entry: RailEntry; el: HTMLElement } => !!row.el)
      .map((row) => ({ ...row, rect: row.el.getBoundingClientRect() }));

    if (!boxes.length)
      return { type: "move", before: undefined, parent: undefined };

    // a folder can be moved around the list but never into anything
    const canFold = source?.kind === "server";
    const canNest = source?.kind === "server";

    /**
     * Work out what landing in front of the given position means
     * @param index Position within the visible list
     */
    const insertAt = (index: number): RailIntent => {
      let neighbour = boxes[index];

      // a folder dropped among another folder's servers belongs after them
      while (neighbour && !canNest && neighbour.entry.parent) {
        neighbour = boxes[boxes.indexOf(neighbour) + 1];
      }

      return {
        type: "move",
        before: neighbour?.entry.id,
        parent: neighbour?.entry.parent,
      };
    };

    for (const [index, { entry, rect }] of boxes.entries()) {
      if (y < rect.top || y > rect.bottom) continue;

      const offset = (y - rect.top) / rect.height;

      // the middle of an entry folds, the edges insert either side of it;
      // servers already inside a folder are only ever reordered
      if (
        entry.id !== held &&
        canFold &&
        !entry.parent &&
        Math.abs(offset - 0.5) < FOLD_BAND / 2
      ) {
        return { type: "fold", target: entry.id };
      }

      return insertAt(offset >= 0.5 ? index + 1 : index);
    }

    // above the first entry, or below the last
    return y < boxes[0].rect.top
      ? insertAt(0)
      : { type: "move", before: undefined, parent: undefined };
  }

  /**
   * Finish the drag, applying whatever the indicator was promising
   */
  function drop() {
    const held = dragging();
    const landed = intent();

    reset();

    if (!held || !landed) return;

    if (landed.type === "fold") {
      if (landed.target !== held) options.onFold(landed.target, held);
      return;
    }

    const source = options.entries().find((entry) => entry.id === held);

    // dropping something back exactly where it came from isn't a move
    if (
      landed.parent === source?.parent &&
      (landed.before === held || sitsBefore(held, landed.before))
    ) {
      return;
    }

    options.onMove(held, landed.before, landed.parent);
  }

  /**
   * Whether the entry already sits directly in front of the given one
   * @param id Entry
   * @param before Entry it would land in front of
   */
  function sitsBefore(id: string, before: string | undefined) {
    const ids = options.entries().map((entry) => entry.id);
    const at = ids.indexOf(id);

    return before === undefined
      ? at === ids.length - 1
      : ids[at + 1] === before;
  }

  /**
   * Entries which sit alongside the given one, ie. the list it can move within
   * @param parent Folder the entries belong to, if any
   */
  function siblings(parent: string | undefined) {
    return options.entries().filter((entry) => entry.parent === parent);
  }

  /**
   * Announce something to anyone listening
   * @param message Message
   */
  function announce(message: string) {
    setStatus(message);
  }

  /**
   * Describe an entry for an announcement
   * @param id Entry id
   */
  function name(id: string) {
    return options.label?.(id) ?? t`Server`;
  }

  /**
   * Put focus back on an entry once the list has redrawn around it
   * @param id Entry id
   */
  function refocus(id: string) {
    requestAnimationFrame(() => {
      const el = elements.get(id);
      const focusable = el?.querySelector<HTMLElement>("a, button") ?? el;
      focusable?.focus();
    });
  }

  /**
   * Move an entry one place within the list it belongs to
   * @param id Entry id
   * @param direction Whether to move it up or down
   */
  function shift(id: string, direction: -1 | 1) {
    const parent = options.entries().find((entry) => entry.id === id)?.parent;
    const list = siblings(parent);
    const at = list.findIndex((entry) => entry.id === id);

    const to = at + direction;
    if (at === -1 || to < 0 || to >= list.length) {
      announce(
        direction < 0
          ? t`${name(id)} is already at the top`
          : t`${name(id)} is already at the bottom`,
      );
      return;
    }

    // moving down means landing in front of whatever follows the entry we
    // are stepping over, which may be the end of the list
    const before = direction < 0 ? list[to].id : list[to + 1]?.id;

    options.onMove(id, before, parent);
    announce(t`${name(id)} moved to position ${to + 1} of ${list.length}`);
    refocus(id);
  }

  function reset() {
    armed = undefined;
    setDragging(undefined);
    setIntent(undefined);
    setPointer(undefined);
  }

  function onPointerMove(e: PointerEvent) {
    if (armed && !dragging()) {
      if (
        Math.hypot(e.clientX - armed.x, e.clientY - armed.y) < DRAG_THRESHOLD_PX
      )
        return;

      setDragging(armed.id);
    }

    const held = dragging();
    if (!held) return;

    e.preventDefault();
    setPointer({ x: e.clientX, y: e.clientY });
    setIntent(intentAt(e.clientX, e.clientY, held));
  }

  function onPointerUp() {
    if (dragging()) {
      // the icon is a link, and letting go over it would otherwise navigate
      window.addEventListener("click", swallowClick, { capture: true });
      drop();
    } else {
      reset();
    }
  }

  /**
   * Eat the click which follows the pointer release that ended a drag
   * @param e Click event
   */
  function swallowClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener("click", swallowClick, { capture: true });
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && dragging()) {
      e.preventDefault();
      reset();
    }
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);

  onCleanup(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("keydown", onKeyDown);
  });

  return {
    /**
     * Entry currently being dragged, if any
     */
    dragging,

    /**
     * Entry picked up with the keyboard, if any
     */
    carrying,

    /**
     * Running commentary for a live region
     */
    status,

    /**
     * Handle a key press on an entry, giving keyboard users a way to reorder
     * @param id Entry id
     * @param e Keyboard event
     */
    keys(id: string, e: KeyboardEvent) {
      if (options.disabled?.()) return;

      const held = carrying();

      if (e.key === " ") {
        e.preventDefault();

        if (held === id) {
          setCarrying(undefined);
          announce(t`${name(id)} dropped`);
        } else {
          setCarrying(id);
          announce(
            t`${name(id)} picked up, use the arrow keys to move it and space to drop it`,
          );
        }

        return;
      }

      if (held !== id) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setCarrying(undefined);
        announce(t`${name(id)} dropped`);
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        shift(id, e.key === "ArrowUp" ? -1 : 1);
      }
    },

    /**
     * What dropping right now would do
     */
    intent,

    /**
     * Where the dragged entry should be drawn
     */
    pointer,

    /**
     * Track an entry's element so it can be measured
     * @param id Entry id
     * @param el Element
     */
    register(id: string, el: HTMLElement) {
      elements.set(id, el);
      onCleanup(() => elements.delete(id));
    },

    /**
     * Begin watching for a drag on the given entry
     * @param id Entry id
     * @param e Pointer event
     */
    press(id: string, e: PointerEvent) {
      if (options.disabled?.() || e.button) return;

      armed = { id, x: e.clientX, y: e.clientY };
    },
  };
}
