import { JSX, createMemo } from "solid-js";

import { css } from "styled-system/css";
import { splitCssProps } from "styled-system/jsx";
import { HTMLStyledProps } from "styled-system/types";

interface Props {
  /**
   * Whether to use the filled version of this symbol.
   * Filled symbols should only be used when there is an active state (ex: pages in a nav bar or toggled icon buttons).
   */
  fill?: boolean;
  /**
   * Font size for the symbol. This can be a number (in pixels) or any valid CSS size string (ex: "24px", "1.5em", "2rem").
   */
  fontSize?: string | number;
  /**
   * The grade of the symbol, which adjusts the weight slightly. This can be a number between -25 and 700. To preview use the Google Fonts web app.
   */
  grade?: number;
  /**
   * The optical size of the symbol, which adjusts the design for different sizes. This should be "auto" unless it causes issues.
   */
  opticalSize?: number | "auto";
  /**
   * The type of symbol to use. This can be "outlined", "rounded", or "sharp". Defaults to "outlined".
   */
  type?: "outlined" | "rounded" | "sharp";
  /**
   * The weight of the symbol, which adjusts the thickness of the lines. This can be a number between 100 and 700.
   */
  weight?: number;
  /**
   * The symbol to display. This should be the exact text name of the symbol as defined by Google. See https://fonts.google.com/icons for a list of available symbols.
   */
  children: string | JSX.Element;
  /**
   * Symbol size
   */
  size?: number;
}

export function Symbol({
  fill = false,
  fontSize = "inherit",
  grade = 0,
  opticalSize = "auto",
  weight = 400,
  type = "outlined",
  size,
  ...props
}: Props & HTMLStyledProps<"span">) {
  const [cssProps, restProps] = splitCssProps(props);
  const { css: cssProp, ...styleProps } = cssProps;
  const memoClassName = createMemo(() => {
    return css(
      {
        fontSize: "inherit",
        fontWeight: `${weight} !important`,
        fontOpticalSizing: opticalSize === "auto" ? "auto" : undefined,
      },
      styleProps,
      cssProp,
    );
  });

  const memoFontVarSettings = createMemo(() => {
    return `"FILL" ${fill ? 1 : 0}, "wght" 400, "GRAD" ${grade}${
      opticalSize === "auto" ? "" : `, "opsz" ${opticalSize}`
    }`;
  });

  return (
    <span
      class={`material-symbols-${type} ${memoClassName()}`}
      style={{
        "font-variation-settings": memoFontVarSettings(),
        "font-size": size ? `${size}px` : undefined,
      }}
      aria-hidden="true"
      {...restProps}
    />
  );
}
