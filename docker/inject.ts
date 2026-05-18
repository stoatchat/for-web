import { walk } from "@std/fs/walk";

const PLACEHOLDERS = [
  "VITE_API_URL",
  "VITE_WS_URL",
  "VITE_MEDIA_URL",
  "VITE_PROXY_URL",
  "VITE_HCAPTCHA_SITEKEY",
  "VITE_CFG_ENABLE_VIDEO",
  "VITE_GIFBOX_URL",
  "VITE_RNNOISE_WORKLET_CDN_URL",
] as const;

export async function injectEnv(distDir: string): Promise<void> {
  const replacements: Record<string, string> = {};
  for (const name of PLACEHOLDERS) {
    replacements[`__${name}__`] = Deno.env.get(name) ?? "";
  }

  console.log("Injecting environment variables into", distDir);

  for await (
    const entry of walk(distDir, {
      includeDirs: false,
      exts: [".js", ".html"],
    })
  ) {
    let data = await Deno.readTextFile(entry.path);
    let modified = false;

    for (const [placeholder, value] of Object.entries(replacements)) {
      if (data.includes(placeholder)) {
        data = data.replaceAll(placeholder, value);
        modified = true;
      }
    }

    if (modified) {
      console.log("Injected:", entry.path);
      await Deno.writeTextFile(entry.path, data);
    }
  }

  console.log("Injection complete.");
}

if (import.meta.main) {
  await injectEnv(Deno.args[0] ?? "./dist");
}
