import { createSignal, onCleanup, onMount, Show } from "solid-js";

import { createResizeObserver } from "@solid-primitives/resize-observer";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";

import { VoiceChannelCallCardMount } from "./VoiceCallCard";

const SPLITTER_PX = 8;
const MIN_CALL_PX = 160;
const MIN_CHAT_PX = 220;
const PREVIEW_PX = 136;

/**
 * Reserves a top pane for the floating voice card and a drag handle
 * so channel chat sits below the call instead of underneath it.
 */
export function VoiceCallChatSplit(props: { channel: Channel }) {
  const rtc = useVoice();
  const state = useState();

  const inCallHere = () => rtc.channel()?.id === props.channel.id;

  let container: HTMLDivElement | undefined;
  const [containerH, setContainerH] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  const [liveRatio, setLiveRatio] = createSignal<number>();

  const storedRatio = () => state.voice.channelCallSplitRatio;
  const ratio = () => liveRatio() ?? storedRatio();

  function measure() {
    const parent = container?.parentElement;
    if (parent) setContainerH(parent.clientHeight);
  }

  onMount(() => {
    measure();
    const parent = container?.parentElement;
    if (parent) createResizeObserver(parent, measure);
  });

  function clampRatio(value: number, height: number) {
    const usable = Math.max(height - SPLITTER_PX, 1);
    const minRatio = Math.min(MIN_CALL_PX / usable, 0.8);
    const maxRatio = Math.max((usable - MIN_CHAT_PX) / usable, minRatio);
    return Math.min(maxRatio, Math.max(minRatio, value));
  }

  const callHeight = () => {
    if (!inCallHere()) return PREVIEW_PX;
    const height = containerH();
    if (height <= 0) return MIN_CALL_PX;
    return Math.round(clampRatio(ratio(), height) * (height - SPLITTER_PX));
  };

  function onPointerDown(event: PointerEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    setDragging(true);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging() || !container?.parentElement) return;
    const rect = container.parentElement.getBoundingClientRect();
    const usable = rect.height - SPLITTER_PX;
    if (usable <= 0) return;
    setLiveRatio(clampRatio((event.clientY - rect.top) / usable, rect.height));
  }

  function endDrag() {
    if (!dragging()) return;
    setDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    const height = containerH();
    if (height > 0) {
      state.voice.channelCallSplitRatio = clampRatio(ratio(), height);
    }
    setLiveRatio();
  }

  onCleanup(endDrag);

  return (
    <Root ref={container}>
      <CallPane style={{ height: `${callHeight()}px` }}>
        <VoiceChannelCallCardMount channel={props.channel} />
      </CallPane>
      <Show when={inCallHere()}>
        <Splitter
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize voice call and chat"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio() * 100)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </Show>
    </Root>
  );
}

const Root = styled("div", {
  base: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
});

const CallPane = styled("div", {
  base: {
    width: "100%",
    minHeight: 0,
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
  },
});

const Splitter = styled("div", {
  base: {
    height: `${SPLITTER_PX}px`,
    flexShrink: 0,
    cursor: "ns-resize",
    touchAction: "none",
    position: "relative",
    zIndex: 3,

    _after: {
      content: '""',
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "40px",
      height: "3px",
      borderRadius: "var(--borderRadius-lg)",
      background: "var(--md-sys-color-outline-variant)",
      transform: "translate(-50%, -50%)",
    },

    _hover: {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
});
