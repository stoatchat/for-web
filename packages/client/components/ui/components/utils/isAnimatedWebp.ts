export async function isAnimatedWebP(input: Blob | string): Promise<boolean> {
  const buffer: ArrayBuffer =
    input instanceof Blob
      ? await input.slice(0, 4096).arrayBuffer()
      : await fetch(input).then((res) => res.arrayBuffer());

  const bytes = new Uint8Array(buffer);

  const readString = (offset: number, length: number): string =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));

  if (
    bytes.length < 12 ||
    readString(0, 4) !== "RIFF" ||
    readString(8, 4) !== "WEBP"
  ) {
    return false;
  }

  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkType = readString(offset, 4);

    const chunkSize =
      bytes[offset + 4]! |
      (bytes[offset + 5]! << 8) |
      (bytes[offset + 6]! << 16) |
      (bytes[offset + 7]! << 24);

    if (chunkType === "ANIM" || chunkType === "ANMF") {
      return true;
    }

    offset += 8 + chunkSize + (chunkSize & 1);
  }

  return false;
}
