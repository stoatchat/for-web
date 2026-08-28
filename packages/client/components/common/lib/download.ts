/**
 * Whether the browser supports the anchor `download` attribute.
 */
export const supportsAnchorDownload =
  "download" in document.createElement("a");
