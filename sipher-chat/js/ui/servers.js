import { append, clear, colorFor, h, icon, initials } from "../dom.js";

// The vertical strip of server icons on the far left.
export function renderServerRail(el, { servers, serverId }, actions) {
  append(clear(el), [
    h(
      "div",
      { class: "rail-item rail-home", title: "Sipher" },
      h("div", { class: "rail-icon home" }, "S"),
    ),
    h("div", { class: "rail-sep" }),
    servers.map((s) =>
      h(
        "div",
        { class: `rail-item${s.id === serverId ? " active" : ""}` },
        h("span", { class: "rail-pill" }),
        h(
          "button",
          {
            class: "rail-icon",
            title: s.name,
            "aria-label": s.name,
            style: s.id === serverId ? { background: colorFor(s.id) } : null,
            onclick: () => actions.openServer(s.id),
          },
          initials(s.name),
        ),
      ),
    ),
    h(
      "div",
      { class: "rail-item" },
      h(
        "button",
        {
          class: "rail-icon add",
          title: "Add a server",
          "aria-label": "Add a server",
          onclick: actions.addServer,
        },
        icon("plus", 22),
      ),
    ),
  ]);
}
