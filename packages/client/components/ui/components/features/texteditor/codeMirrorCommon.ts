import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";

export function isInCodeBlock(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  let inCode = false;
  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (
        (node.type.name === "InlineCode" ||
          node.type.name === "FencedCode" ||
          node.type.name === "CodeText") &&
        node.to != from &&
        node.from != to
      ) {
        inCode = true;
        return false;
      }
    },
  });
  return inCode;
}

export function isInFencedCodeBlock(
  state: EditorState,
  from: number,
  to: number,
): boolean {
  let inFencedCode = false;
  let fencedCodeStart = 0;
  let fencedCodeEnd = 0;
  syntaxTree(state).iterate({
    from: from,
    to: to,
    enter(node) {
      switch (node.type.name) {
        case "FencedCode":
          fencedCodeStart = node.from;
          fencedCodeEnd = node.to;
          inFencedCode = true;
          return true;
        case "CodeMark":
          if (
            node.to >= fencedCodeEnd &&
            node.from != fencedCodeStart &&
            to >= node.to
          ) {
            inFencedCode = false;
          }
          return false;
        case "InlineCode":
          return false;
        default:
          return true;
      }
    },
  });
  return inFencedCode;
}
