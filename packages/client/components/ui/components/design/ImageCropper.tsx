import {
  type JSX,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { styled } from "styled-system/jsx";

export type CropMode = "ratio" | "freeform";

export interface CropResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ImageCropperHandle {
  /** Reads the current crop rect and resolves the cropped file. Throws if the image hasn't loaded yet. */
  crop: () => Promise<CropResult>;
}

export interface ImageCropperProps {
  /** Image to crop object URL or data URL. */
  src: string;
  /** Aspect ratio (width / height) used when mode === 'ratio'. Defaults to 1 (square). */
  ratio?: number;
  /** Starting mode. Defaults to 'ratio'. */
  initialMode?: CropMode;
  /** Hide the mode toggle and force a single mode (still user-resizable within that mode). */
  allowModeToggle?: boolean;
  /** Label shown for the ratio option in the toggle, e.g. "Square", "Banner". Defaults to 'Fixed ratio'. */
  ratioLabel?: string;
  outputType?: string; // default 'image/png'
  outputQuality?: number; // for jpeg/webp
  ref?: (handle: ImageCropperHandle) => void;
}

type HandleId = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

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
  },
});

const Mask = styled("div", {
  base: {
    position: "absolute",
    top: 0,
    left: 0,
    background: "rgba(0, 0, 0, 0.55)",
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
    },
  },
});

const Segmented = styled("div", {
  base: {
    display: "inline-flex",
    marginBlockStart: "16px",
    border: "1px solid var(--md-sys-color-outline)",
    borderRadius: "var(--md-sys-shape-corner-full)",
    overflow: "hidden",
  },
});

const Segment = styled("button", {
  base: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "var(--md-sys-color-on-surface)",
    font: "inherit",
    fontSize: "14px",
    fontWeight: 500,
    padding: "8px 16px",
    cursor: "pointer",
    transition: "background-color 120ms ease, color 120ms ease",
    _hover: {
      background: "var(--md-sys-color-on-surface)",
      opacity: 0.92,
    },
    "&:not(:first-child)": {
      borderInlineStart: "1px solid var(--md-sys-color-outline)",
    },
  },
  variants: {
    selected: {
      true: {
        background: "var(--md-sys-color-secondary-container)",
        color: "var(--md-sys-color-on-secondary-container)",
        _hover: {
          background: "var(--md-sys-color-secondary-container)",
          opacity: 1,
        },
      },
    },
  },
});

export interface ImageCropperHandle {
  crop: () => Promise<CropResult>;
}

export default function ImageCropper(props: ImageCropperProps): JSX.Element {
  let containerRef: HTMLDivElement | undefined;
  let imgRef: HTMLImageElement | undefined;

  const [mode, setMode] = createSignal<CropMode>(props.initialMode ?? "ratio");
  const [displaySize, setDisplaySize] = createSignal({ w: 0, h: 0 });
  const [naturalSize, setNaturalSize] = createSignal({ w: 0, h: 0 });
  const [rect, setRect] = createSignal<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [dragging, setDragging] = createSignal<{
    kind: "move" | HandleId;
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

    // For freeform, just take up the entire image
    return { x: 0, y: 0, w, h };
  }

  function handleImgLoad() {
    if (!imgRef || !containerRef) return;
    const natW = imgRef.naturalWidth;
    const natH = imgRef.naturalHeight;
    setNaturalSize({ w: natW, h: natH });

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
      w = Math.max(MIN_SIZE, Math.min(w, maxW));
      h = w / rVal;
    } else {
      w = Math.max(MIN_SIZE, Math.min(w, boxW));
      h = Math.max(MIN_SIZE, Math.min(h, boxH));
    }

    x = Math.max(0, Math.min(x, boxW - w));
    y = Math.max(0, Math.min(y, boxH - h));
    return { x, y, w, h };
  }

  function switchMode(next: CropMode) {
    if (next === mode()) return;
    setMode(next);
    const { w, h } = displaySize();
    if (w && h) {
      const prev = rect();
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      if (next === "ratio") {
        const r = ratio();
        let cw = Math.min(prev.w, w);
        let ch = cw / r;
        if (ch > h) {
          ch = h;
          cw = ch * r;
        }
        setRect(clampRect({ x: cx - cw / 2, y: cy - ch / 2, w: cw, h: ch }));
      } else {
        setRect(clampRect(prev));
      }
    }
  }

  function onPointerDownMove(e: PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging({
      kind: "move",
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
        startX: e.clientX,
        startY: e.clientY,
        startRect: rect(),
      });
    };
  }

  function onPointerMove(e: PointerEvent) {
    const d = dragging();
    if (!d) return;
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
    const right = handle.includes("e");
    const top = handle.includes("n");
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
        newH = newW / r;
        if (top) newY = y + h - newH;
      }
    }

    newW = Math.max(MIN_SIZE, newW);
    newH = Math.max(MIN_SIZE, isRatio ? newW / r : newH);

    newX = Math.max(0, Math.min(newX, boxW - newW));
    newY = Math.max(0, Math.min(newY, boxH - newH));

    return { x: newX, y: newY, w: newW, h: newH };
  }

  function onPointerUp() {
    setDragging(null);
  }

  onMount(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });
  onCleanup(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  });

  async function crop(): Promise<CropResult> {
    if (!imgRef) throw new Error("ImageCropper: image not loaded yet");
    const nat = naturalSize();
    const disp = displaySize();
    const scale = nat.w / disp.w;
    const r = rect();

    const sx = r.x * scale;
    const sy = r.y * scale;
    const sw = r.w * scale;
    const sh = r.h * scale;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ImageCropper: failed to get canvas context");
    ctx.drawImage(imgRef, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const type = props.outputType ?? "image/png";
    const quality = props.outputQuality;
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        type,
        quality,
      );
    });
    const dataUrl = canvas.toDataURL(type, quality);
    return { blob, dataUrl, width: canvas.width, height: canvas.height };
  }

  props.ref?.({ crop });

  const handles = (): HandleId[] =>
    mode() === "ratio"
      ? ["ne", "nw", "se", "sw"] // Only corners for locked ratio
      : ["n", "s", "e", "w", "ne", "nw", "se", "sw"]; // All handles for freeform

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
          style={{
            width: `${displaySize().w}px`,
            height: `${displaySize().h}px`,
          }}
          onLoad={handleImgLoad}
          draggable={false}
          alt=""
        />
        <Show when={displaySize().w > 0}>
          <Mask
            style={{
              width: `${displaySize().w}px`,
              height: `${displaySize().h}px`,
              "clip-path": `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                ${rect().x}px ${rect().y}px,
                ${rect().x}px ${rect().y + rect().h}px,
                ${rect().x + rect().w}px ${rect().y + rect().h}px,
                ${rect().x + rect().w}px ${rect().y}px,
                ${rect().x}px ${rect().y}px
              )`,
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
          >
            <GridLines />
            <For each={handles()}>
              {(h) => (
                <Handle position={h} onPointerDown={onPointerDownHandle(h)} />
              )}
            </For>
          </CropBox>
        </Show>
      </Stage>

      <Show when={props.allowModeToggle ?? true}>
        <Segmented role="tablist" aria-label="Crop mode">
          <Segment
            type="button"
            role="tab"
            aria-selected={mode() === "ratio"}
            selected={mode() === "ratio"}
            onClick={() => switchMode("ratio")}
          >
            {props.ratioLabel ?? "Fixed ratio"}
          </Segment>
          <Segment
            type="button"
            role="tab"
            aria-selected={mode() === "freeform"}
            selected={mode() === "freeform"}
            onClick={() => switchMode("freeform")}
          >
            Freeform
          </Segment>
        </Segmented>
      </Show>
    </div>
  );
}
