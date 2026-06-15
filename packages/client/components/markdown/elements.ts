import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import type { SystemStyleObject } from "styled-system/types";

const inlineCodeStyles: SystemStyleObject = {
  flexShrink: 0,
  padding: "1px 4px",
  borderRadius: "var(--borderRadius-md)",

  color: "#c9d1d9",
  background: "#0d1117",
};

export const paragraph = styled("p", {
  base: {
    "&>code": inlineCodeStyles,
  },
  variants: {
    emojiSize: {
      small: {
        // inherit default
      },
      medium: {
        "--emoji-size": "var(--emoji-size-medium)",
      },
      large: {
        "--emoji-size": "var(--emoji-size-large)",
      },
    },
  },
});

export const emphasis = styled("em", {
  base: {
    fontStyle: "italic",
  },
});

export const strong = styled("strong", {
  base: {
    fontWeight: "bold",
  },
});

export const strikethrough = styled("del", {
  base: {
    textDecoration: "line-through",
  },
});

export const heading1 = styled("h1", {
  base: {
    fontSize: "2em",
    fontWeight: 600,
  },
});

export const heading2 = styled("h2", {
  base: {
    fontSize: "1.6em",
    fontWeight: 600,
  },
});

export const heading3 = styled("h3", {
  base: {
    fontSize: "1.4em",
    fontWeight: 600,
  },
});

export const heading4 = styled("h4", {
  base: {
    fontSize: "1.2em",
    fontWeight: 600,
  },
});

export const heading5 = styled("h5", {
  base: {
    fontSize: "1em",
    fontWeight: 600,
  },
});

export const heading6 = styled("h6", {
  base: {
    fontSize: "0.8em",
    fontWeight: 600,
  },
});

export const listItem = styled("li", {
  base: {},
});

export const unorderedList = styled("ul", {
  base: {
    listStylePosition: "outside",
    paddingLeft: "1.5em",

    "& li": {
      listStyleType: "disc",
    },

    "& li li": {
      listStyleType: "circle",
    },
  },
});

export const orderedList = styled("ol", {
  base: {
    listStylePosition: "outside",
    paddingLeft: "1.5em",
    listStyleType: "none",
    counterReset: "list-counter var(--start-number, 0)",

    "& li": {
      display: "list-item",
      counterIncrement: "list-counter",

      "&::before": {
        content: 'counter(list-counter) ". "',
        fontWeight: "inherit",
      },
    },
  },
});

export const blockquote = styled("blockquote", {
  base: {
    margin: "var(--gap-sm) 0",
    padding: "var(--gap-sm) var(--gap-md)",
    borderRadius: "var(--borderRadius-sm)",
    borderInlineStart: "var(--gap-sm) solid var(--border)",

    "&, & > blockquote > blockquote": {
      color: "var(--md-sys-color-on-secondary-container)",
      background: "var(--md-sys-color-secondary-container)",
      "--border": "var(--md-sys-color-secondary)",
    },

    "& > blockquote, & > blockquote > blockquote > blockquote": {
      color: "var(--md-sys-color-on-tertiary-container)",
      background: "var(--md-sys-color-tertiary-container)",
      "--border": "var(--md-sys-color-tertiary)",
    },

    "& blockquote": {
      borderBlock: "1px solid var(--border)",
      borderInlineEnd: "1px solid var(--border)",
    },
  },
});

export const table = styled("table", {
  base: {
    borderCollapse: "collapse",
  },
});

export const tableHeader = styled("th", {
  base: {
    fontWeight: 600,
    padding: "var(--gap-sm)",
    border: "1px solid var(--md-sys-color-outline)",
  },
});

export const tableElement = styled("td", {
  base: {
    padding: "var(--gap-sm)",
    border: "1px solid var(--md-sys-color-outline)",
  },
});

export const code = styled("code", {
  base: {
    fontFamily: "var(--fonts-monospace)",
  },
});

export const time = cva({
  base: inlineCodeStyles,
});

export const img = styled("img", {
  base: {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "var(--borderRadius-md)",
  },
});
