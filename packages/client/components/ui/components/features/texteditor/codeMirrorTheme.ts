import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

export const baseTheme = EditorView.theme({
  "&": {
    background: "transparent",
  },
  ".cm-line": {
    padding: "0px 2px 0px 6px",
    "--cm-left-padding": "6px",
  },
  ".cm-content": {
    fontFamily: "inherit",
    color: "var(--md-sys-color-on-surface)",
    background: "transparent",
    caretColor: "var(--md-sys-color-on-surface)",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--md-sys-color-on-surface)",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    color: "var(--md-sys-color-on-primary-container)",
    backgroundColor: "var(--md-sys-color-primary-container)",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
  },
});

export const markdownHighlightStyle = HighlightStyle.define([
  // Markdown tags: https://github.com/lezer-parser/markdown/blob/cf927e8142398d41b1c122e8a2827cd6e9e39eed/src/markdown.ts#L1880
  { tag: t.heading1, class: "md-h1" },
  { tag: t.heading2, class: "md-h2" },
  { tag: t.heading3, class: "md-h3" },
  { tag: t.heading4, class: "md-h4" },
  { tag: t.heading5, class: "md-h5" },
  { tag: t.heading6, class: "md-h6" },

  { tag: t.emphasis, class: "md-emph" },
  { tag: t.strong, class: "md-bold" },
  { tag: t.strikethrough, class: "md-strikethrough" },

  { tag: t.processingInstruction, class: "md-meta" },
  { tag: t.list, class: "md-list" },
  { tag: t.quote, class: "md-quote" },
  { tag: t.contentSeparator, class: "md-hr" },

  { tag: t.atom, class: "md-meta-atom" },

  // { tag: t.comment, class: "md-comment" },
  { tag: t.link, class: "md-link" },
  { tag: t.url, class: "md-link" },
  { tag: t.monospace, class: "md-code" },
  { tag: t.content, class: "md-text" },
]);

export const markdownTheme = [
  baseTheme,
  syntaxHighlighting(markdownHighlightStyle),
];
