import { EditorView, keymap } from "@codemirror/view";
import {
  autocompletion,
  closeCompletion,
  currentCompletions,
} from "@codemirror/autocomplete";
import { AutoCompleteSearchSpace } from "../../utils/autoComplete";
import { codeMirrorAutoCompleteSource } from "./codeMirrorAutoCompleteSource";
import { Accessor } from "solid-js";

const completionTheme = EditorView.theme({
  ".cm-scroller": {
    "font-family": "inherit",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "border": "none",
    "display": "flex",
    "flex-direction": "column",
    "padding": "var(--gap-md) 0",
    "overflow": "hidden",
    "border-radius": "var(--borderRadius-xs)",
    "background": "var(--md-sys-color-surface-container)",
    "color": "var(--md-sys-color-on-surface)",
    "fill": "var(--md-sys-color-on-surface)",
    "box-shadow": "0 0 3px var(--md-sys-color-shadow)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    "min-width": "10em",
    "max-width": "50vw",
    "font-family": "inherit",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    "display": "flex",
    "align-items": "center",

    "cursor": "pointer",
    "gap": "var(--gap-md)",
    "background": "transparent",
    "padding": "var(--gap-sm) var(--gap-md)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected=\"true\"]": {
    background:
      "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
  },
  ".cm-completionMatchedText": {
    "text-decoration": "inherit",
  },
  ".cm-user-preview": {
    "display": "inline-block",
    "width": "24px",
    "height": "24px",
    "vertical-align": "baseline",
    // "margin-bottom": "-0.2em",
    "object-fit": "cover",
    "padding": "var(--gap-xxs)",
    "border-radius": "var(--borderRadius-circle)"
  },
  ".cm-emoji-preview": {
    "display": "inline-block",
    "width": "24px",
    "height": "24px",
    "vertical-align": "baseline",
    // "margin-bottom": "-0.2em",
    "object-fit": "contain",
    "padding": "var(--gap-xxs)",
  },
  ".cm-role-preview": {
    "display": "inline-block",
    "width": "12px",
    "height": "12px",
    "vertical-align": "baseline",
    // "margin-bottom": "-0.2em",
    "margin": "6px",
    "border-radius": "var(--borderRadius-circle)",
  }
});

export function codeMirrorAutoComplete(searchSpace?: Accessor<AutoCompleteSearchSpace>) {
  const extension = autocompletion({
    activateOnTyping: true,
    aboveCursor: true,
    icons: false,
    override: [codeMirrorAutoCompleteSource(() => searchSpace?.() ?? {})],
    closeOnBlur: false, // note: disable to debug styles
    tooltipClass: (state) => {
      const completions = currentCompletions(state);
      if (completions[0]?.type == "emoji") {
        return "autocomplete-tooltip autocomplete-tooltip-emoji";
      } else if (
        completions[0]?.type == "user" ||
        completions[0]?.type == "role"
      ) {
        return "autocomplete-tooltip autocomplete-tooltip-mention";
      } else if (completions[0]?.type == "channel") {
        return "autocomplete-tooltip autocomplete-tooltip-channel";
      } else {
        return "autocomplete-tooltip autocomplete-tooltip-unknown";
      }
    },
    optionClass: (completion) => "example-option-class",
    addToOptions: [
      {
        render: (completion, state, view) => {
          const blankSvg =
            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
          if (completion.type == "emoji") {
            const img = document.createElement("img");
            img.classList.add("cm-emoji-preview");
            img.loading = "lazy";
            img.src = (completion as never as { url: string }).url || blankSvg;
            return img;
          } else if (completion.type == "user") {
            const img = document.createElement("img");
            img.classList.add("cm-user-preview");
            img.loading = "lazy";
            img.src = (completion as never as { url: string }).url || blankSvg;
            return img;
          } else if (completion.type == "role") {
            const span = document.createElement("span");
            span.classList.add("cm-role-preview");
            span.style.background = (completion as never as { colour: string }).colour || 'var(--md-sys-color-surface-container-highest)';
            return span;
          } else if (completion.type == "channel") {
            const span = document.createElement("span");
            span.classList.add("cm-channel-preview");
            return span;
          } else {
            return null;
          }
        },
        position: 30,
      },
    ],
  });

  const emojiKeymap = keymap.of([
    {
      key: ":",
      run: (view) => {
        closeCompletion(view as never);
        return false;
      },
    },
  ]);

  return [extension, emojiKeymap, completionTheme];
}