/**
 * Fetch a remote file as a Blob (CORS).
 */
export async function fetchAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Failed to fetch (${response.status})`);
  }
  return response.blob();
}

/**
 * Encode a raster image Blob as PNG for the clipboard.
 */
export async function blobToPng(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") {
    return blob;
  }

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not create canvas context");
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const png = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Could not encode PNG"));
      }
    }, "image/png");
  });
  return png;
}

/**
 * Copy an image URL onto the clipboard as PNG.
 */
export async function copyImageFromUrl(url: string): Promise<void> {
  const blob = await fetchAsBlob(url);
  const png = await blobToPng(blob);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

/**
 * Best-effort filename from a URL path.
 */
export function filenameFromUrl(url: string, fallback = "image"): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const parts = path.split("/").filter(Boolean);
    const last = parts.at(-1);
    if (!last || last === "original") {
      return parts.at(-2) ?? fallback;
    }
    return decodeURIComponent(last);
  } catch {
    return fallback;
  }
}

/**
 * Download a URL by fetching a blob so cross-origin `download` attributes work.
 */
export async function downloadFromUrl(
  url: string,
  filename: string,
): Promise<void> {
  const blob = await fetchAsBlob(url);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noreferrer";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
