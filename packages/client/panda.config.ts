import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      keyframes: {
        materialPhysicsButtonSelect: {
          "0%": {
            paddingInline: "var(--padding-inline)",
          },
          "50%": {
            paddingInline: "calc(var(--padding-inline) + 8px)",
          },
          "100%": {
            paddingInline: "var(--padding-inline)",
          },
        },
        scrimFadeIn: {
          "0%": {
            background: "transparent",
          },
          "100%": {
            background: "var(--background)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          },
        },
        slideIn: {
          "0%": {
            transform: "translateY(var(--translateY))",
          },
          "100%": {
            transform: "translateY(0px)",
          },
        },
        highlightMessage: {
          "0%": {
            background: "transparent",
          },
          "5%": {
            background: "var(--md-sys-color-primary-container)",
          },
          "95%": {
            background: "var(--md-sys-color-primary-container)",
          },
          "100%": {
            background: "transparent",
          },
        },
        skeletonShimmer: {
          "0%": {
            backgroundPosition: "200% 0",
          },
          "100%": {
            backgroundPosition: "-200% 0",
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",

  // Enable jsx code gen
  jsxFramework: "solid",

  // Use template style
  // syntax: "template-literal",
});
