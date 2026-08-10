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
  createEffect(() => {
    const drawerShown =
      state.appDrawer()?.state === SlideState.SHOWN ||
      state.diagDrawer()?.state === SlideState.SHOWN;

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
  });

  return <Masks />;
}
