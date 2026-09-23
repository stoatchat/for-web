import { createMemo, JSX, splitProps } from "solid-js";

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
   * The grade of the symbol, which adjusts the weight slightly. This can be a number between -25 and 700. To preview use the Google Fonts web app.
   */
  grade?: number;
  /**
   * The optical size of the symbol, which adjusts the design for different sizes.
   * Defaults to auto. This should be unset unless it causes issues.
   */
  opticalSize?: number;
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

export function Symbol(rawProps: Props & HTMLStyledProps<"span">) {
  const [local, props] = splitProps(rawProps, [
    "fill",
    "fontSize",
    "grade",
    "opticalSize",
    "weight",
    "type",
    "size",
  ]);

  const [cssProps, restProps] = splitCssProps(props);
  const className = createMemo(
    () =>
      `material-symbols-${local.type ?? "outlined"} ${css(
        { display: "block !important", userSelect: "none" },
        cssProps,
      )}`,
  );
  const fontVarSettings = createMemo(
    () =>
      `"FILL" ${local.fill ? 1 : 0}, "wght" ${local.weight ?? 400}, "GRAD" ${local.grade ?? 0}${
        local.opticalSize ? `, "opsz" ${local.opticalSize}` : ""
      }`,
  );

  return (
    <span
      class={className()}
      style={{
        "font-variation-settings": fontVarSettings(),
        "font-size": local.size ? `${local.size}px` : undefined,
      }}
      aria-hidden="true"
      {...restProps}
      // @codegen directives props=props include=floating
    />
  );
}
