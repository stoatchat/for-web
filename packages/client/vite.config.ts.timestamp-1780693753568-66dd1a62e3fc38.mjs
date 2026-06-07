// vite.config.ts
import { lingui as linguiSolidPlugin } from "file:///mnt/f/client/node_modules/.pnpm/@lingui-solid+vite-plugin@5.1.3_typescript@5.8.3_vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1_/node_modules/@lingui-solid/vite-plugin/dist/index.cjs";
import devtools from "file:///mnt/f/client/node_modules/.pnpm/@solid-devtools+transform@0.10.4_solid-js@1.9.6_vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1_/node_modules/@solid-devtools/transform/dist/index.js";
import { readdirSync as readdirSync2 } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "file:///mnt/f/client/node_modules/.pnpm/vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1/node_modules/vite/dist/node/index.js";
import babelMacrosPlugin from "file:///mnt/f/client/node_modules/.pnpm/vite-plugin-babel-macros@1.0.6_vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1_/node_modules/vite-plugin-babel-macros/dist/plugin.js";
import Inspect from "file:///mnt/f/client/node_modules/.pnpm/vite-plugin-inspect@0.8.9_rollup@2.79.2_vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1_/node_modules/vite-plugin-inspect/dist/index.mjs";
import { VitePWA } from "file:///mnt/f/client/node_modules/.pnpm/vite-plugin-pwa@0.20.5_vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1_498b15facdbc5e1d005881f2e56de656/node_modules/vite-plugin-pwa/dist/index.js";
import solidPlugin from "file:///mnt/f/client/node_modules/.pnpm/vite-plugin-solid@2.11.6_solid-js@1.9.6_vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1_/node_modules/vite-plugin-solid/dist/esm/index.mjs";
import solidSvg from "file:///mnt/f/client/node_modules/.pnpm/vite-plugin-solid-svg@0.8.1_solid-js@1.9.6_vite@5.4.19_@types+node@24.7.1_lightningcss@1.25.1_terser@5.43.1_/node_modules/vite-plugin-solid-svg/dist/index.js";

// codegen.plugin.ts
import { readdirSync } from "node:fs";
var fileRegex = /\.tsx$/;
var codegenRegex = /\/\/ @codegen (.*)/g;
var DIRECTIVES = readdirSync("./components/ui/directives").filter((x) => x !== "index.ts").map((x) => x.substring(0, x.length - 3));
var directiveRegex = new RegExp("use:(" + DIRECTIVES.join("|") + ")");
function codegenPlugin() {
  return {
    name: "codegen",
    enforce: "pre",
    transform(src, id) {
      if (fileRegex.test(id)) {
        src = src.replace(codegenRegex, (substring, group1) => {
          const rawArgs = group1.split(" ");
          const type = rawArgs.shift();
          const args = rawArgs.reduce(
            (d, arg) => {
              const [key, value] = arg.split("=");
              return {
                ...d,
                [key]: value
              };
            },
            { type }
          );
          switch (args.type) {
            case "directives": {
              const source = args.props ?? "props";
              const permitted = args.include?.split(",") ?? DIRECTIVES;
              return DIRECTIVES.filter((d) => permitted.includes(d)).map((d) => `use:${d}={${source}["use:${d}"]}`).join("\n");
            }
            default:
              return substring;
          }
        });
        if (directiveRegex.test(src)) {
          if (!id.endsWith("client/components/ui/index.tsx"))
            src = `import { ${DIRECTIVES.join(
              ", "
            )} } from "@revolt/ui/directives";
` + src;
        }
        return src;
      }
    }
  };
}

// vite.config.ts
var __vite_injected_original_dirname = "/mnt/f/client/packages/client";
var base = process.env.BASE_PATH ?? "/";
var vite_config_default = defineConfig({
  base,
  plugins: [
    Inspect(),
    devtools(),
    codegenPlugin(),
    babelMacrosPlugin(),
    linguiSolidPlugin(),
    solidPlugin(),
    solidSvg({
      defaultAsComponent: false
    }),
    VitePWA({
      srcDir: "src",
      registerType: "autoUpdate",
      filename: "serviceWorker.ts",
      strategies: "injectManifest",
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4e6
      },
      manifest: {
        name: "Stoat",
        short_name: "Stoat",
        description: "User-first open source chat platform.",
        categories: ["communication", "chat", "messaging"],
        start_url: base,
        orientation: "portrait",
        display_override: ["window-controls-overlay"],
        display: "standalone",
        background_color: "#101823",
        theme_color: "#101823",
        icons: [
          {
            src: `${base}assets/web/android-chrome-192x192.png`,
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: `${base}assets/web/android-chrome-512x512.png`,
            type: "image/png",
            sizes: "512x512"
          },
          {
            src: `${base}assets/web/monochrome.svg`,
            type: "image/svg+xml",
            sizes: "48x48 72x72 96x96 128x128 256x256",
            purpose: "monochrome"
          },
          {
            src: `${base}assets/web/masking-512x512.png`,
            type: "image/png",
            sizes: "512x512",
            purpose: "maskable"
          }
        ]
        // TODO: take advantage of shortcuts
      }
    })
  ],
  build: {
    target: "esnext",
    rollupOptions: {
      external: ["hast"],
      output: {
        manualChunks: {
          markdown: [
            "lowlight",
            "rehype-highlight",
            "rehype-katex",
            "remark-breaks",
            "remark-gfm",
            "remark-math",
            "remark-parse",
            "remark-rehype",
            "vfile"
          ]
        }
      }
    },
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ["hast"]
  },
  resolve: {
    alias: {
      "styled-system": resolve(__vite_injected_original_dirname, "styled-system"),
      ...readdirSync2(resolve(__vite_injected_original_dirname, "components")).reduce(
        (p, f) => ({
          ...p,
          [`@revolt/${f}`]: resolve(__vite_injected_original_dirname, "components", f)
        }),
        {}
      )
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiY29kZWdlbi5wbHVnaW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2YvY2xpZW50L3BhY2thZ2VzL2NsaWVudFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC9mL2NsaWVudC9wYWNrYWdlcy9jbGllbnQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC9mL2NsaWVudC9wYWNrYWdlcy9jbGllbnQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBsaW5ndWkgYXMgbGluZ3VpU29saWRQbHVnaW4gfSBmcm9tIFwiQGxpbmd1aS1zb2xpZC92aXRlLXBsdWdpblwiO1xuaW1wb3J0IGRldnRvb2xzIGZyb20gXCJAc29saWQtZGV2dG9vbHMvdHJhbnNmb3JtXCI7XG5pbXBvcnQgeyByZWFkZGlyU3luYyB9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBiYWJlbE1hY3Jvc1BsdWdpbiBmcm9tIFwidml0ZS1wbHVnaW4tYmFiZWwtbWFjcm9zXCI7XG5pbXBvcnQgSW5zcGVjdCBmcm9tIFwidml0ZS1wbHVnaW4taW5zcGVjdFwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcbmltcG9ydCBzb2xpZFBsdWdpbiBmcm9tIFwidml0ZS1wbHVnaW4tc29saWRcIjtcbmltcG9ydCBzb2xpZFN2ZyBmcm9tIFwidml0ZS1wbHVnaW4tc29saWQtc3ZnXCI7XG5cbmltcG9ydCBjb2RlZ2VuUGx1Z2luIGZyb20gXCIuL2NvZGVnZW4ucGx1Z2luXCI7XG5cbmNvbnN0IGJhc2UgPSBwcm9jZXNzLmVudi5CQVNFX1BBVEggPz8gXCIvXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2UsXG4gIHBsdWdpbnM6IFtcbiAgICBJbnNwZWN0KCksXG4gICAgZGV2dG9vbHMoKSxcbiAgICBjb2RlZ2VuUGx1Z2luKCksXG4gICAgYmFiZWxNYWNyb3NQbHVnaW4oKSxcbiAgICBsaW5ndWlTb2xpZFBsdWdpbigpLFxuICAgIHNvbGlkUGx1Z2luKCksXG4gICAgc29saWRTdmcoe1xuICAgICAgZGVmYXVsdEFzQ29tcG9uZW50OiBmYWxzZSxcbiAgICB9KSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHNyY0RpcjogXCJzcmNcIixcbiAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXG4gICAgICBmaWxlbmFtZTogXCJzZXJ2aWNlV29ya2VyLnRzXCIsXG4gICAgICBzdHJhdGVnaWVzOiBcImluamVjdE1hbmlmZXN0XCIsXG4gICAgICBpbmplY3RNYW5pZmVzdDoge1xuICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNDAwMDAwMCxcbiAgICAgIH0sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiBcIlN0b2F0XCIsXG4gICAgICAgIHNob3J0X25hbWU6IFwiU3RvYXRcIixcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVXNlci1maXJzdCBvcGVuIHNvdXJjZSBjaGF0IHBsYXRmb3JtLlwiLFxuICAgICAgICBjYXRlZ29yaWVzOiBbXCJjb21tdW5pY2F0aW9uXCIsIFwiY2hhdFwiLCBcIm1lc3NhZ2luZ1wiXSxcbiAgICAgICAgc3RhcnRfdXJsOiBiYXNlLFxuICAgICAgICBvcmllbnRhdGlvbjogXCJwb3J0cmFpdFwiLFxuICAgICAgICBkaXNwbGF5X292ZXJyaWRlOiBbXCJ3aW5kb3ctY29udHJvbHMtb3ZlcmxheVwiXSxcbiAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiIzEwMTgyM1wiLFxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjMTAxODIzXCIsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBgJHtiYXNlfWFzc2V0cy93ZWIvYW5kcm9pZC1jaHJvbWUtMTkyeDE5Mi5wbmdgLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogYCR7YmFzZX1hc3NldHMvd2ViL2FuZHJvaWQtY2hyb21lLTUxMng1MTIucG5nYCxcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGAke2Jhc2V9YXNzZXRzL3dlYi9tb25vY2hyb21lLnN2Z2AsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjQ4eDQ4IDcyeDcyIDk2eDk2IDEyOHgxMjggMjU2eDI1NlwiLFxuICAgICAgICAgICAgcHVycG9zZTogXCJtb25vY2hyb21lXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IGAke2Jhc2V9YXNzZXRzL3dlYi9tYXNraW5nLTUxMng1MTIucG5nYCxcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgLy8gVE9ETzogdGFrZSBhZHZhbnRhZ2Ugb2Ygc2hvcnRjdXRzXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJlc25leHRcIixcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogW1wiaGFzdFwiXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICBtYXJrZG93bjogW1xuICAgICAgICAgICAgXCJsb3dsaWdodFwiLFxuICAgICAgICAgICAgXCJyZWh5cGUtaGlnaGxpZ2h0XCIsXG4gICAgICAgICAgICBcInJlaHlwZS1rYXRleFwiLFxuICAgICAgICAgICAgXCJyZW1hcmstYnJlYWtzXCIsXG4gICAgICAgICAgICBcInJlbWFyay1nZm1cIixcbiAgICAgICAgICAgIFwicmVtYXJrLW1hdGhcIixcbiAgICAgICAgICAgIFwicmVtYXJrLXBhcnNlXCIsXG4gICAgICAgICAgICBcInJlbWFyay1yZWh5cGVcIixcbiAgICAgICAgICAgIFwidmZpbGVcIixcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogW1wiaGFzdFwiXSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcInN0eWxlZC1zeXN0ZW1cIjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3R5bGVkLXN5c3RlbVwiKSxcbiAgICAgIC4uLnJlYWRkaXJTeW5jKHJlc29sdmUoX19kaXJuYW1lLCBcImNvbXBvbmVudHNcIikpLnJlZHVjZShcbiAgICAgICAgKHAsIGYpID0+ICh7XG4gICAgICAgICAgLi4ucCxcbiAgICAgICAgICBbYEByZXZvbHQvJHtmfWBdOiByZXNvbHZlKF9fZGlybmFtZSwgXCJjb21wb25lbnRzXCIsIGYpLFxuICAgICAgICB9KSxcbiAgICAgICAge30sXG4gICAgICApLFxuICAgIH0sXG4gIH0sXG59KTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL21udC9mL2NsaWVudC9wYWNrYWdlcy9jbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9tbnQvZi9jbGllbnQvcGFja2FnZXMvY2xpZW50L2NvZGVnZW4ucGx1Z2luLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvZi9jbGllbnQvcGFja2FnZXMvY2xpZW50L2NvZGVnZW4ucGx1Z2luLnRzXCI7aW1wb3J0IHsgcmVhZGRpclN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuXG5jb25zdCBmaWxlUmVnZXggPSAvXFwudHN4JC87XG5jb25zdCBjb2RlZ2VuUmVnZXggPSAvXFwvXFwvIEBjb2RlZ2VuICguKikvZztcblxuY29uc3QgRElSRUNUSVZFUyA9IHJlYWRkaXJTeW5jKFwiLi9jb21wb25lbnRzL3VpL2RpcmVjdGl2ZXNcIilcbiAgLmZpbHRlcigoeCkgPT4geCAhPT0gXCJpbmRleC50c1wiKVxuICAubWFwKCh4KSA9PiB4LnN1YnN0cmluZygwLCB4Lmxlbmd0aCAtIDMpKTtcblxuY29uc3QgZGlyZWN0aXZlUmVnZXggPSBuZXcgUmVnRXhwKFwidXNlOihcIiArIERJUkVDVElWRVMuam9pbihcInxcIikgKyBcIilcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvZGVnZW5QbHVnaW4oKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJjb2RlZ2VuXCIsXG4gICAgZW5mb3JjZTogXCJwcmVcIiBhcyBjb25zdCxcbiAgICB0cmFuc2Zvcm0oc3JjOiBzdHJpbmcsIGlkOiBzdHJpbmcpIHtcbiAgICAgIGlmIChmaWxlUmVnZXgudGVzdChpZCkpIHtcbiAgICAgICAgc3JjID0gc3JjLnJlcGxhY2UoY29kZWdlblJlZ2V4LCAoc3Vic3RyaW5nLCBncm91cDEpID0+IHtcbiAgICAgICAgICBjb25zdCByYXdBcmdzOiBzdHJpbmdbXSA9IGdyb3VwMS5zcGxpdChcIiBcIik7XG4gICAgICAgICAgY29uc3QgdHlwZSA9IHJhd0FyZ3Muc2hpZnQoKTtcblxuICAgICAgICAgIGNvbnN0IGFyZ3MgPSByYXdBcmdzLnJlZHVjZShcbiAgICAgICAgICAgIChkLCBhcmcpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0gYXJnLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAuLi5kLFxuICAgICAgICAgICAgICAgIFtrZXldOiB2YWx1ZSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7IHR5cGUgfSxcbiAgICAgICAgICApIGFzIHtcbiAgICAgICAgICAgIHR5cGU6IFwiZGlyZWN0aXZlc1wiO1xuICAgICAgICAgICAgcHJvcHM/OiBzdHJpbmc7XG4gICAgICAgICAgICBpbmNsdWRlPzogc3RyaW5nO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBzd2l0Y2ggKGFyZ3MudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcImRpcmVjdGl2ZXNcIjoge1xuICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBkaXJlY3RpdmVzIGZvcndhcmRpbmdcbiAgICAgICAgICAgICAgY29uc3Qgc291cmNlID0gYXJncy5wcm9wcyA/PyBcInByb3BzXCI7XG4gICAgICAgICAgICAgIGNvbnN0IHBlcm1pdHRlZDogc3RyaW5nW10gPVxuICAgICAgICAgICAgICAgIGFyZ3MuaW5jbHVkZT8uc3BsaXQoXCIsXCIpID8/IERJUkVDVElWRVM7XG4gICAgICAgICAgICAgIHJldHVybiBESVJFQ1RJVkVTLmZpbHRlcigoZCkgPT4gcGVybWl0dGVkLmluY2x1ZGVzKGQpKVxuICAgICAgICAgICAgICAgIC5tYXAoKGQpID0+IGB1c2U6JHtkfT17JHtzb3VyY2V9W1widXNlOiR7ZH1cIl19YClcbiAgICAgICAgICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHJldHVybiBzdWJzdHJpbmc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZGlyZWN0aXZlUmVnZXgudGVzdChzcmMpKSB7XG4gICAgICAgICAgaWYgKCFpZC5lbmRzV2l0aChcImNsaWVudC9jb21wb25lbnRzL3VpL2luZGV4LnRzeFwiKSlcbiAgICAgICAgICAgIHNyYyA9XG4gICAgICAgICAgICAgIGBpbXBvcnQgeyAke0RJUkVDVElWRVMuam9pbihcbiAgICAgICAgICAgICAgICBcIiwgXCIsXG4gICAgICAgICAgICAgICl9IH0gZnJvbSBcIkByZXZvbHQvdWkvZGlyZWN0aXZlc1wiO1xcbmAgKyBzcmM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3JjO1xuICAgICAgfVxuICAgIH0sXG4gIH07XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlRLFNBQVMsVUFBVSx5QkFBeUI7QUFDclQsT0FBTyxjQUFjO0FBQ3JCLFNBQVMsZUFBQUEsb0JBQW1CO0FBQzVCLFNBQVMsZUFBZTtBQUN4QixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLHVCQUF1QjtBQUM5QixPQUFPLGFBQWE7QUFDcEIsU0FBUyxlQUFlO0FBQ3hCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sY0FBYzs7O0FDVDBQLFNBQVMsbUJBQW1CO0FBRTNTLElBQU0sWUFBWTtBQUNsQixJQUFNLGVBQWU7QUFFckIsSUFBTSxhQUFhLFlBQVksNEJBQTRCLEVBQ3hELE9BQU8sQ0FBQyxNQUFNLE1BQU0sVUFBVSxFQUM5QixJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBRTFDLElBQU0saUJBQWlCLElBQUksT0FBTyxVQUFVLFdBQVcsS0FBSyxHQUFHLElBQUksR0FBRztBQUV2RCxTQUFSLGdCQUFpQztBQUN0QyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEs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
