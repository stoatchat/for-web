import {
  type JSX,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Form2 } from "@revolt/ui";
import { createFormControl } from "solid-forms";
import { css } from "styled-system/css";
import {
  type CropResult,
  cropImage,
  CropSizeError,
  loadImage,
} from "../utils/cropProcessor";

export { CropSizeError };
export type { CropResult };
export type CropMode = "ratio" | "freeform";

export interface ImageCropperHandle {
  /** Loads the source image fresh and resolves the cropped file. Rejects with CropSizeError if `maxSize` is set and exceeded. */
  crop: () => Promise<CropResult>;
}

export interface ImageCropperProps {
  /** Image to crop object URL or data URL. */
  src: string;
  /** The real source File, when available — preserves the output's filename/MIME instead of defaulting to PNG. */
  sourceFile?: Pick<File, "name" | "type">;
  /** Aspect ratio (width / height) used when mode === 'ratio'. Defaults to 1 (square). */
  ratio?: number;
  /** Starting mode. Defaults to 'ratio'. */
  initialMode?: CropMode;
  /** Hide the mode toggle and force a single mode (still user-resizable within that mode). */
  allowModeToggle?: boolean;
  /** Label shown for the ratio option in the toggle, e.g. "Square", "Banner". Defaults to 'Fixed ratio'. */
  ratioLabel?: string;
  outputType?: string; // defaults to sourceFile.type, or 'image/png' if not provided
  outputQuality?: number; // for jpeg/webp
  /** Rejects crop() with a CropSizeError if the encoded result exceeds this — checked against the actual output. */
  maxSize?: number;
  /** Include CropResult.dataUrl. Off by default. */
  includeDataUrl?: boolean;
  /** Show a circular mask instead of a polygon mask. Off by default */
  circularMask?: boolean;
  ref?: (handle: ImageCropperHandle) => void;
}

type HandleId = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | "rad";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_SIZE = 32; // px, in displayed (screen) space
const MAX_STAGE_HEIGHT = 420;

const Stage = styled("div", {
  base: {
    position: "relative",
    overflow: "hidden",
    background: "var(--md-sys-color-surface-container-highest)",
    borderRadius: "var(--md-sys-shape-corner-large)",
    touchAction: "none",
  },
});

const CroppedImage = styled("img", {
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    userSelect: "none",
    filter: "opacity(45%) brightness(45%)",
  },
});

const Mask = styled("img", {
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
  },
});

const CropBox = styled("div", {
  base: {
    position: "absolute",
    boxSizing: "border-box",
    border: "2px solid var(--md-sys-color-primary)",
    cursor: "move",
    touchAction: "none",
  },
  variants: {
    circle: {
      true: {
        borderRadius: "100%",
      },
    },
  },
});

const GridLines = styled("div", {
  base: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(to right, rgba(255, 255, 255, 0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.55) 1px, transparent 1px)",
    backgroundSize: "calc(100% / 3) 100%, 100% calc(100% / 3)",
    opacity: 0.9,
  },
});

const Handle = styled("div", {
  base: {
    position: "absolute",
    width: "14px",
    height: "14px",
    background: "var(--md-sys-color-primary)",
    border: "2px solid var(--md-sys-color-surface)",
    borderRadius: "var(--md-sys-shape-corner-full)",
    touchAction: "none",
  },
  variants: {
    position: {
      n: {
        top: "-7px",
        left: "50%",
        transform: "translateX(-50%)",
        cursor: "ns-resize",
      },
      s: {
        bottom: "-7px",
        left: "50%",
        transform: "translateX(-50%)",
        cursor: "ns-resize",
      },
      e: {
        right: "-7px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "ew-resize",
      },
      w: {
        left: "-7px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "ew-resize",
      },
      ne: { top: "-7px", right: "-7px", cursor: "nesw-resize" },
      nw: { top: "-7px", left: "-7px", cursor: "nwse-resize" },
      se: { bottom: "-7px", right: "-7px", cursor: "nwse-resize" },
      sw: { bottom: "-7px", left: "-7px", cursor: "nesw-resize" },
      rad: {
        bottom: "calc(50% - 7px + sin(45deg) * 50%)",
        left: "calc(50% - 7px + cos(45deg) * 50%)",
      },
    },
  },
});

const ErrorMessage = styled("div", {
  base: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "14px",
    textAlign: "center",
    padding: "16px",
  },
});

export function ImageCropper(props: ImageCropperProps): JSX.Element {
  let containerRef: HTMLDivElement | undefined;
  let imgRef: HTMLImageElement | undefined;

  const modeControl = createFormControl<CropMode>(props.initialMode ?? "ratio");
  const mode = () => modeControl.value;
  const [displaySize, setDisplaySize] = createSignal({ w: 0, h: 0 });
  const [loadFailed, setLoadFailed] = createSignal(false);
  const [rect, setRect] = createSignal<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [dragging, setDragging] = createSignal<{
    kind: "move" | HandleId;
    pointerId: number;
    startX: number;
    startY: number;
    startRect: Rect;
  } | null>(null);

  const ratio = () => props.ratio ?? 1;

  function initialRectFor(w: number, h: number, m: CropMode): Rect {
    if (m === "ratio") {
      const r = ratio();
      let cw = w;
      let ch = w / r;
      if (ch > h) {
        ch = h;
        cw = h * r;
      }
      return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
    }

    return { x: 0, y: 0, w, h };
  }

  function handleImgLoad() {
    if (!imgRef || !containerRef) return;
    const natW = imgRef.naturalWidth;
    const natH = imgRef.naturalHeight;

    const boxW = containerRef.clientWidth;
    const boxH = containerRef.clientHeight;
    const scale = Math.min(boxW / natW, boxH / natH, 1);
    const dispW = natW * scale;
    const dispH = natH * scale;
    setDisplaySize({ w: dispW, h: dispH });
    setRect(initialRectFor(dispW, dispH, mode()));
  }

  function clampRect(r: Rect): Rect {
    const { w: boxW, h: boxH } = displaySize();
    let { x, y, w, h } = r;

    if (mode() === "ratio") {
      const rVal = ratio();
      const maxW = Math.min(boxW, boxH * rVal);
      const effectiveMinW = Math.min(MIN_SIZE, boxW, boxH * rVal);

      w = Math.max(effectiveMinW, Math.min(w, maxW));
      h = w / rVal;
    } else {
      const effectiveMinW = Math.min(MIN_SIZE, boxW);
      const effectiveMinH = Math.min(MIN_SIZE, boxH);

      w = Math.max(effectiveMinW, Math.min(w, boxW));
      h = Math.max(effectiveMinH, Math.min(h, boxH));
    }

    x = Math.max(0, Math.min(x, boxW - w));
    y = Math.max(0, Math.min(y, boxH - h));
    return { x, y, w, h };
  }

  function onPointerDownMove(e: PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({
      kind: "move",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startRect: rect(),
    });
  }

  function onPointerDownHandle(id: HandleId) {
    return (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging({
        kind: id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startRect: rect(),
      });
    };
  }

  function onPointerMove(e: PointerEvent) {
    const d = dragging();
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const { w: boxW, h: boxH } = displaySize();

    if (d.kind === "move") {
      const r = d.startRect;
      setRect(clampRect({ ...r, x: r.x + dx, y: r.y + dy }));
      return;
    }

    setRect(clampRect(resizeRect(d.startRect, d.kind, dx, dy, boxW, boxH)));
  }

  function resizeRect(
    start: Rect,
    handle: HandleId,
    dx: number,
    dy: number,
    boxW: number,
    boxH: number,
  ): Rect {
    const { x, y, w, h } = start;
    const isRatio = mode() === "ratio";
    const r = ratio();

    const left = handle.includes("w");
    const right = handle.includes("e") || handle === "rad";
    const top = handle.includes("n") || handle === "rad";
    const bottom = handle.includes("s");

    let newX = x;
    let newY = y;
    let newW = w;
    let newH = h;

    if (left) {
      newX = x + dx;
      newW = w - dx;
    } else if (right) {
      newW = w + dx;
    }

    if (top) {
      newY = y + dy;
      newH = h - dy;
    } else if (bottom) {
      newH = h + dy;
    }

    if (isRatio) {
      const driveByWidth = left || right;
      const driveByHeight = top || bottom;
      if (driveByWidth && !driveByHeight) {
        newH = newW / r;
        if (top) newY = y + h - newH;
      } else if (driveByHeight && !driveByWidth) {
        newW = newH * r;
        if (left) newX = x + w - newW;
      } else {
        if (Math.abs(dx) > Math.abs(dy) * r) {
          newH = newW / r;
        } else {
          newW = newH * r;
        }
        if (top) newY = y + h - newH;
        if (left) newX = x + w - newW;
      }
    }

    newW = Math.max(MIN_SIZE, newW);
    newH = Math.max(MIN_SIZE, isRatio ? newW / r : newH);

    newX = Math.max(0, Math.min(newX, boxW - newW));
    newY = Math.max(0, Math.min(newY, boxH - newH));

    return { x: newX, y: newY, w: newW, h: newH };
  }

  function onPointerUp(e: PointerEvent) {
    const d = dragging();
    if (!d || e.pointerId !== d.pointerId) return;
    setDragging(null);
  }

  onMount(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  });
  onCleanup(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  });

  async function crop(): Promise<CropResult> {
    const disp = displaySize();
    if (disp.w === 0) {
      throw new Error(
        "ImageCropper: nothing to crop yet — image hasn't been measured",
      );
    }

    const img = await loadImage(props.src);
    const scale = img.naturalWidth / disp.w;
    const r = rect();

    return cropImage(
      img,
      { x: r.x * scale, y: r.y * scale, w: r.w * scale, h: r.h * scale },
      props.sourceFile ?? { name: "cropped", type: "image/png" },
      {
        outputType: props.outputType,
        outputQuality: props.outputQuality,
        maxSize: props.maxSize,
        includeDataUrl: props.includeDataUrl,
      },
    );
  }

  props.ref?.({ crop });

  const handles = (): HandleId[] =>
    mode() === "ratio"
      ? props.circularMask
        ? ["rad"]
        : ["ne", "nw", "se", "sw"]
      : ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

  return (
    <div>
      <Stage
        ref={containerRef}
        style={
          displaySize().w > 0
            ? { width: `${displaySize().w}px`, height: `${displaySize().h}px` }
            : { width: "100%", height: `${MAX_STAGE_HEIGHT}px` }
        }
      >
        <CroppedImage
          ref={imgRef}
          src={props.src}
          onLoad={handleImgLoad}
          onError={() => setLoadFailed(true)}
          draggable={false}
          alt=""
        />
        <Show when={loadFailed()}>
          <ErrorMessage>
            <Trans>Couldn't load this image.</Trans>
          </ErrorMessage>
        </Show>
        <Show when={displaySize().w > 0}>
          <Mask
            src={props.src}
            style={{
              "clip-path":
                props.circularMask && mode() !== "freeform"
                  ? `circle(${rect().w / 2}px at ${rect().x + rect().w / 2}px ${rect().y + rect().h / 2}px)`
                  : `inset(${rect().y}px ${displaySize().w - (rect().x + rect().w)}px ${displaySize().h - (rect().y + rect().h)}px ${rect().x}px)`,
            }}
          />
          <CropBox
            style={{
              left: `${rect().x}px`,
              top: `${rect().y}px`,
              width: `${rect().w}px`,
              height: `${rect().h}px`,
            }}
            onPointerDown={onPointerDownMove}
            circle={props.circularMask && mode() !== "freeform"}
          >
            <GridLines
              style={
                props.circularMask && mode() !== "freeform"
                  ? { "clip-path": `circle(${rect().w / 2}px)` }
                  : {}
              }
            />
            <For each={handles()}>
              {(h) => (
                <Handle position={h} onPointerDown={onPointerDownHandle(h)} />
              )}
            </For>
          </CropBox>
        </Show>
      </Stage>

      <Show when={props.allowModeToggle ?? true}>
        <div class={css({ marginBlockStart: "16px" })}>
          <Form2.ButtonGroup
            control={modeControl}
            buttonDefinitions={[
              { value: "ratio", children: props.ratioLabel ?? "Fixed ratio" },
              { value: "freeform", children: "Freeform" },
            ]}
          />
        </div>
      </Show>
    </div>
  );
}
