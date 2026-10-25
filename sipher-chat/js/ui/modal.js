import { h, icon } from "../dom.js";

// Opens a modal dialog. `render(close)` returns the dialog body.
export function openModal({ title, subtitle, render, onClose }) {
  const host = document.getElementById("root");
  const previousFocus = document.activeElement;

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
    onClose?.();
    previousFocus?.focus?.();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  }

  const dialog = h(
    "div",
    {
      class: "modal",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title,
    },
    h(
      "button",
      { class: "modal-close icon-btn", title: "Close", onclick: close },
      icon("x"),
    ),
    h("h2", { class: "modal-title" }, title),
    subtitle && h("p", { class: "modal-subtitle" }, subtitle),
    render(close),
  );
  const overlay = h(
    "div",
    {
      class: "overlay",
      onmousedown: (e) => {
        if (e.target === overlay) close();
      },
    },
    dialog,
  );

  host.append(overlay);
  document.addEventListener("keydown", onKey, true);
  dialog.querySelector("input, textarea, button.primary")?.focus();
  return close;
}

// Asks for a single line of text. Resolves to the value, or null if cancelled.
export function promptModal({
  title,
  subtitle,
  label,
  value = "",
  placeholder = "",
  confirm = "Save",
  maxLength = 100,
}) {
  return new Promise((resolve) => {
    let result = null;
    openModal({
      title,
      subtitle,
      onClose: () => resolve(result),
      render: (close) => {
        const input = h("input", {
          class: "input",
          value,
          placeholder,
          maxLength,
          required: true,
        });
        return h(
          "form",
          {
            class: "modal-form",
            onsubmit: (e) => {
              e.preventDefault();
              const v = input.value.trim();
              if (!v) return;
              result = v;
              close();
            },
          },
          h(
            "label",
            { class: "field" },
            h("span", { class: "field-label" }, label),
            input,
          ),
          h(
            "div",
            { class: "modal-actions" },
            h(
              "button",
              { type: "button", class: "btn ghost", onclick: close },
              "Cancel",
            ),
            h("button", { type: "submit", class: "btn primary" }, confirm),
          ),
        );
      },
    });
  });
}

export function confirmModal({
  title,
  message,
  confirm = "Confirm",
  danger = false,
}) {
  return new Promise((resolve) => {
    let result = false;
    openModal({
      title,
      onClose: () => resolve(result),
      render: (close) =>
        h(
          "div",
          { class: "modal-form" },
          h("p", { class: "modal-text" }, message),
          h(
            "div",
            { class: "modal-actions" },
            h("button", { class: "btn ghost", onclick: close }, "Cancel"),
            h(
              "button",
              {
                class: `btn primary${danger ? " danger" : ""}`,
                onclick: () => {
                  result = true;
                  close();
                },
              },
              confirm,
            ),
          ),
        ),
    });
  });
}
