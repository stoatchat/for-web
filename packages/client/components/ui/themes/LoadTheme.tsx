import { createEffect, createMemo } from "solid-js";

import { useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { useState } from "@revolt/state";

import {
  createMaterialColourVariables,
  createMduiColourTriplets,
  createStoatWebVariables,
} from ".";
import { SlideState } from "../components/navigation/SlideDrawer";
import { Masks } from "./Masks";
import { FONTS, MONOSPACE_FONTS } from "./fonts";
import { legacyThemeUnsetShim } from "./legacyThemeGeneratorCode";

/**
 * Component for loading theme variables into root
 */
export function LoadTheme() {
  const state = useState();
  const { lifecycle } = useClientLifecycle();

  const bannerShown = createMemo(() =>
    [
      State.Connecting,
      State.Disconnected,
      State.Reconnecting,
      State.Offline,
    ].includes(lifecycle.state()),
  );

  const getCssProps = createMemo(() => {
    const activeTheme = state.theme.activeTheme;

    return {
      // create unset variables to indicate where colours need replacing
      ...Object.keys(legacyThemeUnsetShim().colours).reduce(
        (d, k) => ({
          ...d,
          [`--colours-${k}`]: k.includes("background")
            ? "var(--unset-bg)"
            : "var(--unset-fg)",
        }),
        {},
      ),
      // mount Stoat for Web variables
      ...createStoatWebVariables(activeTheme),
      // mount --md-sys-color variables
      ...createMaterialColourVariables(activeTheme, "--md-sys-color-"),
      // mount --mdui-color triplet variables
      ...createMduiColourTriplets(activeTheme, "--mdui-color-"),
    };
  });

  //Load fonts & update CSS props on body
  createEffect(() => {
    FONTS[state.theme.interfaceFont].load();
    MONOSPACE_FONTS[state.theme.monospaceFont].load();

    const cssProps = getCssProps();
    for (const [key, value] of Object.entries(cssProps))
      document.body.style.setProperty(key, value);
  });

  //Set PWA theme color
  let settledShown = false;
  createEffect(() => {
    const states = [state.appDrawer()?.state, state.diagDrawer()?.state];
    const moving = states.includes(SlideState.MOVING);
    const shown = states.some(
      (s) => s === SlideState.SHOWN || s === SlideState.SHOWING,
    );

    // Switch as soon as a drawer starts moving, a swipe heads to the other side
    const drawerShown = moving ? !settledShown : shown;
    if (!moving) settledShown = shown;

    const color =
      getCssProps()[
        bannerShown()
          ? "--md-sys-color-primary-container"
          : drawerShown
            ? "--md-sys-color-surface-container-low"
            : "--md-sys-color-surface-container-high"
      ];

    for (const meta of document.head.querySelectorAll("meta[name=theme-color]"))
      (meta as HTMLMetaElement).content = color;

    // Shows behind the status bar and home indicator, so match the app's top
    // and bottom edges (the chat when open, otherwise the sidebar)
    const props = getCssProps();
    const top =
      props[
        drawerShown
          ? "--md-sys-color-surface-container-low"
          : "--md-sys-color-surface-container-high"
      ];
    const bottom =
      props[
        drawerShown
          ? "--md-sys-color-surface-container-lowest"
          : "--md-sys-color-surface-container-high"
      ];
    document.documentElement.style.background =
      document.body.style.background = `linear-gradient(${top} 50%, ${bottom} 50%)`;
  });

  //Match system UI (keyboard, form controls) to the theme
  createEffect(() => {
    document.documentElement.style.colorScheme = state.theme.activeTheme
      .darkMode
      ? "dark"
      : "light";
  });

  return <Masks />;
}
