import {
  JSX,
  Show,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";

import { AutoSizer } from "@dschz/solid-auto-sizer";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { InRoom, useVoice } from "@revolt/rtc";

import { VoiceCallCardActiveRoom } from "./VoiceCallCardActiveRoom";
import { VoiceCallCardPiP } from "./VoiceCallCardPiP";
import { VoiceCallCardPreview } from "./VoiceCallCardPreview";

type FloatMode = "tl" | "tr" | "bl" | "br";

type State =
  | {
      mode: "floating";
      float: FloatMode;
    }
  | {
      mode?: "fixed" | "moving";
    };

type Info = {
  pos: DOMRect;
  channel: Channel;
};

const PAD = 16,
  PAD_X = `${PAD}px`,
  PAD_Y = `${PAD + 56}px`;

const callCardContext = createContext<(info?: Info) => void>();

function getTouch(id: number, tl: TouchList) {
  for (const t of tl) if (t.identifier === id) return t;
}

/** Voice call card context */
export function VoiceCallCardContext(props: { children: JSX.Element }) {
  const voice = useVoice();

  const [state, setState] = createSignal<State>({});
  let ref: HTMLDivElement, channel: Channel | null;

  let events: AbortController | null,
    tid = 0,
    ofsX = 0,
    ofsY = 0;

  function touchToMouse(e: MouseEvent | TouchEvent, down = false) {
    if (e instanceof TouchEvent) {
      const t = down ? e.touches[0] : getTouch(tid, e.changedTouches);
      if (down) tid = t!.identifier;
      else if (!t) return false;
      //@ts-expect-error prop
      e.clientX = t.clientX;
      //@ts-expect-error prop
      e.clientY = t.clientY;
    }
    return true;
  }

  function mouseDown(e: MouseEvent | TouchEvent) {
    touchToMouse(e, true);
    if (state().mode === "floating") {
      const pos = ref!.getBoundingClientRect();
      ofsX = (e as MouseEvent).clientX - pos.x;
      ofsY = (e as MouseEvent).clientY - pos.y;
      setState({ mode: "moving" });
      addEvents();
    }
  }

  function mouseMove(e: MouseEvent | TouchEvent) {
    if (!touchToMouse(e)) return;
    e.preventDefault();
    ref!.style.left = `${(e as MouseEvent).clientX - ofsX}px`;
    ref!.style.top = `${(e as MouseEvent).clientY - ofsY}px`;
  }

  function mouseUp(e: MouseEvent | TouchEvent) {
    if (!touchToMouse(e)) return;
    const sty = ref!.style,
      left = (e as MouseEvent).clientX < outerWidth / 2,
      top = (e as MouseEvent).clientY < outerHeight / 2;

    sty.transition = "all .2s cubic-bezier(0, 1.67, 0.85, 0.8)";
    setFloat(left ? (top ? "tl" : "bl") : top ? "tr" : "br");
    setTimeout(() => (sty.transition = ""), 1);
    resetEvents();
  }

  function addEvents() {
    if (events) return;
    events = new AbortController();
    const sig = { passive: false, signal: events.signal };
    document.addEventListener("mousemove", mouseMove, sig);
    document.addEventListener("mouseup", mouseUp, sig);
    document.addEventListener("touchmove", mouseMove, sig);
    document.addEventListener("touchend", mouseUp, sig);
  }

  function resetEvents() {
    events?.abort();
    events = null;
  }

  function setInfo(info?: Info) {
    if (ref!) {
      if (info) {
        channel = info.channel;
        const sty = ref.style;
        sty.left = `${info.pos.x}px`;
        sty.top = `${info.pos.y}px`;
        sty.width = `${info.pos.width}px`;
        setState({ mode: "fixed" });
      } else {
        channel = null;
        setFloat("tr");
      }
    }
    resetEvents();
  }

  function setFloat(float: FloatMode) {
    const sty = ref!.style;
    sty.left =
      float[1] === "l" ? PAD_X : `calc(100vw - var(--width) - ${PAD_X})`;
    sty.top =
      float[0] === "t" ? PAD_Y : `calc(100vh - var(--height) - ${PAD_Y})`;
    sty.width = "";
    setState({ mode: "floating", float });
  }

  onCleanup(resetEvents);

  return (
    <callCardContext.Provider value={setInfo}>
      {props.children}
      <Portal ref={document.getElementById("floating")! as HTMLDivElement}>
        <Show when={voice.channel()}>
          <Float
            ref={ref!}
            mode={state().mode}
            onMouseDown={mouseDown}
            onTouchStart={mouseDown}
          >
            <Show
              when={state().mode === "fixed"}
              fallback={
                <InRoom>
                  <VoiceCallCardPiP />
                </InRoom>
              }
            >
              <VoiceCallCard channel={channel!} />
            </Show>
          </Float>
        </Show>
      </Portal>
    </callCardContext.Provider>
  );
}

const Float = styled("div", {
  base: {
    position: "fixed",
    zIndex: 10,
    pointerEvents: "none",
    transition: "all .3s cubic-bezier(1, 0, 0, 1)",
    height: "40vh",
  },

  variants: {
    mode: {
      floating: { cursor: "grab" },
      moving: {
        cursor: "grabbing",
        transition: "none",
      },
      fixed: {},
    },
  },
  compoundVariants: [
    {
      mode: ["floating", "moving"],
      css: {
        "--width": "300px",
        "--height": "170px",
        width: "var(--width)",
        height: "var(--height)",
      },
    },
  ],
});

/** 'Marker' to send position information for mounting the floating call card */
export function VoiceChannelCallCardMount(props: { channel: Channel }) {
  const voice = useVoice();
  const [width, setWidth] = createSignal(0);
  const [ref, setRef] = createSignal<HTMLDivElement>();
  const setInfo = useContext(callCardContext)!;

  createEffect(() => {
    width();
    const active = voice.channel();
    const isActive = !active || active.id === props.channel.id;
    const pos = ref()?.getBoundingClientRect();
    if (pos) setInfo(isActive ? { pos, channel: props.channel } : undefined);
  });

  onCleanup(setInfo);

  //TODO React to pos change and not only width change

  return (
    <Show when={voice.channel()}>
      <div ref={setRef}>
        <AutoSizer>
          {({ width }) => {
            setWidth(width);
            return null;
          }}
        </AutoSizer>
      </div>
    </Show>
  );
}

/**
 * Call card
 */
function VoiceCallCard(props: { channel: Channel }) {
  const voice = useVoice();
  const inCall = () => voice.channel()?.id === props.channel.id;

  let viewRef: HTMLDivElement | undefined;

  onMount(() => {
    viewRef?.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        voice.toggleFullscreen(false);
      }
    });
  });

  createEffect(() => {
    if (voice.fullscreen() && inCall()) {
      if (!viewRef?.isSameNode(document.fullscreenElement)) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        viewRef?.requestFullscreen();
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  });

  return (
    <Base>
      <Card ref={viewRef} active={inCall()}>
        <Show
          when={inCall()}
          fallback={<VoiceCallCardPreview channel={props.channel} />}
        >
          <VoiceCallCardActiveRoom />
        </Show>
      </Card>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    // todo: temp for Mount
    top: "var(--gap-md)",
    padding: "var(--gap-md)",

    width: "100%",
    position: "absolute",

    zIndex: 2,
    userSelect: "none",

    display: "flex",
    alignItems: "center",
    flexDirection: "column",
  },
});

const Card = styled("div", {
  base: {
    pointerEvents: "all",

    maxWidth: "100%",
    transition: "var(--transitions-fast) all",
    transitionTimingFunction: "ease-in-out",

    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-secondary-container)",
  },
  variants: {
    active: {
      true: {
        width: "100%",
        height: "40vh",
      },
      false: {
        width: "360px",
        height: "120px",
        cursor: "pointer",
      },
    },
  },
  defaultVariants: {
    active: false,
  },
});
