import { useLingui } from "@lingui/solid/macro";
import { createResizeObserver } from "@solid-primitives/resize-observer";
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
export function VoiceCallCardActiveRoom(props: { collapsed?: boolean }) {
  return (
    <View collapsed={props.collapsed}>
      <ParticipantsWrapper collapsed={props.collapsed}>
        <Participants />
      </ParticipantsWrapper>
      <VoiceCallControls>
        <VoiceCallControlHolder left collapsed={props.collapsed}>
          <VoiceCallCardStatus />
        </VoiceCallControlHolder>
        <VoiceCallCardActions size="sm" compact={props.collapsed} />
        <VoiceCallControlHolder right collapsed={props.collapsed}>
          <VoiceCallCollapseButton />
          <VoiceCallExpandButton />
          <VoiceCallFullscreen />
        </VoiceCallControlHolder>
      </VoiceCallControls>
    </View>
  );
}

function VoiceCallCollapseButton() {
  const voice = useVoice();
  const { t } = useLingui();

  return (
    <DesktopOnly>
      <IconButton
        size="sm"
        variant="standard"
        onPress={() => voice.toggleCollapsed()}
        use:floating={{
          tooltip: {
            placement: "top",
            content: t`Collapse call window`,
          },
        }}
      >
        <Symbol>unfold_less</Symbol>
      </IconButton>
    </DesktopOnly>
  );
}

function VoiceCallExpandButton() {
  const voice = useVoice();
  const { t } = useLingui();

  return (
    <DesktopOnly>
      <IconButton
        size="sm"
        variant="standard"
        onPress={() => voice.toggleExpanded()}
        use:floating={{
          tooltip: {
            placement: "top",
            content: voice.expanded()
              ? t`Restore call window`
              : t`Maximize call window`,
          },
        }}
      >
        <Show when={voice.expanded()} fallback={<Symbol>open_in_full</Symbol>}>
          <Symbol>close_fullscreen</Symbol>
        </Show>
      </IconButton>
    </DesktopOnly>
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
    const vidWidth = Math.round(
      100 / (voice.vidTracks().length + testTrackCount),
    );
    return `max(${TILE_MIN_WIDTH}, ${vidWidth}% - var(--gap-md))`;
  };

  // Clear out any focus when the track that was focused is no longer available.
  createEffect(() => {
    if (!voice.focusTrack()) voice.toggleFocus();
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
    <Call ref={callRef} class={voice.focusId() ? "" : scrollableStyles()}>
      <InRoom>
        <FocusedParticipant />
        <Show when={voice.focusId()}>
          <ShowBarButtonHolder>
            <div style={{ "margin-bottom": "10px" }}>
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
          show={voice.showBar()}
          class={voice.focusId() ? scrollableStyles({ direction: "x" }) : ""}
          style={{ "--vc-tile-width": tileWidth() }}
        >
          <TrackLoop
            tracks={() => voice.vidTracks().filter((t) => !voice.isFocus(t))}
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
    padding: "var(--gap-md)",
    boxSizing: "border-box",
    transition: "padding var(--transitions-medium)",
  },
  variants: {
    collapsed: {
      true: {
        padding: "0px",
        justifyContent: "center",
      },
      false: {},
    },
  },
});

const DesktopOnly = styled("div", {
  base: {
    display: "flex",
    _tablet: {
      display: "none",
    },
  },
});

const ParticipantsWrapper = styled("div", {
  base: {
    flexGrow: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    transition: "opacity var(--transitions-medium)",
    opacity: 1,
    overflow: "hidden",
  },
  variants: {
    collapsed: {
      true: {
        opacity: 0,
        pointerEvents: "none",
      },
      false: {
        opacity: 1,
      },
    },
  },
});

const VoiceCallControls = styled("div", {
  base: {
    display: "flex",
    position: "relative",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "44px",
  },
});

const VoiceCallControlHolder = styled("div", {
  base: {
    display: "flex",
    position: "absolute",
    alignItems: "center",
    gap: "var(--gap-md)",
    transition: "opacity var(--transitions-medium)",
    opacity: 1,
    zIndex: 1,
  },
  variants: {
    left: {
      true: {
        left: 0,
        overflow: "hidden",
        maxWidth: "40%",
      },
    },
    right: {
      true: {
        right: 0,
      },
    },
    collapsed: {
      true: {
        opacity: 0,
        pointerEvents: "none",
      },
      false: {
        opacity: 1,
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
