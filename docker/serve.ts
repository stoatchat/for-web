import { serveDir } from "@std/http/file-server";
import { injectEnv } from "./inject.ts";

const DIST_DIR = "./dist";
const port = Number(Deno.env.get("PORT") ?? 5000);

await injectEnv(DIST_DIR);

Deno.serve({ port, hostname: "0.0.0.0" }, async (req) => {
  const res = await serveDir(req, {
    fsRoot: DIST_DIR,
    quiet: true,
    showIndex: true,
  });

  // SPA fallback: serve index.html for client-side routes
  if (res.status === 404 && req.method === "GET") {
    const accept = req.headers.get("accept") ?? "";
    if (accept.includes("text/html")) {
      const html = await Deno.readFile(`${DIST_DIR}/index.html`);
      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  }

  return res;
});

console.log(`Serving ${DIST_DIR} on http://0.0.0.0:${port}`);
