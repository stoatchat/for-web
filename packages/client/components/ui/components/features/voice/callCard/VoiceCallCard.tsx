import {
  JSX,
  Match,
  Show,
  Switch,
  batch,
  createContext,
  createEffect,
  createSignal,
  on,
  onCleanup,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";

import { AutoSizer } from "@dschz/solid-auto-sizer";
import { Channel } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { InRoom, useVoice } from "@revolt/rtc";

import { VoiceCallCardActiveRoom } from "./VoiceCallCardActiveRoom";
import { VoiceCallCardPiP } from "./VoiceCallCardPiP";
import { VoiceCallCardPreview } from "./VoiceCallCardPreview";

type State =
  | {
      type: "floating";
      corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    }
  | {
      type: "fixed";
      x: number;
      y: number;
      width: number;
      channel: Channel;
    };

type NewState = { channel: Channel; x: number; y: number; width: number };

const callCardContext = createContext<(state?: NewState) => void>(null!);

/**
 * Voice call card context
 */
export function VoiceCallCardContext(props: { children: JSX.Element }) {
  const voice = useVoice();

  const [state, setState] = createSignal<State>({
    type: "floating",
    corner: "bottom-right",
  });

  const [moving, setMoving] = createSignal<boolean>();
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });

  function position() {
    const position = state();

    switch (position.type) {
      case "fixed":
        return {
          transform: `translate(${position.x}px, ${position.y}px)`,
          // top: position.y + "px",
          // left: position.x + "px",
          width: position.width + "px",
          height: "40vh",
        };
      case "floating":
        return {
          "--width": "280px",
          "--height": "158px",
          "--padding-x": "32px",
          "--padding-y": "96px",
          transform: `translate(${
            position.corner === "top-left" || position.corner === "bottom-left"
              ? "calc(var(--padding-x) + var(--offset-x))"
              : "calc(100vw - var(--padding-x) - var(--width) + var(--offset-x))"
          }, ${
            position.corner === "top-left" || position.corner === "top-right"
              ? "calc(var(--padding-y) + var(--offset-y))"
              : "calc(100vh - var(--padding-y) - var(--height) + var(--offset-y))"
          })`,
          width: "var(--width)",
          height: "var(--height)",
        };
    }
  }

  createEffect(
    on(moving, (moving) => {
      if (moving) {
        const controller = new AbortController();

        document.addEventListener(
          "mousemove",
          (event) => {
            const position = state();
            if (position.type !== "floating") return controller.abort();

            setOffset((pos) => ({
              x: pos.x + event.movementX,
              y: pos.y + event.movementY,
            }));
          },
          { signal: controller.signal },
        );

        document.addEventListener(
          "mouseup",
          (event) => {
            batch(() => {
              setMoving(false);

              const left = event.clientX < window.outerWidth / 2;
              const top = event.clientY < window.outerHeight / 2;

              setState({
                type: "floating",
                corner: left
                  ? top
                    ? "top-left"
                    : "bottom-left"
                  : top
                    ? "top-right"
                    : "bottom-right",
              });
            });
          },
          { signal: controller.signal },
        );

        onCleanup(() => controller.abort());
      }
    }),
  );

  function updateState(state?: NewState) {
    if (state) {
      setState({
        type: "fixed",
        width: state.width,
        x: state.x,
        y: state.y,
        channel: state.channel,
      });
    } else {
      setState({
        type: "floating",
        corner: "bottom-right",
      });
    }
  }

  function updateStateWithTransition(state?: NewState) {
    // no clue if this works

    if (!document.startViewTransition) {
      updateState(state);
      return;
    }

    document.startViewTransition(() => updateState(state));
  }

  return (
    <callCardContext.Provider value={updateStateWithTransition}>
      {props.children}

      <Portal ref={document.getElementById("floating")! as HTMLDivElement}>
        <div
          style={{
            position: "fixed",
            "z-index": 10,
            "transition-duration": moving() ? ".2s" : voice.room() && ".3s",
            "transition-property": "all",
            "transition-timing-function": moving()
              ? "cubic-bezier(0, 1.67, 0.85, 0.8)"
              : "cubic-bezier(1, 0, 0, 1)",
            ...position(),
            "pointer-events": "none",
            cursor: moving() ? "grabbing" : "grab",
            "--offset-x": `${moving() ? offset().x : 0}px`,
            "--offset-y": `${moving() ? offset().y : 0}px`,
          }}
          // dragging logic for mice
          onMouseDown={() => {
            if (state().type === "floating") {
              batch(() => {
                setMoving(true);
                setOffset({ x: 0, y: 0 });
              });
            }
          }}
          // dragging logic for touch input
          // todo
        >
          <Switch>
            <Match when={state().type === "fixed"}>
              <VoiceCallCard
                channel={(state() as { channel: Channel }).channel}
              />
            </Match>
            <Match when={state().type === "floating"}>
              <InRoom>
                <VoiceCallCardPiP />
              </InRoom>
            </Match>
          </Switch>
        </div>
      </Portal>
    </callCardContext.Provider>
  );
}

/**
 * 'Marker' to send position information for mounting the floating call card
 */
export function VoiceChannelCallCardMount(props: { channel: Channel }) {
  const voice = useVoice();
  const [width, setWidth] = createSignal(0);

  const [ref, setRef] = createSignal<HTMLDivElement>();
  const updateSize = useContext(callCardContext)!;

  const ongoingCallElsewhere = () =>
    voice.channel() && voice.channel()?.id !== props.channel.id;

  createEffect(() => {
    const rect = ref()?.getBoundingClientRect();
    const w = width();

    const activeChannel = voice.channel();
    const canUpdate = !activeChannel || activeChannel.id === props.channel.id;

    if (rect?.left && w) {
      if (canUpdate) {
        updateSize({
          x: rect.left,
          y: rect.top,
          width: w,
          channel: props.channel,
        });
      } else {
        updateSize();
      }
    }
  });

  onCleanup(() => updateSize());

  return (
    <div
      ref={setRef}
      class={css({ position: "relative", pointerEvents: "none" })}
    >
      <div class={css({ position: "absolute", width: "100%" })}>
        <AutoSizer>
          {({ width }) => {
            setWidth(width);
            return null;
          }}
        </AutoSizer>
      </div>

      <Show when={ongoingCallElsewhere()}>
        <VoiceCallCard channel={props.channel} />
      </Show>
    </div>
  );
}

/**
 * Call card
 */
function VoiceCallCard(props: { channel: Channel }) {
  const voice = useVoice();
  const inCall = () => voice.channel()?.id === props.channel.id;

  return (
    <Base>
      <Card active={inCall()}>
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
