import { Show } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";

import { useState } from "@revolt/state";

import { Symbol } from "../../utils/Symbol";

/**
 * Component that shows user voice status icons populated with client state
 */
export function VoiceStatefulUserIcons(props: {
  userId: string;
  muted?: boolean;
  deafened?: boolean;
  camera?: boolean;
  screenshare?: boolean;
}) {
  const { t } = useLingui();
  const state = useState();

  const isMuted = () =>
    state.voice.getUserMuted(props.userId) ? "by-user" : props.muted || false;

  return (
    <>
      <Show when={isMuted()}>
        <Symbol
          size={16}
          color={
            isMuted() === "by-user" ? "var(--md-sys-color-error)" : undefined
          }
          use:floating={{
            tooltip:
              isMuted() === "by-user"
                ? {
                    placement: "top",
                    content: t`You muted this user.`,
                  }
                : undefined,
          }}
        >
          mic_off
        </Symbol>
      </Show>
      <Show when={props.deafened}>
        <Symbol size={16}>headset_off</Symbol>
      </Show>
      <Show when={props.camera}>
        <Symbol size={16}>camera_video</Symbol>
      </Show>
      <Show when={props.screenshare}>
        <Symbol size={16}>screen_share</Symbol>
      </Show>
    </>
  );
}
