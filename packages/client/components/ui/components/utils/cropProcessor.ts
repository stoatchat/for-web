export interface CropRect {
  /** All four in the SOURCE image's natural pixel space, not screen/CSS px. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CropResult {
  file: File;
  blob: Blob;
  dataUrl?: string;
  width: number;
  height: number;
}

export interface CropOptions {
  /** Defaults to the source file's own MIME type */
  outputType?: string;
  outputQuality?: number;
  maxSize?: number;
  /** Include CropResult.dataUrl. Off by default. */
  includeDataUrl?: boolean;
}

export class CropSizeError extends Error {
  constructor(
    public readonly actualSize: number,
    public readonly maxSize: number,
  ) {
    super(
      `Cropped file (${actualSize} bytes) exceeds max size (${maxSize} bytes)`,
    );
    this.name = "CropSizeError";
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`cropProcessor: failed to load image from ${src}`));
    img.src = src;
  });
}

/**
 * Crop `rect` (in the image's own natural pixel space) out of `img` and
 * encode it as a File, preserving the source's filename/MIME by default.
 */
export async function cropImage(
  img: HTMLImageElement,
  rect: CropRect,
  sourceFile: Pick<File, "name" | "type">,
  options: CropOptions = {},
): Promise<CropResult> {
  const type = options.outputType ?? sourceFile.type ?? "image/png";
  const quality = options.outputQuality;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.w));
  canvas.height = Math.max(1, Math.round(rect.h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cropProcessor: failed to get canvas context");

  ctx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("cropProcessor: toBlob failed")),
      type,
      quality,
    );
  });

  if (options.maxSize && blob.size > options.maxSize) {
    throw new CropSizeError(blob.size, options.maxSize);
  }

  const file = new File([blob], sourceFile.name, { type: blob.type });
  const dataUrl = options.includeDataUrl
    ? canvas.toDataURL(type, quality)
    : undefined;

  return { file, blob, dataUrl, width: canvas.width, height: canvas.height };
}
