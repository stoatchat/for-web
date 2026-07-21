import { createEffect, createMemo } from "solid-js";

import ClientController, { State } from "@revolt/client/Controller";
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
export function LoadTheme(props: { cliCtx?: ClientController }) {
  const state = useState();

  const getCssProps = createMemo(() => {
    const activeTheme = state.theme.activeTheme;

    // load fonts
    FONTS[state.theme.interfaceFont].load();
    MONOSPACE_FONTS[state.theme.monospaceFont].load();

    const cssProps = {
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

    for (const [key, value] of Object.entries(cssProps))
      document.body.style.setProperty(key, value);

    return cssProps;
  });

  //Set PWA theme color
  createEffect(() => {
    const cssProps = getCssProps(),
      dShown =
        state.appDrawer()?.state === SlideState.SHOWN ||
        state.diagDrawer()?.state === SlideState.SHOWN;

    const banner =
      props.cliCtx &&
      [
        State.Connecting,
        State.Disconnected,
        State.Reconnecting,
        State.Offline,
      ].includes(props.cliCtx.lifecycle.state());

    for (const meta of document.head.querySelectorAll("meta[name=theme-color]"))
      (meta as HTMLMetaElement).content =
        cssProps[
          banner
            ? "--md-sys-color-primary-container"
            : dShown
              ? "--md-sys-color-surface-container-low"
              : "--md-sys-color-surface-container-high"
        ];
  });

  return <Masks />;
}
