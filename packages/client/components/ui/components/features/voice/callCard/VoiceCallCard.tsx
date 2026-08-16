import {
  JSX,
  Match,
  Show,
  Switch,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";

import { createResizeObserver } from "@solid-primitives/resize-observer";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { useState } from "@revolt/state";
import { SlideState } from "@revolt/ui/components/navigation/SlideDrawer";

import { VoiceCallCardActiveRoom } from "./VoiceCallCardActiveRoom";
import { VoiceCallCardPiP } from "./VoiceCallCardPiP";
import { VoiceCallCardPreview } from "./VoiceCallCardPreview";

type Mode = "floating" | "moving";
type FloatType = "tl" | "tr" | "bl" | "br";

type Info = {
  channel: Channel;
  pos: DOMRect;
  drawer?: SlideState;
};

const PAD = 16,
  PAD_X = `${PAD}px`,
  PAD_Y = `${PAD + 56}px`;

const callCardContext = createContext<(info?: Info) => void>();

/** Voice call card context */
export function VoiceCallCardContext(props: { children: JSX.Element }) {
  const voice = useVoice();
  const inCall = () => !!voice.channel();

  const [mode, setMode] = createSignal<Mode>();
  const [info, setInfo] = createSignal<Info>();

  let ref: HTMLDivElement | undefined,
    events: AbortController | null,
    pid = 0,
    ofsX = 0,
    ofsY = 0;

  function mouseDown(e: PointerEvent) {
    pid = e.pointerId;
    if (mode() === "floating") {
      const pos = ref!.getBoundingClientRect();
      ofsX = e.clientX - pos.x;
      ofsY = e.clientY - pos.y;
      setMode("moving");
      addEvents();
    }
  }

  function mouseMove(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    e.preventDefault();
    const x = e.clientX - ofsX,
      y = e.clientY - ofsY;
    ref!.style.transform = `translate(${x}px, ${y}px)`;
  }

  function mouseUp(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    const sty = ref!.style,
      pos = ref!.getBoundingClientRect(),
      left = e.clientX - ofsX + pos.width / 2 < innerWidth / 2,
      top = e.clientY - ofsY + pos.height / 2 < innerHeight / 2;

    sty.transition = "all .2s cubic-bezier(0, 1.5, 0.85, 0.8)";
    setFloat(left ? (top ? "tl" : "bl") : top ? "tr" : "br");
    //Reset CSS transition on next render pass
    setTimeout(() => (sty.transition = ""), 1);
    resetEvents();
  }

  function addEvents() {
    if (events) return;
    events = new AbortController();
    const opt = { passive: false, signal: events.signal };
    document.addEventListener("pointermove", mouseMove, opt);
    document.addEventListener("pointerup", mouseUp, opt);
  }

  function resetEvents() {
    events?.abort();
    events = null;
  }

  createEffect(() => {
    const inf = info();
    if (!ref) return;
    const sty = ref.style;
    resetEvents();

    //Set mode based on state
    if (voice.fullscreen()) {
      sty.transform = ``;
      sty.width = `100%`;
      setMode();
    } else if (inf?.pos && (!inf.drawer || inf.drawer === SlideState.SHOWN)) {
      sty.transform = `translate(${inf.pos.x}px, ${inf.pos.y}px)`;
      sty.width = `${inf.pos.width}px`;
      setMode();
    } else if (!inCall()) {
      const y = inf?.pos.y ?? ref.getBoundingClientRect().y;
      sty.transform = `translate(${innerWidth + 50}px, ${y}px)`;
      setMode();
    } else if (!mode()) setFloat("tr");
  });

  const channel = () => info()?.channel;

  function setFloat(float: FloatType) {
    const sty = ref!.style,
      x = float[1] === "l" ? PAD_X : `calc(100vw - var(--flt-w) - ${PAD_X})`,
      y = float[0] === "t" ? PAD_Y : `calc(100vh - var(--flt-h) - ${PAD_Y})`;
    sty.transform = `translate(${x}, ${y})`;
    sty.width = "";
    setMode("floating");
  }

  onCleanup(resetEvents);

  onMount(() => {
    document
      .getElementById("floating")
      ?.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
          voice.toggleFullscreen(false);
        }
      });
  });

  createEffect(() => {
    if (voice.fullscreen() && inCall()) {
      if (
        !document
          .getElementById("floating")
          ?.isSameNode(document.fullscreenElement)
      ) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        document.getElementById("floating")?.requestFullscreen();
      }
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  });

  return (
    <callCardContext.Provider value={setInfo}>
      {props.children}
      <Portal mount={document.getElementById("floating")! as HTMLDivElement}>
        <Float
          ref={ref}
          mode={mode()}
          onPointerDown={mouseDown}
          fullscreen={voice.fullscreen()}
        >
          <Switch>
            <Match when={mode() && inCall()}>
              <VoiceCallCardPiP />
            </Match>
            <Match when={channel()}>
              <VoiceCallCard
                channel={channel()!}
                inCall={inCall()}
                showCard={voice.showCard(channel()!)}
                fullscreen={voice.fullscreen()}
              />
            </Match>
          </Switch>
        </Float>
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
    touchAction: "none",
  },
  variants: {
    mode: {
      floating: { cursor: "grab" },
      moving: {
        cursor: "grabbing",
        transition: "none",
      },
    },
    fullscreen: {
      true: {
        zIndex: 100,
        height: "100vh",
        top: 0,
        // Width is set by floating logic in effect above
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      mode: ["floating", "moving"],
      css: {
        "--flt-w": "300px",
        "--flt-h": "170px",
        width: "var(--flt-w)",
        height: "var(--flt-h)",
      },
    },
  ],
});

/** 'Marker' to send position information for mounting the floating call card */
export function VoiceChannelCallCardMount(props: { channel: Channel }) {
  const voice = useVoice();
  const state = useState();
  const setInfo = useContext(callCardContext)!;
  let ref: HTMLDivElement | undefined;

  function updateInfo() {
    const vc = voice.channel();
    setInfo(
      !vc || vc.id === props.channel.id
        ? {
            channel: props.channel,
            pos: ref!.getBoundingClientRect(),
            drawer: state.appDrawer()?.state,
          }
        : undefined,
    );
  }

  createEffect(updateInfo);

  onMount(() => {
    const target = ref?.parentElement;
    if (!target) return;

    createResizeObserver(target, updateInfo);
  });
  onCleanup(() => {
    setInfo();
  });

  return <div ref={ref!} />;
}

/**
 * Call card
 */
function VoiceCallCard(props: {
  channel: Channel;
  inCall: boolean;
  showCard: boolean;
  fullscreen: boolean;
}) {
  return (
    <Show when={props.showCard}>
      <Base fullscreen={props.fullscreen}>
        <Card active={props.inCall} fullscreen={props.fullscreen}>
          <Show
            when={props.inCall}
            fallback={<VoiceCallCardPreview channel={props.channel} />}
          >
            <VoiceCallCardActiveRoom />
          </Show>
        </Card>
      </Base>
    </Show>
  );
}

const Base = styled("div", {
  base: {
    left: 0,
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
  variants: {
    fullscreen: {
      true: {
        top: 0,
        height: "100%",
        padding: 0,
      },
    },
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
      },
      false: {
        width: "360px",
        height: "120px",
        cursor: "pointer",
      },
    },
    fullscreen: {
      true: {
        height: "100%",
        borderRadius: 0,
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      active: [true],
      fullscreen: [false],
      css: {
        height: "40vh",
      },
    },
  ],
  defaultVariants: {
    active: false,
    fullscreen: false,
  },
});
