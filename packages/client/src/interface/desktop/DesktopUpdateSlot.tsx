import { Show } from "solid-js";

import { css } from "styled-system/css";

const slot = css({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
});

/**
 * Mount point for the desktop auto-update indicator (injected by Electron preload).
 */
export function DesktopUpdateSlot() {
  return (
    <Show when={!!window.native}>
      <div id="stoat-desktop-update-slot" class={slot} />
    </Show>
  );
}
