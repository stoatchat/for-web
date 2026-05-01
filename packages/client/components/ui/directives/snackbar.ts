import { type Accessor, type JSX, onCleanup } from "solid-js";

import { useSnackbar } from "../components/design/Snackbar";

type Props = JSX.Directives["snackbar"] & object;

/**
 * Show a snackbar when the host element fires a trigger event.
 *
 * ```tsx
 * <button use:snackbar={{ message: "Copied!" }}>Copy</button>
 * ```
 */
export function snackbar(element: HTMLElement, accessor: Accessor<Props>) {
  const config = accessor();
  if (!config) return;

  const controller = useSnackbar();
  const trigger = config.trigger ?? "click";

  function handler() {
    const { message, action } = accessor();
    controller.show({ message, action });
  }

  element.addEventListener(trigger, handler);
  onCleanup(() => element.removeEventListener(trigger, handler));
}
