import { Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView, Decoration } from "@codemirror/view";

// Use a canvas element to measure the width of a string in the given font.
// Used to calculate the correct monospace character width for indentation.
function measureTextWidth(text: string, font: string): number {
  // Cache the canvas element
  const canvas: HTMLCanvasElement =
    (measureTextWidth as any).canvas ??
    ((measureTextWidth as any).canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  if (context === null) return 0;
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCanvasFont(elem: HTMLElement): string {
  let style = window.getComputedStyle(elem, null);
  const fontWeight = style.getPropertyValue("font-weight") || "normal";
  const fontSize = style.getPropertyValue("font-size") || "16px";
  const fontFamily = style.getPropertyValue("font-family") || "sans-serif";
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

interface CharacterWidth {
  mainFont: string;
  monoFont: string;
  width: number;
}

const CharacterWidthEffect = StateEffect.define<CharacterWidth | null>({});
const CharacterWidthField = StateField.define<CharacterWidth | null>({
  create() {
    return null;
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(CharacterWidthEffect)) return effect.value;
    }
    return value;
  },
});

// Manually track an calculate character widths; defaultCharacterWidth
// isn't reliable in non-monospace or mixed-font environments.
const characterWidthListener = EditorView.updateListener.of((viewupdate) => {
  let prev = viewupdate.view.state.field(CharacterWidthField, false);

  // Check for font size changes
  let mainFont = getCanvasFont(viewupdate.view.dom);
  if (mainFont !== prev?.mainFont) {
    // Determine the font and font size used for the indentation decorations
    let dummy_elem = document.createElement("span");
    dummy_elem.classList.add("linewrap-whitespace");
    dummy_elem.style.display = "none";
    viewupdate.view.contentDOM.appendChild(dummy_elem);
    let monoFont = getCanvasFont(dummy_elem);
    dummy_elem.remove();

    if (monoFont !== prev?.monoFont) {
      // Measure the width of a single space character (averaging
      // across 16 for precision reasons).
      let width = measureTextWidth(" ".repeat(16), monoFont) / 16.0;
      viewupdate.view.dispatch({
        effects: [
          CharacterWidthEffect.of({
            mainFont,
            monoFont,
            width,
          }),
        ],
      });
    }
  }
});

// A facet that controls the maximum indentation preserved by the line
// wrapping plugin, to ensure that text is still readable at high
// indentation levels. used for measuring
export const MaxIndentation = Facet.define<number, number>({
  combine: (values) => values[values.length - 1] || 48,
});

const whitespaceDecoration = Decoration.mark({
  attributes: { class: "linewrap-whitespace" },
});

const lineWrapDecorations = StateField.define({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    let oldCharWidth = tr.startState.field(CharacterWidthField, false)?.width;
    let charWidth = tr.state.field(CharacterWidthField, false)?.width;

    if (charWidth == null) return Decoration.none;
    if (!tr.docChanged && charWidth === oldCharWidth) {
      if (deco !== Decoration.none) return deco;
    }

    let maxIndent = tr.state.facet(MaxIndentation);
    let tabSize = tr.state.tabSize;

    function monospaceWidth(str: string): number {
      return Array.from(str).reduce((n, c) => {
        switch (c) {
          case "\t":
            return n + (tabSize - (n % tabSize));
          case " ":
            return n + 1;
          default:
            return n + 1;
        }
      }, 0);
    }

    // TODO: more efficient decoration rebuilding? (Only on changed lines?)
    let decorations = [];

    for (let i = 0; i < tr.state.doc.lines; i++) {
      let line = tr.state.doc.line(i + 1);
      if (line.length === 0) continue;

      // Match leading whitespace, markdown lists, GFM task lists, and blockquotes
      let matched_chars =
        /^(\s*)(?:(?:(?:[-*+]\s|\d+\.\s)\s*(?:\[[\sxX]\]\s+)?|>\s+))*/;
      let groups = matched_chars.exec(line.text) ?? [""];

      // let offset = Math.min(getTextWidth(groups[0], monoFont), maxIndent * charWidth);
      let offset = Math.min(monospaceWidth(groups[0]), maxIndent) * charWidth;
      if (groups[0].length === 0 || offset === 0) continue;

      const lineDecoration = Decoration.line({
        attributes: {
          style: `--indented: ${offset}px;`,
          class: "linewrap-indent",
        },
      });
      decorations.push(lineDecoration.range(line.from, line.from));
      decorations.push(
        whitespaceDecoration.range(line.from, line.from + groups[0].length),
      );
    }

    return Decoration.set(decorations, false);
  },
  provide(f) {
    return EditorView.decorations.from(f);
  },
});

const lineWrapStyles = EditorView.theme({
  ".cm-line.linewrap-indent": {
    // The tiny offset appears to make the indent more reliable,
    // for unknown reasons.
    "text-indent": "calc(-1 * var(--indented) - 0.1px)",
    "padding-left": "calc(var(--indented) + var(--cm-left-padding, 4px))",
  },
  ".linewrap-whitespace": {
    "font-family": "monospace, monospace",
    // Prevent slightly-oversided monospace fonts from changing line heights
    // when indented, but also changes the height of lines with only whitespace...
    // "font-size": "0.9em",
  },
  ".cm-line > *": {
    "text-indent": "0",
  },
});

export const smartLineWrapping = [
  EditorView.lineWrapping,
  CharacterWidthField,
  MaxIndentation.of(48),
  characterWidthListener,
  lineWrapDecorations,
  lineWrapStyles,
];
