import { useNavigate } from "@solidjs/router";
import { Show } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { CONFIGURATION } from "@revolt/common";
import { useVoice } from "@revolt/rtc";
import { Button, IconButton } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

export function VoiceCallCardActions(props: { size: "xs" | "sm" }) {
  const voice = useVoice();
  const navigate = useNavigate();
  const { t } = useLingui();

  //TODO For changes in PR #999
  const enableVideo = CONFIGURATION.ENABLE_VIDEO;

  return (
    <Actions>
      <Show when={props.size === "xs"}>
        <IconButton
          variant="standard"
          size={props.size}
          onPress={() => {
            navigate(voice.channel()?.path ?? "");
            //TODO For change in PR #835
            //state.appDrawer()?.setShown(true);
          }}
          use:floating={{
            tooltip: {
              placement: "top",
              content: t`Return to voice channel`,
            },
          }}
        >
          <Symbol>arrow_top_left</Symbol>
        </IconButton>
      </Show>
      <IconButton
        size={props.size}
        variant={voice.microphone() ? "filled" : "tonal"}
        onPress={() => voice.toggleMute()}
        use:floating={{
          tooltip: {
            placement: "top",
            content: voice.speakingPermission
              ? voice.microphone()
                ? t`Unmute`
                : t`Mute`
              : t`Missing permission`,
          },
        }}
        isDisabled={!voice.speakingPermission}
      >
        <Show when={voice.microphone()} fallback={<Symbol>mic_off</Symbol>}>
          <Symbol>mic</Symbol>
        </Show>
      </IconButton>
      <IconButton
        size={props.size}
        variant={voice.deafen() || !voice.listenPermission ? "tonal" : "filled"}
        onPress={() => voice.toggleDeafen()}
        use:floating={{
          tooltip: {
            placement: "top",
            content: voice.listenPermission
              ? voice.deafen()
                ? t`Listen`
                : t`Defean`
              : t`Missing permission`,
          },
        }}
        isDisabled={!voice.listenPermission}
      >
        <Show
          when={voice.deafen() || !voice.listenPermission}
          fallback={<Symbol>headset</Symbol>}
        >
          <Symbol>headset_off</Symbol>
        </Show>
      </IconButton>
      <IconButton
        size={props.size}
        variant={enableVideo && voice.video() ? "filled" : "tonal"}
        onPress={() => {
          if (enableVideo) voice.toggleCamera();
        }}
        use:floating={{
          tooltip: {
            placement: "top",
            content: enableVideo
              ? voice.video()
                ? t`Stop camera`
                : t`Start camera`
              : t`Coming soon! 👀`,
          },
        }}
        isDisabled={!enableVideo}
      >
        <Symbol>camera_video</Symbol>
      </IconButton>
      <IconButton
        size={props.size}
        variant={enableVideo && voice.screenshare() ? "filled" : "tonal"}
        onPress={() => {
          if (enableVideo) voice.toggleScreenshare();
        }}
        use:floating={{
          tooltip: {
            placement: "top",
            content: enableVideo
              ? voice.screenshare()
                ? t`Stop sharing`
                : t`Share screen`
              : t`Coming soon! 👀`,
          },
        }}
        isDisabled={!enableVideo}
      >
        <Show
          when={!enableVideo || voice.screenshare()}
          fallback={<Symbol>stop_screen_share</Symbol>}
        >
          <Symbol>screen_share</Symbol>
        </Show>
      </IconButton>
      <Button
        size={props.size}
        variant="_error"
        onPress={() => voice.disconnect()}
        use:floating={{
          tooltip: {
            placement: "top",
            content: t`End call`,
          },
        }}
      >
        <Symbol>call_end</Symbol>
      </Button>
    </Actions>
  );
}

const Actions = styled("div", {
  base: {
    flexShrink: 0,
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    zIndex: 2,

    display: "flex",
    width: "fit-content",
    justifyContent: "center",
    alignSelf: "center",

    borderRadius: "var(--borderRadius-full)",
    background: "var(--md-sys-color-surface-container)",
  },
});
