import { Accessor, createSignal } from "solid-js";

import { Fonts, MonospaceFonts } from "@revolt/ui/themes/fonts";

import { State } from "..";

import { AbstractStore } from ".";

export type TypeTheme = {
  /**
   * Base theme preset
   */
  preset: "you";

  /**
   * Light/dark mode
   */
  mode: "light" | "dark" | "system";

  /**
   * Accent
   * (Material You)
   */
  m3Accent: string;

  /**
   * Constrast
   * (Material You)
   */
  m3Contrast: number;

  /**
   * Variant
   * (Material You)
   */
  m3Variant:
    | "monochrome"
    | "neutral"
    | "tonal_spot"
    | "vibrant"
    | "expressive"
    | "fidelity"
    | "content"
    | "rainbow"
    | "fruit_salad";

  /**
   * Whether to permit blurry surfaces
   */
  blur: boolean;

  /**
   * Interface font
   */
  interfaceFont: Fonts;

  /**
   * Monospace font
   */
  monospaceFont: MonospaceFonts;

  /**
   * Message size
   */
  messageSize: number;

  /**
   * Spacing between message groups
   */
  messageGroupSpacing: number;
};

export type SelectedTheme = Pick & {
  preset: "you";
  darkMode: boolean;

  accent: string;
  contrast: number;
  variant: TypeTheme["m3Variant"];
};

/**
 * Manages theme information
 */
export class Theme extends AbstractStore {
  prefersDark: Accessor;

  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "theme");

    // handle prefers-color-scheme value and changes
    const [prefersDark, setPrefersDark] = createSignal(
      window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    this.prefersDark = prefersDark;

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => setPrefersDark(event.matches));

    this.toggleBlur = this.toggleBlur.bind(this);
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    /** nothing needs to be done */
  }

  /**
   * Generate default values
   */
  default(): TypeTheme {
    return {
      preset: "you",
      mode: "system",

      m3Accent: "#5470ec",
      m3Contrast: 0.0,
      m3Variant: "tonal_spot",

      interfaceFont: "Inter",
      monospaceFont: "Fira Code",

      blur: true,
      messageSize: 14,
      messageGroupSpacing: 12,
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial): TypeTheme {
    const data: TypeTheme = this.default();

    if (["light", "dark", "system"].includes(input.mode!)) {
      data.mode = input.mode!;
    }

    if (["you", "neutral"].includes(input.preset!)) {
      data.preset = input.preset!;
    }

    if (typeof input.m3Contrast === "number") {
      data.m3Contrast = input.m3Contrast;
    }

    if (
      input.m3Accent &&
      input.m3Accent.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})/)
    ) {
      data.m3Accent = input.m3Accent;
    }

    if (
      [
        "monochrome",
        "neutral",
        "tonal_spot",
        "vibrant",
        "expressive",
        "fidelity",
        "content",
        "rainbow",
        "fruit_salad",
      ].includes(input.m3Variant!)
    ) {
      data.m3Variant = input.m3Variant!;
    }

    if (typeof input.blur === "boolean") {
      data.blur = input.blur;
    }

    if (typeof input.messageSize === "number") {
      data.messageSize = input.messageSize;
    }

    if (typeof input.messageGroupSpacing === "number") {
      data.messageGroupSpacing = input.messageGroupSpacing;
    }

    return data;
  }

  /**
   * Get the currently selected theme (considering system settings)
   */
  get activeTheme(): SelectedTheme {
    const opts = this.get();

    switch (opts.preset) {
      case "you":
        return {
          blur: opts.blur,
          interfaceFont: opts.interfaceFont,
          monospaceFont: opts.monospaceFont,
          messageSize: opts.messageSize,
          messageGroupSpacing: opts.messageGroupSpacing,
          preset: "you",
          darkMode:
            opts.mode === "dark" ||
            (opts.mode === "system" && this.prefersDark()),

          accent: opts.m3Accent,
          contrast: opts.m3Contrast,
          variant: opts.m3Variant,
        };
    }
  }

  /**
   * Get light/dark/system mode
   */
  get mode() {
    return this.get().mode;
  }

  /**
   * Set light/dark/system mode
   * @param mode Mode
   */
  setMode(mode: TypeTheme["mode"]) {
    this.set("mode", mode);
  }

  /**
   * Get current preset
   */
  get preset() {
    return this.get().preset;
  }

  /**
   * Set the active preset
   * @param preset Preset
   */
  setPreset(preset: TypeTheme["preset"]) {
    this.set("preset", preset);
  }

  /**
   * Get current accent
   */
  get m3Accent() {
    return this.get().m3Accent;
  }

  /**
   * Set the accent of the Material You theme
   * @param accent Accent
   */
  setM3Accent(accent: string) {
    this.set("m3Accent", accent);
  }

  /**
   * Get current contrast
   */
  get m3Contrast() {
    return this.get().m3Contrast;
  }

  /**
   * Set the contrast of the Material You theme
   * @param contrast Contrast
   */
  setM3Contrast(contrast: number) {
    this.set("m3Contrast", contrast);
  }

  /**
   * Get current variant
   */
  get m3Variant() {
    return this.get().m3Variant;
  }

  /**
   * Set the variant of the Material You theme
   * @param variant Variant
   */
  setM3Variant(variant: TypeTheme["m3Variant"]) {
    this.set("m3Variant", variant);
  }

  /**
   * Get current blur state
   */
  get blur() {
    return this.get().blur;
  }

  /**
   * Toggle blur state
   */
  toggleBlur() {
    this.set("blur", !this.blur);
  }

  /**
   * Get current interface font
   */
  get interfaceFont() {
    return this.get().interfaceFont;
  }

  /**
   * Set interface font
   */
  setInterfaceFont(font: Fonts) {
    return this.set("interfaceFont", font);
  }

  /**
   * Get current monospace font
   */
  get monospaceFont() {
    return this.get().monospaceFont;
  }

  /**
   * Set monospace font
   */
  setMonospaceFont(font: MonospaceFonts) {
    return this.set("monospaceFont", font);
  }

  /**
   * Get current message size
   */
  get messageSize() {
    return this.get().messageSize;
  }

  /**
   * Set message size
   */
  set messageSize(size: number) {
    this.set("messageSize", size);
  }

  /**
   * Get current message group spacing
   */
  get messageGroupSpacing() {
    return this.get().messageGroupSpacing;
  }

  /**
   * Set message group spacing
   */
  set messageGroupSpacing(space: number) {
    this.set("messageGroupSpacing", space);
  }
}
