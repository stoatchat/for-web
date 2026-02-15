import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { Settings, SettingsConfigurations } from "@revolt/app";
import { DialogProps } from "@revolt/ui";

import { styled } from "styled-system/jsx";
import { Modals } from "../types";

/**
 * Modal to display server information
 */
export function SettingsModal(
  props: DialogProps & Modals & { type: "settings" },
) {
  // eslint-disable-next-line solid/reactivity
  const config = SettingsConfigurations[props.config];

  return (
    <Portal mount={document.getElementById("floating")!}>
      <div
        style={{
          "z-index": 100,
          position: "fixed",
          width: "100%",
          height: "100vh",
          left: 0,
          top: 0,
          "pointer-events": "none",
        }}
      >
        <Presence>
          <Show when={props?.show}>
            <Base
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{
                duration: 0.3,
                easing: [0.17, 0.67, 0.58, 0.98],
              }}
            >
              <Settings
                onClose={props.onClose}
                render={config.render}
                title={config.title}
                list={config.list}
                context={props.context as never}
              />
            </Base>
          </Show>
        </Presence>
      </div>
    </Portal>
  );
}

const Base = styled(Motion.div, {
  base: {
    height: "100%",
    pointerEvents: "all",
    display: "flex",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-highest)",

    //Tablet view
    "& .setMobileBack": { display: "none" },
    "@media (max-width: 800px)": {
      "& .setCont": { padding: "12px" },
      "& .setSidebar": { padding: "12px 0" },
      "& .setClose": { display: "none" },
      "& .setMobileBack": { display: "flex" },
    },
  },
});
