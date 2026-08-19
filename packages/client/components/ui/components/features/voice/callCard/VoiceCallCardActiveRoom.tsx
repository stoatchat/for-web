import { useLingui } from "@lingui/solid/macro";
import { createResizeObserver } from "@solid-primitives/resize-observer";
import { Track } from "livekit-client";
import { createEffect, For, onMount, Show } from "solid-js";
import { TrackLoop } from "solid-livekit-components";
import { styled } from "styled-system/jsx";

import { InRoom, useVoice } from "@revolt/rtc";
import { IconButton } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { scrollableStyles } from "@revolt/ui/directives";

import { ParticipantTile, tile } from "./ParticipantTile";
import { VoiceCallCardActions } from "./VoiceCallCardActions";
import { VoiceCallCardStatus } from "./VoiceCallCardStatus";

/**
 * Call card (active)
 */
export function VoiceCallCardActiveRoom() {
  const voice = useVoice();
  const fullscreen = () => voice.fullscreen();

  return (
    <View fullscreen={fullscreen()} class={fullscreen() ? "group" : undefined}>
      <Participants />
      <VoiceCallControls fullscreen={fullscreen()}>
        <VoiceCallControlHolder right>
          <VoiceCallVideoOnlyFilter />
          <VoiceCallFullscreen />
        </VoiceCallControlHolder>
        <VoiceCallCardActions size="sm" />
        <VoiceCallControlHolder left overflow>
          <VoiceCallCardStatus />
        </VoiceCallControlHolder>
      </VoiceCallControls>
    </View>
  );
}

function VoiceCallFullscreen() {
  const voice = useVoice();
  return (
    <IconButton
      size="sm"
      variant={"standard"}
      onPress={() => voice.toggleFullscreen()}
    >
      <Show when={voice.fullscreen()} fallback={<Symbol>fullscreen</Symbol>}>
        <Symbol>fullscreen_exit</Symbol>
      </Show>
    </IconButton>
  );
}

function VoiceCallVideoOnlyFilter() {
  const voice = useVoice();
  const { t } = useLingui();

  return (
    <IconButton
      size="sm"
      variant={voice.videoOnlyFilter() ? "filled" : "standard"}
      onPress={() => voice.toggleVideoOnlyFilter()}
      use:floating={{
        tooltip: {
          placement: "top",
          content: voice.videoOnlyFilter()
            ? t`Show all participants`
            : t`Show video only`,
        },
      }}
    >
      <Show when={voice.videoOnlyFilter()} fallback={<Symbol>groups</Symbol>}>
        <Symbol>video_camera_front</Symbol>
      </Show>
    </IconButton>
  );
}

const TILE_MIN_WIDTH = "250px",
  TILE_MIN_FOCUS_HEIGHT = "100px";

/**
 * Show a grid of participants
 */
function Participants() {
  const voice = useVoice();
  const { t } = useLingui();

  // Modify this value to get test tracks
  const testTrackCount = 0;

  let callRef: HTMLDivElement | undefined;

  const tileWidth = () => {
    const count = Math.max(voice.visibleVidTracks().length + testTrackCount, 1);
    const vidWidth = Math.round(100 / count);
    return `max(${TILE_MIN_WIDTH}, ${vidWidth}% - var(--gap-md))`;
  };

  // Clear focus when the focused track is no longer visible.
  createEffect(() => {
    voice.videoOnlyFilter();
    const focus = voice.focusTrack();
    if (focus && !voice.visibleVidTracks().some((t) => voice.isFocus(t))) {
      voice.toggleFocus();
    }
  });

  // Clear stale focus when focusId points at a track that no longer exists.
  createEffect(() => {
    if (voice.focusId() && !voice.focusTrack()) {
      voice.toggleFocus();
    }
  });

  onMount(() => {
    createResizeObserver(callRef, ({ width, height }, el) => {
      if (el === callRef) {
        el.style.setProperty("--vc-w", `${width}px`);
        el.style.setProperty("--vc-h", `${height}px`);
      }
    });
  });

  return (
    <Call
      ref={callRef}
      fullscreen={voice.fullscreen()}
      class={voice.focusId() ? "" : scrollableStyles()}
    >
      <InRoom>
        <FocusedParticipant />
        <Show when={voice.stoppedScreenShareTrack() && !voice.focusId()}>
          <ShowBarButtonHolder>
            <IconButton
              size="xs"
              variant={"tonal"}
              onPress={() => {
                const track = voice.stoppedScreenShareTrack();
                if (track) voice.resumeWatching(track);
              }}
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Resume watching`,
                },
              }}
            >
              <Symbol>play_circle</Symbol>
            </IconButton>
          </ShowBarButtonHolder>
        </Show>
        <Show when={voice.focusId()}>
          <ShowBarButtonHolder>
            <div
              style={{
                "margin-bottom": "10px",
                display: "flex",
                gap: "var(--gap-sm)",
              }}
            >
              <Show
                when={voice.focusTrack()?.source === Track.Source.ScreenShare}
              >
                <IconButton
                  size="xs"
                  variant={"tonal"}
                  onPress={() => voice.stopWatchingLive()}
                  use:floating={{
                    tooltip: {
                      placement: "top",
                      content: t`Stop watching`,
                    },
                  }}
                >
                  <Symbol>stop_screen_share</Symbol>
                </IconButton>
              </Show>
              <IconButton
                size="xs"
                variant={"tonal"}
                onPress={() => voice.toggleShowBar()}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: voice.showBar() ? t`Hide Others` : t`Show Others`,
                  },
                }}
              >
                <Show
                  when={voice.showBar()}
                  fallback={<Symbol>keyboard_arrow_up</Symbol>}
                >
                  <Symbol>keyboard_arrow_down</Symbol>
                </Show>
              </IconButton>
            </div>
          </ShowBarButtonHolder>
        </Show>
        <Grid
          focus={!!voice.focusId()}
          fullscreen={voice.fullscreen()}
          show={!voice.focusId() || voice.showBar()}
          class={voice.focusId() ? scrollableStyles({ direction: "x" }) : ""}
          style={{ "--vc-tile-width": tileWidth() }}
        >
          <TrackLoop
            tracks={() =>
              voice.visibleVidTracks().filter((t) => !voice.isFocus(t))
            }
          >
            {() => <ParticipantTile />}
          </TrackLoop>
          <For each={Array(testTrackCount)}>
            {() => (
              <div
                class={tile({ fullscreen: voice.fullscreen() }) + " vc_tile"}
              />
            )}
          </For>
        </Grid>
      </InRoom>
    </Call>
  );
}

function FocusedParticipant() {
  const voice = useVoice();

  return (
    <Show when={voice.focusTrack()}>
      <TrackLoop tracks={() => [voice.focusTrack()!]}>
        {() => (
          <FocusBox>
            <ParticipantTile focus />
          </FocusBox>
        )}
      </TrackLoop>
    </Show>
  );
}

const View = styled("div", {
  base: {
    minHeight: 0,
    height: "100%",
    width: "100%",

    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
  },
  variants: {
    fullscreen: {
      true: {
        position: "relative",
        gap: 0,
        padding: 0,
      },
    },
  },
});

const VoiceCallControls = styled("div", {
  base: {
    display: "flex",
    flexShrink: "0",
    overflow: "hidden",
    flexDirection: "row-reverse",
  },
  variants: {
    fullscreen: {
      true: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        opacity: 1,
        transition: "opacity 0.25s ease",
        pointerEvents: "auto",
        background:
          "linear-gradient(transparent, color-mix(in srgb, var(--md-sys-color-scrim) 55%, transparent))",
        paddingTop: "var(--gap-xl)",

        "@media (hover: hover)": {
          opacity: 0,
          pointerEvents: "none",

          _groupHover: {
            opacity: 1,
            pointerEvents: "auto",
          },
        },
      },
    },
  },
});

const VoiceCallControlHolder = styled("div", {
  base: {
    display: "flex",
    flex: "1",
    alignSelf: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
  },
  variants: {
    right: {
      true: {
        justifyContent: "flex-end",
      },
    },
    empty: {
      true: {
        gap: "0px",
        padding: "0px",
      },
    },
    left: {
      true: {
        justifyContent: "flex-start",
      },
    },
    overflow: {
      true: {
        overflow: "hidden",
      },
    },
  },
});

const ShowBarButtonHolder = styled("div", {
  base: {
    height: "0px",
    alignSelf: "center",
    overflow: "visible",
    display: "flex",
    flexDirection: "column-reverse",
  },
});

const Call = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    flexGrow: 1,
    minHeight: 0,
  },
  variants: {
    fullscreen: {
      true: {
        flex: 1,
        gap: 0,
      },
    },
  },
});

const Grid = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "safe center",
    alignContent: "safe center",
    minHeight: "100%",
    gap: "var(--gap-md)",
  },

  variants: {
    focus: {
      true: {
        flexDirection: "column",
        height: `max(20%, ${TILE_MIN_FOCUS_HEIGHT})`,
        minHeight: 0,
        transition: "height .3s ease",

        "& .vc_tile": {
          width: "auto",
          height: "100%",
        },
      },
    },
    fullscreen: {
      true: {
        gap: 0,
        minHeight: "100%",
      },
    },
    show: {
      false: {
        height: 0,
      },
    },
  },
});

const FocusBox = styled("div", {
  base: {
    height: 0,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    margin: "0 auto",
  },
});
