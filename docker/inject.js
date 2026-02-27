const { cpSync, rmSync, readFileSync, writeFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

const BUILD_DIR = "dist";
const OUT_DIR = "dist_injected";

// Map of placeholder to env var name
// At build time, Vite replaces import.meta.env.VITE_X with the literal string value.
// We build with placeholder values like "__VITE_API_URL__" so they appear in the output.
const REPLACEMENTS = {
  __VITE_API_URL__: process.env.VITE_API_URL || "",
  __VITE_WS_URL__: process.env.VITE_WS_URL || "",
  __VITE_MEDIA_URL__: process.env.VITE_MEDIA_URL || "",
  __VITE_PROXY_URL__: process.env.VITE_PROXY_URL || "",
  __VITE_HCAPTCHA_SITEKEY__: process.env.VITE_HCAPTCHA_SITEKEY || "",
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
      data = data.replaceAll(placeholder, value);
      modified = true;
    }
  }

  if (modified) {
    console.log("Injected:", path);
    writeFileSync(path, data);
  }
}

console.log("Injection complete.");
