import {
  JSX,
  Match,
  Show,
  Switch,
  createContext,
  createEffect,
  createMemo,
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

import { VoiceCallCardActiveRoom } from "./VoiceCallCardActiveRoom";
import { VoiceCallCardPiP } from "./VoiceCallCardPiP";
import { VoiceCallCardPreview } from "./VoiceCallCardPreview";

type Mode = "floating" | "moving";
type FloatType = "tl" | "tr" | "bl" | "br";

type Info = {
  channel: Channel;
  pos?: DOMRect;
  //drawer?: SlideState; TODO PR #835
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

  const [mode, setMode] = createSignal<Mode>();
  const [info, setInfo] = createSignal<Info>();
  let ref: HTMLDivElement | undefined;

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
    if (mode() === "floating") {
      const pos = ref!.getBoundingClientRect();
      ofsX = (e as MouseEvent).clientX - pos.x;
      ofsY = (e as MouseEvent).clientY - pos.y;
      setMode("moving");
      addEvents();
    }
  }

  function mouseMove(e: MouseEvent | TouchEvent) {
    if (!touchToMouse(e)) return;
    e.preventDefault();
    const x = (e as MouseEvent).clientX - ofsX,
      y = (e as MouseEvent).clientY - ofsY;
    ref!.style.transform = `translate(${x}px, ${y}px)`;
  }

  function mouseUp(e: MouseEvent | TouchEvent) {
    if (!touchToMouse(e)) return;
    const sty = ref!.style,
      pos = ref!.getBoundingClientRect(),
      left = (e as MouseEvent).clientX - ofsX + pos.width / 2 < outerWidth / 2,
      top = (e as MouseEvent).clientY - ofsY + pos.height / 2 < outerHeight / 2;

    sty.transition = "all .2s cubic-bezier(0, 1.67, 0.85, 0.8)";
    setFloat(left ? (top ? "tl" : "bl") : top ? "tr" : "br");
    setTimeout(() => (sty.transition = ""), 1);
    resetEvents();
  }

  function addEvents() {
    if (events) return;
    events = new AbortController();
    const opt = { passive: false, signal: events.signal };
    document.addEventListener("mousemove", mouseMove, opt);
    document.addEventListener("mouseup", mouseUp, opt);
    document.addEventListener("touchmove", mouseMove, opt);
    document.addEventListener("touchend", mouseUp, opt);
  }

  function resetEvents() {
    events?.abort();
    events = null;
  }

  const channel = createMemo(() => {
    const inf = info();

    if (!ref) return;
    const sty = ref.style;

    //Set mode based on state
    //TODO for PR #835 to adapt VoiceCallCard to mobile UI
    if (inf?.pos /*&& (!inf.drawer || inf.drawer === SlideState.SHOWN)*/) {
      sty.transform = `translate(${inf.pos.x}px, ${inf.pos.y}px)`;
      sty.width = `${inf.pos.width}px`;
      setMode();
    } else if (!voice.channel()) {
      const y = inf?.pos?.y ?? ref.getBoundingClientRect().y;
      sty.transform = `translate(${innerWidth + 50}px, ${y}px)`;
      setMode();
    } else if (!mode()) setFloat("tr");

    resetEvents();
    return inf?.channel;
  });

  function setFloat(float: FloatType) {
    const sty = ref!.style,
      x = float[1] === "l" ? PAD_X : `calc(100vw - var(--flt-w) - ${PAD_X})`,
      y = float[0] === "t" ? PAD_Y : `calc(100vh - var(--flt-h) - ${PAD_Y})`;
    sty.transform = `translate(${x}, ${y})`;
    sty.width = "";
    setMode("floating");
  }

  onCleanup(resetEvents);

  return (
    <callCardContext.Provider value={setInfo}>
      {props.children}
      <Portal ref={document.getElementById("floating")! as HTMLDivElement}>
        <Float
          ref={ref}
          mode={mode()}
          onMouseDown={mouseDown}
          onTouchStart={mouseDown}
        >
          <Switch>
            <Match when={mode()}>
              <VoiceCallCardPiP />
            </Match>
            <Match when={info() && channel()}>
              <VoiceCallCard channel={channel()!} />
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
  },
  variants: {
    mode: {
      floating: { cursor: "grab" },
      moving: {
        cursor: "grabbing",
        transition: "none",
      },
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
  //const state = useState();
  const voice = useVoice();
  const [width, setWidth] = createSignal(0);
  const setInfo = useContext(callCardContext)!;
  let ref: HTMLDivElement | undefined;

  onMount(() => {
    createResizeObserver(ref, ({ width }) => setWidth(width));
  });

  createEffect(() => {
    width();
    const active = voice.channel(),
      canUpdate = !active || active.id === props.channel.id;
    if (canUpdate)
      setInfo({
        channel: props.channel,
        pos: ref!.getBoundingClientRect(),
        //drawer: state.appDrawer()?.state, TODO PR #835
      });
  });

  onCleanup(setInfo);

  return <div ref={ref!} />;
}

/**
 * Call card
 */
function VoiceCallCard(props: { channel: Channel }) {
  const voice = useVoice();
  const inCall = () => !!voice.channel();

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
