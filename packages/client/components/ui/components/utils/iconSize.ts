/**
 * Generate SVG props to configure icon size
 * @param size Target size
 * @param viewBox Custom view box if necessary
 * @returns Props
 */
export function iconSize(size: string | number, viewBox?: string) {
  return {
    width: size,
    height: size,
    viewBox: viewBox ?? "0 0 24 24",
  };
}

/**
 * @deprecated Use [Symbol](Symbol.tsx) component to render Material Symbols
 * 
 * Generate SVG props to configure symbol icon size
 * @param size Target size
 * @returns Props
 */
export function symbolSize(size: string | number) {
  return {
    width: size,
    height: size,
  };
}
