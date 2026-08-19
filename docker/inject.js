const {
  cpSync,
  rmSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} = require("node:fs");
const { join } = require("node:path");

const BUILD_DIR = "dist";
const OUT_DIR = "dist_injected";

/** First defined env var (self-hosted .env.web uses VITE_*; dev uses VITE_DEV_*). */
const envOr = (...keys) => keys.map((k) => process.env[k]).find(Boolean);

/** VITE_HOST or hostname parsed from self-hosted HOSTNAME=https://domain. */
const resolveViteHost = () => {
  const host = process.env.VITE_HOST;
  if (host) return host;

  const hostname = process.env.HOSTNAME;
  if (!hostname) return undefined;

  try {
    const url = hostname.includes("://") ? hostname : `https://${hostname}`;
    return new URL(url).hostname;
  } catch {
    return hostname.replace(/^https?:\/\//, "").split("/")[0];
  }
};

// Map of placeholder to env var name
// At build time, Vite replaces import.meta.env.VITE_X with the literal string value.
// We build with placeholder values like "__VITE_API_URL__" so they appear in the output.
const REPLACEMENTS = {
  __VITE_HOST__: resolveViteHost(),
  __VITE_API_URL__: process.env.VITE_API_URL,
  __VITE_WS_URL__: envOr("VITE_DEV_WS_URL", "VITE_WS_URL"),
  __VITE_MEDIA_URL__: envOr("VITE_DEV_MEDIA_URL", "VITE_MEDIA_URL"),
  __VITE_PROXY_URL__: envOr("VITE_DEV_PROXY_URL", "VITE_PROXY_URL"),
  __VITE_GIFBOX_URL__: envOr("VITE_DEV_GIFBOX_URL", "VITE_GIFBOX_URL"),
  __VITE_RNNOISE_WORKLET_CDN_URL__: process.env.VITE_RNNOISE_WORKLET_CDN_URL,
};

console.log("Preparing injected build...");

rmSync(OUT_DIR, { recursive: true, force: true });
cpSync(BUILD_DIR, OUT_DIR, { recursive: true });

console.log("Injecting environment variables...");
const files = readdirSync(OUT_DIR, { recursive: true });

for (const file of files) {
  const path = join(OUT_DIR, file);
  if (!path.endsWith(".js") && !path.endsWith(".html")) continue;

  let data = readFileSync(path, "utf-8");
  let modified = false;

  for (const [placeholder, value] of Object.entries(REPLACEMENTS)) {
    if (data.includes(placeholder)) {
      if (value) {
        data = data.replaceAll(placeholder, value);
      } else {
        data = data.replaceAll(`"${placeholder}"`, "void 0");
      }
      modified = true;
    }
  }

  if (modified) {
    console.log("Injected:", path);
    writeFileSync(path, data);
  }
}

console.log("Injection complete.");
