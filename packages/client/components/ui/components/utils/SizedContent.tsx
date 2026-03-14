import { JSX, createMemo } from "solid-js";

import { styled } from "styled-system/jsx";

interface Props {
  /**
   * Pixel width of the content
   */
  width?: number;

  /**
   * Pixel height of the content
   */
  height?: number;

  /**
   * The content itself
   */
  children: JSX.Element;

  class?: string;
}

const MIN_W = 160,
  MIN_H = 120,
  MAX_S = 420;

/**
 * Automatic message content sizing for images, videos and embeds
 */
export function SizedContent(props: Props) {
  const style = createMemo(() => {
    const width = props.width!,
      height = props.height!;

    const setW =
      (height > width
        ? Math.floor(
            (width * Math.min(Math.max(height, MIN_H), MAX_S)) / height,
          ) //Set from height
        : Math.min(Math.max(width, MIN_W), MAX_S)) || MAX_S; //Set from width

    const sty: JSX.CSSProperties = { width: `min(${setW}px, 100%)` };
    if (width && height) sty["aspect-ratio"] = `${width}/${height}`;
    return sty;
  });

  return (
    <Container class={props.class} style={style()}>
      {props.children}
    </Container>
  );
}

const Container = styled("div", {
  base: {
    display: "grid",
    height: "auto",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-md)",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",

    // scale to size of container
    "& > *": {
      // top-left corner to bottom-right corner
      gridArea: "1 / 1 / 2 / 2",
      width: "100%",
      height: "100%",

      // special case for images
      minHeight: 0,
      objectFit: "contain",
    },
  },
});
