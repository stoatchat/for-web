import { Trans } from "@lingui-solid/solid/macro";
import { Column } from "@revolt/ui";
import { Show } from "solid-js";
import { css } from "styled-system/css/css";
//import { KeybindVoiceToggle } from "./KeybindVoiceToggle";
import { NavigationKeybinds } from "./Navigation";

export function KeybindSettings() {
  return (
    <Column gap="lg">
      <Show when={!window.native}>
        <small class={css({ opacity: 0.6 })}>
          <Trans>
            Keyboard shortcuts work in the browser, but only while Stoat is
            active and focused.
            {/*             <br />
            To use them when Stoat is in the background and customise them,
            <a
              class={css({ color: "var(--md-sys-color-primary)" })}
              href="https://stoat.chat/download"
            >
              {" "}
              Download{" "}
            </a>
            Stoat for desktop. */}
          </Trans>
        </small>
      </Show>
      {/* <KeybindVoiceToggle /> */}
      <NavigationKeybinds />
    </Column>
  );
}
