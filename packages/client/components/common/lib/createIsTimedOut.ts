import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from "solid-js";

/**
 * Reactively tracks whether a given `timeout` (a Date in the future) has
 * elapsed, without polling a clock signal.
 *
 * Instead of recomputing every second, this schedules a single timer that
 * fires exactly when the timeout expires, then flips. Safe to use in large
 * lists (e.g. one per member row) since idle entries do zero work.
 */
export function createIsTimedOut(
  timeout: Accessor<Date | null | undefined>,
): Accessor<boolean> {
  // bumped exactly once, right when the current timeout expires
  const [tick, setTick] = createSignal(0);

  createEffect(
    on(timeout, (t) => {
      if (!t) return;

      const ms = t.getTime() - Date.now();
      if (ms <= 0) return; // already expired, nothing to schedule

      const id = setTimeout(() => setTick((v) => v + 1), ms);
      onCleanup(() => clearTimeout(id));
    }),
  );

  const timedOut = createMemo(() => {
    tick(); // subscribe so we recompute exactly at expiry, and only then
    const t = timeout();
    return !!t && t.getTime() > Date.now();
  });

  return timedOut;
}
