import { JSX } from "solid-js";

import { styled } from "styled-system/jsx";

const Codeblock = styled("pre", {
  base: {
    color: "#c9d1d9",
    background: "#0d1117",

    width: "fit-content",

    padding: "var(--space-100)",
    marginY: "var(--space-50)",
    borderRadius: "var(--borderRadius-md)",

    wordWrap: "break-word",
    whiteSpace: "pre-wrap",

    "&> code": {
      color: "inherit !important",
      background: "transparent !important",
    },
  },
});

/**
 * Render a code block with copy text button
 */
export function RenderCodeblock(props: {
  children: JSX.Element;
  class?: string;
}) {
  return <Codeblock>{props.children}</Codeblock>;
}
