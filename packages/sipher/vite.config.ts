import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  // relative paths, so the site works from any folder on any host
  base: "./",
  plugins: [solid()],
  build: {
    target: "es2022",
  },
});
