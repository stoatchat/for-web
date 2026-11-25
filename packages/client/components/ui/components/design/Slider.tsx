import {
  type JSX,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";

import "mdui/components/slider.js";

import { cva } from "styled-system/css/cva";

type Props = Omit<
  JSX.HTMLAttributes<HTMLInputElement>,
  "onChange" | "onInput"
> & {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  tickmarks?: boolean;
  labelFormatter?: (value: number) => string;
  onChange?: (event: { currentTarget: { value: number } }) => void;
  onInput?: (event: { currentTarget: { value: number } }) => void;
};

/**
 * Sliders let users make selections from a range of values
 *
 * @library MDUI
 * @specification https://m3.material.io/components/sliders
 */
export function Slider(props: Props) {
  const [ref, setRef] = createSignal<{
    labelFormatter?: (value: number) => string;
  }>();

  const [local, rest] = splitProps(props, ["labelFormatter"]);

  createEffect(
    on(ref, (ref) => {
      if (ref && local.labelFormatter) {
        ref.labelFormatter = local.labelFormatter;
      }
    }),
  );

  return <mdui-slider ref={setRef} {...rest} />;
}

type Orientation = "horizontal" | "vertical";
type Size = "xs" | "s" | "m" | "l" | "xl";
type VerticalDirection = "bottom-to-top" | "top-to-bottom";

export type Slider2Props = {
  value: number;
  min?: number;
  max?: number;
  /**
   * Value increment. Use `0` for a continuous slider.
   * @default 1
   */
  step?: number;
  orientation?: Orientation;
  verticalDirection?: VerticalDirection;
  size?: Size;
  showStops?: boolean;
  showValueIndicator?: boolean;
  insetIcon?: JSX.Element;
  labelFormatter?: (value: number) => string;
  disabled?: boolean;
  name?: string;
  id?: string;
  class?: string;
  style?: JSX.CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  onChange?: (event: { currentTarget: { value: number } }) => void;
  onInput?: (event: { currentTarget: { value: number } }) => void;
};

const HANDLE_THICKNESS = 4;
const HANDLE_PRESSED_THICKNESS = 2;
const TRACK_GAP = 6;
const INSIDE_CORNER = 2;
const STOP_SIZE = 4;
const MAX_STOPS = 50;

const SIZES: Record<
  Size,
  {
    track: number;
    corner: number;
    handle: number;
    icon: number;
    iconPadding: number;
  }
> = {
  xs: { track: 16, corner: 8, handle: 44, icon: 12, iconPadding: 4 },
  s: { track: 24, corner: 8, handle: 44, icon: 20, iconPadding: 5 },
  m: { track: 40, corner: 12, handle: 52, icon: 24, iconPadding: 6 },
  l: { track: 56, corner: 16, handle: 68, icon: 24, iconPadding: 6 },
  xl: { track: 96, corner: 28, handle: 108, icon: 32, iconPadding: 8 },
};

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

/**
 * Sliders let users make selections from a range of values
 *
 * @specification https://m3.material.io/components/sliders
 */
export function Slider2(props: Slider2Props) {
  const [dragging, setDragging] = createSignal(false);
  const [focusVisible, setFocusVisible] = createSignal(false);
  const [trackSize, setTrackSize] = createSignal({ width: 0, height: 0 });
  const [draftValue, setDraftValue] = createSignal<number>();

  let trackArea: HTMLDivElement | undefined;
  let input: HTMLInputElement | undefined;
  let dragStartValue: number;

  const orientation = () => props.orientation ?? "horizontal";
  const verticalDirection = () => props.verticalDirection ?? "bottom-to-top";
  const isVertical = () => orientation() === "vertical";
  const isReversed = () =>
    isVertical() && verticalDirection() === "bottom-to-top";
  const size = () => SIZES[props.size ?? "xs"];

  const min = () => props.min ?? 0;
  const max = () => Math.max(props.max ?? 100, min());
  const range = () => max() - min();
  const step = () => props.step ?? 1;
  const nativeStep = () => (step() > 0 ? step() : "any");

  const clampValue = (value: number) =>
    Math.min(max(), Math.max(min(), Number.isFinite(value) ? value : min()));

  const snappedValue = (value: number) => {
    if (!(step() > 0)) return value;

    const snapped = min() + Math.round((value - min()) / step()) * step();
    return Number(snapped.toFixed(10));
  };

  const currentValue = () => clampValue(draftValue() ?? props.value);

  const progress = createMemo(() => {
    if (range() <= 0) return 0;

    return Math.min(1, Math.max(0, (currentValue() - min()) / range()));
  });

  /**
   * Position of the handle on the visual axis (top to bottom).
   * Vertical sliders start at the bottom by default.
   */
  const position = () => (isReversed() ? 1 - progress() : progress());

  const trackLength = () =>
    isVertical() ? trackSize().height : trackSize().width;

  const iconCovered = () => {
    const length = trackLength();
    if (length <= 0) return false;

    const clearance = HANDLE_THICKNESS / 2 + TRACK_GAP;
    return progress() * length - clearance >= size().iconPadding + size().icon;
  };

  const showIcon = () =>
    !!props.insetIcon &&
    (trackLength() <= 0 ||
      trackLength() >= size().icon + size().iconPadding * 2);

  const stops = createMemo(() => {
    if (!props.showStops) return [];

    const increment = step();
    if (!(increment > 0) || range() <= 0) return [];

    const count = Math.floor(range() / increment + 1e-9) + 1;
    if (count < 2) return [];

    const stride = Math.max(1, Math.ceil(count / MAX_STOPS));
    const values: number[] = [];

    for (let index = 0; index < count; index += stride) {
      values.push(min() + index * increment);
    }

    const last = min() + (count - 1) * increment;
    if (values[values.length - 1] !== last) values.push(last);

    return values;
  });

  const formattedValue = (value: number) =>
    props.labelFormatter?.(value) ?? numberFormat.format(value);

  const indicatorVisible = () =>
    (props.showValueIndicator ?? true) &&
    !props.disabled &&
    (dragging() || focusVisible());

  const emitInput = (value: number) => {
    props.onInput?.({ currentTarget: { value } });
  };

  const emitChange = (value: number) => {
    props.onChange?.({ currentTarget: { value } });
  };

  const updateValue = (next: number) => {
    const clamped = clampValue(snappedValue(next));
    return clamped === currentValue() ? undefined : clamped;
  };

  const updateFromPointer = (event: PointerEvent) => {
    const rect = trackArea?.getBoundingClientRect();
    if (!rect) return undefined;

    let fraction: number;
    if (isVertical()) {
      fraction = (event.clientY - rect.top) / rect.height;
      if (isReversed()) fraction = 1 - fraction;
    } else {
      fraction = (event.clientX - rect.left) / rect.width;
    }

    fraction = Math.min(1, Math.max(0, fraction));
    const next = updateValue(min() + fraction * range());
    if (next !== undefined) {
      setDraftValue(next);
      emitInput(next);
    }

    return next;
  };

  const endDrag = (value?: number) => {
    if (!dragging()) return;

    setDragging(false);
    if (value !== undefined && value !== dragStartValue) emitChange(value);
    setDraftValue(undefined);
  };

  const onPointerDown = (
    event: PointerEvent & { currentTarget: HTMLDivElement },
  ) => {
    if (props.disabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    input?.focus({ preventScroll: true });
    dragStartValue = currentValue();
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };

  const onPointerMove = (
    event: PointerEvent & { currentTarget: HTMLDivElement },
  ) => {
    if (!dragging()) return;

    event.preventDefault();
    updateFromPointer(event);
  };

  const onPointerUp = (
    event: PointerEvent & { currentTarget: HTMLDivElement },
  ) => {
    if (!dragging()) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const updated = updateFromPointer(event);
    endDrag(updated ?? currentValue());
  };

  const onNativeInput = (
    event: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    const parsed = parseFloat(event.currentTarget.value);
    if (!Number.isFinite(parsed)) return;

    const next = updateValue(parsed);
    if (next !== undefined) {
      setDraftValue(next);
      emitInput(next);
    }
  };

  const onNativeChange = (
    event: Event & { currentTarget: HTMLInputElement },
  ) => {
    const parsed = parseFloat(event.currentTarget.value);
    if (Number.isFinite(parsed)) {
      const value = clampValue(parsed);
      emitChange(value);
      setDraftValue(undefined);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (props.disabled) return;

    const increment = step() > 0 ? step() : range() / 100;
    const upDirection =
      isVertical() && verticalDirection() === "top-to-bottom" ? -1 : 1;
    let next: number | undefined;

    switch (event.key) {
      case "ArrowRight":
        next = currentValue() + increment;
        break;
      case "ArrowLeft":
        next = currentValue() - increment;
        break;
      case "ArrowUp":
        next = currentValue() + increment * upDirection;
        break;
      case "ArrowDown":
        next = currentValue() - increment * upDirection;
        break;
      case "PageUp":
        next = currentValue() + increment * 10;
        break;
      case "PageDown":
        next = currentValue() - increment * 10;
        break;
      case "Home":
        next = min();
        break;
      case "End":
        next = max();
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    setFocusVisible(true);

    const updated = updateValue(next);
    if (updated !== undefined) {
      setDraftValue(updated);
      emitInput(updated);
      emitChange(updated);
      setDraftValue(undefined);
    }
  };

  onMount(() => {
    if (!trackArea) return;

    const update = () =>
      setTrackSize({
        width: trackArea!.offsetWidth,
        height: trackArea!.offsetHeight,
      });

    update();

    const observer = new ResizeObserver(update);
    observer.observe(trackArea);
    onCleanup(() => observer.disconnect());
  });

  const rootStyle = (): JSX.CSSProperties => ({
    "--slider-progress": `${progress() * 100}%`,
    "--slider-position": `${position() * 100}%`,
    "--slider-track-height": `${size().track}px`,
    "--slider-track-corner": `${size().corner}px`,
    "--slider-inside-corner": `${INSIDE_CORNER}px`,
    "--slider-handle-size": `${size().handle}px`,
    "--slider-handle-thickness-current": `${dragging() || focusVisible() ? HANDLE_PRESSED_THICKNESS : HANDLE_THICKNESS}px`,
    "--slider-focus-outline": focusVisible()
      ? "2px solid var(--md-sys-color-primary)"
      : "none",
    "--slider-indicator-scale": indicatorVisible() ? 1 : 0,
    "--slider-icon-size": `${size().icon}px`,
    "--slider-icon-padding": `${size().iconPadding}px`,
    "--slider-icon-color": iconCovered()
      ? "var(--slider-icon-active-color)"
      : "var(--slider-icon-inactive-color)",
    ...(props.style ?? {}),
  });

  const stopStyle = (stop: number): JSX.CSSProperties => {
    const fraction = range() > 0 ? (stop - min()) / range() : 0;
    const visualFraction = isReversed() ? 1 - fraction : fraction;
    const inset = size().corner;

    if (isVertical()) {
      return {
        top: `calc(${inset}px + (100% - ${inset * 2}px) * ${visualFraction})`,
        left: "50%",
      };
    }

    return {
      left: `calc(${inset}px + (100% - ${inset * 2}px) * ${visualFraction})`,
      top: "50%",
    };
  };

  /**
   * Continuous sliders have a single stop indicator one corner in from the
   * end of the inactive track.
   */
  const endStopStyle = (): JSX.CSSProperties => {
    const inset = size().corner;

    if (isVertical()) {
      return {
        left: "50%",
        top: isReversed() ? `${inset}px` : `calc(100% - ${inset}px)`,
      };
    }

    return {
      left: `calc(100% - ${inset}px)`,
      top: "50%",
    };
  };

  return (
    <div
      class={`${root({ orientation: orientation(), disabled: props.disabled })} ${props.class ?? ""}`}
      style={rootStyle()}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        endDrag();
      }}
    >
      <div
        class={trackAreaClass({ orientation: orientation() })}
        ref={trackArea}
        aria-hidden="true"
      >
        <div
          class={inactiveTrackClass({
            orientation: orientation(),
            verticalDirection: isVertical() ? verticalDirection() : undefined,
          })}
        />
        <div
          class={activeTrackClass({
            orientation: orientation(),
            verticalDirection: isVertical() ? verticalDirection() : undefined,
          })}
        />

        <Show when={!props.showStops}>
          <div
            class={stopClass()}
            style={{
              ...endStopStyle(),
              background: "var(--slider-stop-end-color)",
            }}
          />
        </Show>

        <For each={stops()}>
          {(stop) => (
            <Show when={Math.abs(stop - currentValue()) > 1e-9}>
              <div
                class={stopClass()}
                style={{
                  ...stopStyle(stop),
                  background:
                    stop < currentValue()
                      ? "var(--slider-stop-active-color)"
                      : "var(--slider-stop-inactive-color)",
                }}
              />
            </Show>
          )}
        </For>

        <Show when={showIcon()}>
          <span
            class={iconClass({
              orientation: orientation(),
              verticalDirection: isVertical() ? verticalDirection() : undefined,
            })}
          >
            {props.insetIcon}
          </span>
        </Show>

        <div class={handleClass({ orientation: orientation() })} />
        <div class={valueIndicatorClass({ orientation: orientation() })}>
          {formattedValue(currentValue())}
        </div>
      </div>

      <input
        class={nativeInputClass()}
        ref={input}
        type="range"
        min={min()}
        max={max()}
        step={nativeStep()}
        value={currentValue()}
        disabled={props.disabled}
        name={props.name}
        id={props.id}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-orientation={orientation()}
        aria-valuetext={formattedValue(currentValue())}
        onInput={onNativeInput}
        onChange={onNativeChange}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          setFocusVisible(event.currentTarget.matches(":focus-visible"));
        }}
        onBlur={() => {
          setFocusVisible(false);
          endDrag(currentValue());
        }}
      />
    </div>
  );
}

const root = cva({
  base: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxSizing: "border-box",
    userSelect: "none",
    touchAction: "none",
    WebkitTapHighlightColor: "transparent",
    cursor: "pointer",

    "--slider-gap": `${TRACK_GAP}px`,
    "--slider-handle-thickness": `${HANDLE_THICKNESS}px`,
    "--slider-clearance": `calc(var(--slider-handle-thickness) / 2 + var(--slider-gap))`,

    "--slider-active-track-color": "var(--md-sys-color-primary)",
    "--slider-inactive-track-color": "var(--md-sys-color-secondary-container)",
    "--slider-handle-color": "var(--md-sys-color-primary)",
    "--slider-stop-active-color": "var(--md-sys-color-on-primary)",
    "--slider-stop-inactive-color":
      "var(--md-sys-color-on-secondary-container)",
    "--slider-stop-end-color": "var(--md-sys-color-primary)",
    "--slider-icon-active-color": "var(--md-sys-color-on-primary)",
    "--slider-icon-inactive-color":
      "var(--md-sys-color-on-secondary-container)",
    "--slider-indicator-container-color": "var(--md-sys-color-inverse-surface)",
    "--slider-indicator-label-color": "var(--md-sys-color-inverse-on-surface)",
  },
  variants: {
    orientation: {
      horizontal: {
        inlineSize: "100%",
        blockSize: "max(48px, var(--slider-handle-size))",
        paddingInline: "calc(var(--slider-handle-thickness) / 2)",
      },
      vertical: {
        inlineSize: "max(48px, var(--slider-handle-size))",
        blockSize: "200px",
        paddingBlock: "calc(var(--slider-handle-thickness) / 2)",
      },
    },
    disabled: {
      true: {
        cursor: "not-allowed",
        "--slider-active-track-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent)",
        "--slider-inactive-track-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent)",
        "--slider-handle-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent)",
        "--slider-stop-active-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent)",
        "--slider-stop-inactive-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent)",
        "--slider-stop-end-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent)",
        "--slider-icon-active-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent)",
        "--slider-icon-inactive-color":
          "color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent)",
      },
    },
  },
});

const trackAreaClass = cva({
  base: {
    position: "relative",
    flexShrink: 0,
  },
  variants: {
    orientation: {
      horizontal: {
        inlineSize: "100%",
        blockSize: "var(--slider-track-height)",
      },
      vertical: {
        inlineSize: "var(--slider-track-height)",
        blockSize: "100%",
      },
    },
  },
});

const activeTrackClass = cva({
  base: {
    position: "absolute",
    zIndex: 0,
    background: "var(--slider-active-track-color)",
    pointerEvents: "none",
  },
  variants: {
    orientation: {
      horizontal: {
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        height: "100%",
        width:
          "max(0px, calc(var(--slider-progress) - var(--slider-clearance)))",
        borderRadius:
          "var(--slider-track-corner) var(--slider-inside-corner) var(--slider-inside-corner) var(--slider-track-corner)",
      },
      vertical: {},
    },
    verticalDirection: {
      "bottom-to-top": {
        left: "50%",
        bottom: 0,
        transform: "translateX(-50%)",
        width: "100%",
        height:
          "max(0px, calc(var(--slider-progress) - var(--slider-clearance)))",
        borderRadius:
          "var(--slider-inside-corner) var(--slider-inside-corner) var(--slider-track-corner) var(--slider-track-corner)",
      },
      "top-to-bottom": {
        left: "50%",
        top: 0,
        transform: "translateX(-50%)",
        width: "100%",
        height:
          "max(0px, calc(var(--slider-progress) - var(--slider-clearance)))",
        borderRadius:
          "var(--slider-track-corner) var(--slider-track-corner) var(--slider-inside-corner) var(--slider-inside-corner)",
      },
    },
  },
});

const inactiveTrackClass = cva({
  base: {
    position: "absolute",
    zIndex: 0,
    background: "var(--slider-inactive-track-color)",
    pointerEvents: "none",
  },
  variants: {
    orientation: {
      horizontal: {
        left: "calc(var(--slider-progress) + var(--slider-clearance))",
        top: "50%",
        transform: "translateY(-50%)",
        height: "100%",
        width:
          "max(0px, calc(100% - var(--slider-progress) - var(--slider-clearance)))",
        borderRadius:
          "var(--slider-inside-corner) var(--slider-track-corner) var(--slider-track-corner) var(--slider-inside-corner)",
      },
      vertical: {},
    },
    verticalDirection: {
      "bottom-to-top": {
        left: "50%",
        top: 0,
        transform: "translateX(-50%)",
        width: "100%",
        height:
          "max(0px, calc(100% - var(--slider-progress) - var(--slider-clearance)))",
        borderRadius:
          "var(--slider-track-corner) var(--slider-track-corner) var(--slider-inside-corner) var(--slider-inside-corner)",
      },
      "top-to-bottom": {
        left: "50%",
        bottom: 0,
        transform: "translateX(-50%)",
        width: "100%",
        height:
          "max(0px, calc(100% - var(--slider-progress) - var(--slider-clearance)))",
        borderRadius:
          "var(--slider-inside-corner) var(--slider-inside-corner) var(--slider-track-corner) var(--slider-track-corner)",
      },
    },
  },
});

const stopClass = cva({
  base: {
    position: "absolute",
    zIndex: 1,
    inlineSize: `${STOP_SIZE}px`,
    blockSize: `${STOP_SIZE}px`,
    borderRadius: "var(--borderRadius-full)",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
});

const iconClass = cva({
  base: {
    position: "absolute",
    zIndex: 2,
    width: "var(--slider-icon-size)",
    height: "var(--slider-icon-size)",
    fontSize: "var(--slider-icon-size)",
    color: "var(--slider-icon-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    pointerEvents: "none",
    transition: "color var(--transitions-fast)",
  },
  variants: {
    orientation: {
      horizontal: {
        left: "var(--slider-icon-padding)",
        top: "50%",
        transform: "translateY(-50%)",
      },
      vertical: { left: "50%", transform: "translateX(-50%)" },
    },
    verticalDirection: {
      "bottom-to-top": { bottom: "var(--slider-icon-padding)" },
      "top-to-bottom": { top: "var(--slider-icon-padding)" },
    },
  },
});

const handleClass = cva({
  base: {
    position: "absolute",
    zIndex: 3,
    background: "var(--slider-handle-color)",
    borderRadius: "var(--borderRadius-full)",
    pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    outline: "var(--slider-focus-outline)",
    outlineOffset: "2px",
    transition:
      "width 100ms cubic-bezier(0.2, 0, 0, 1), height 100ms cubic-bezier(0.2, 0, 0, 1)",
  },
  variants: {
    orientation: {
      horizontal: {
        left: "var(--slider-progress)",
        top: "50%",
        width: "var(--slider-handle-thickness-current)",
        height: "var(--slider-handle-size)",
      },
      vertical: {
        left: "50%",
        top: "var(--slider-position)",
        width: "var(--slider-handle-size)",
        height: "var(--slider-handle-thickness-current)",
      },
    },
  },
});

const valueIndicatorClass = cva({
  base: {
    position: "absolute",
    zIndex: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minInlineSize: "48px",
    blockSize: "44px",
    paddingInline: "12px",
    borderRadius: "var(--borderRadius-full)",
    background: "var(--slider-indicator-container-color)",
    color: "var(--slider-indicator-label-color)",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "20px",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    transition: "transform 100ms cubic-bezier(0.2, 0, 0, 1)",
  },
  variants: {
    orientation: {
      horizontal: {
        left: "var(--slider-progress)",
        bottom: "calc(50% + var(--slider-handle-size) / 2 + 12px)",
        transform: "translateX(-50%) scale(var(--slider-indicator-scale))",
        transformOrigin: "center bottom",
      },
      vertical: {
        left: "calc(50% - var(--slider-handle-size) / 2 - 12px)",
        top: "var(--slider-position)",
        transform:
          "translate(-100%, -50%) scale(var(--slider-indicator-scale))",
        transformOrigin: "right center",
      },
    },
  },
});

const nativeInputClass = cva({
  base: {
    position: "absolute",
    inset: "0 auto auto 0",
    inlineSize: "1px",
    blockSize: "1px",
    margin: 0,
    padding: 0,
    border: "none",
    opacity: 0,
    pointerEvents: "none",
    appearance: "none",
    background: "transparent",
    "&::-webkit-slider-thumb": {
      appearance: "none",
    },
  },
});
