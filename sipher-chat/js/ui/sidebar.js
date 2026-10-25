import { append, avatar, clear, h, icon } from "../dom.js";

// Server header, channel list and the user panel at the bottom.
export function renderSidebar(el, state, actions) {
  const { server, channels, channelId, profile, user } = state;
  const isOwner = server && server.ownerId === user.uid;

  let header;
  let body;
  let menu = null;
  if (server) {
    menu = h(
      "div",
      { class: "menu", hidden: true },
      h(
        "button",
        { class: "menu-item accent", onclick: actions.invite },
        "Invite People",
        icon("link", 16),
      ),
      isOwner &&
        h(
          "button",
          { class: "menu-item", onclick: actions.createChannel },
          "Create Channel",
          icon("plus", 16),
        ),
      isOwner &&
        h(
          "button",
          { class: "menu-item", onclick: actions.renameServer },
          "Server Settings",
          icon("gear", 16),
        ),
      h("div", { class: "menu-sep" }),
      isOwner
        ? h(
            "button",
            { class: "menu-item danger", onclick: actions.deleteServer },
            "Delete Server",
            icon("trash", 16),
          )
        : h(
            "button",
            { class: "menu-item danger", onclick: actions.leaveServer },
            "Leave Server",
            icon("logout", 16),
          ),
    );
    header = h(
      "button",
      {
        class: "sidebar-header",
        onclick: (e) => {
          e.stopPropagation();
          menu.hidden = !menu.hidden;
          if (!menu.hidden) {
            const hide = () => {
              menu.hidden = true;
              document.removeEventListener("click", hide);
            };
            document.addEventListener("click", hide);
          }
        },
      },
      h("span", { class: "truncate" }, server.name),
      icon("chevron", 18),
    );
    body = h(
      "div",
      { class: "channel-list" },
      h(
        "div",
        { class: "channel-group" },
        h("span", null, "Text Channels"),
        isOwner &&
          h(
            "button",
            {
              class: "icon-btn small",
              title: "Create Channel",
              onclick: actions.createChannel,
            },
            icon("plus", 16),
          ),
      ),
      channels.map((c) =>
        h(
          "div",
          { class: `channel${c.id === channelId ? " active" : ""}` },
          h(
            "button",
            { class: "channel-link", onclick: () => actions.openChannel(c.id) },
            icon("hash", 18),
            h("span", { class: "truncate" }, c.name),
          ),
          isOwner &&
            h(
              "button",
              {
                class: "icon-btn small channel-edit",
                title: "Edit Channel",
                onclick: () => actions.editChannel(c),
              },
              icon("gear", 14),
            ),
        ),
      ),
      channels.length === 0 &&
        h("p", { class: "muted pad" }, "No channels yet."),
    );
  } else {
    header = h("div", { class: "sidebar-header static" }, "Sipher");
    body = h(
      "div",
      { class: "channel-list" },
      h(
        "p",
        { class: "muted pad" },
        "Pick a server on the left, or create one with the + button.",
      ),
    );
  }

  const panel = h(
    "div",
    { class: "user-panel" },
    avatar({ ...profile, uid: user.uid }, 32),
    h(
      "div",
      { class: "user-panel-name" },
      h("div", { class: "truncate strong" }, profile.displayName),
      h("div", { class: "truncate muted small" }, user.email || "Online"),
    ),
    h(
      "button",
      {
        class: "icon-btn",
        title: "User Settings",
        onclick: actions.editProfile,
      },
      icon("gear", 18),
    ),
    h(
      "button",
      { class: "icon-btn", title: "Log Out", onclick: actions.signOut },
      icon("logout", 18),
    ),
  );

  append(clear(el), [header, menu, body, panel]);
}
