import { append, avatar, clear, h, icon } from "../dom.js";

const ONLINE_WINDOW_MS = 2.5 * 60 * 1000;

export function isOnline(presence) {
  const seen = presence?.lastSeen?.toMillis?.();
  return seen != null && Date.now() - seen < ONLINE_WINDOW_MS;
}

function memberRow(m, presence, { canKick, onKick }) {
  const online = isOnline(presence);
  return h(
    "div",
    { class: `member${online ? "" : " offline"}` },
    h(
      "div",
      { class: "member-avatar" },
      avatar(m, 32),
      h("span", { class: `status-dot${online ? " on" : ""}` }),
    ),
    h(
      "div",
      { class: "member-name truncate" },
      m.displayName,
      m.role === "owner" &&
        h("span", { class: "owner-badge", title: "Server Owner" }, "👑"),
    ),
    canKick &&
      h(
        "button",
        {
          class: "icon-btn small danger member-kick",
          title: "Kick",
          onclick: () => onKick(m),
        },
        icon("x", 14),
      ),
  );
}

// Right-hand member list, split into online and offline.
export function renderMembers(el, { members, presence, ownerId, uid }, onKick) {
  const sorted = [...members].sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || ""),
  );
  const online = sorted.filter((m) => isOnline(presence.get(m.uid)));
  const offline = sorted.filter((m) => !isOnline(presence.get(m.uid)));
  const opts = (m) => ({ canKick: ownerId === uid && m.uid !== uid, onKick });

  append(clear(el), [
    online.length > 0 &&
      h("div", { class: "member-group" }, `Online — ${online.length}`),
    online.map((m) => memberRow(m, presence.get(m.uid), opts(m))),
    offline.length > 0 &&
      h("div", { class: "member-group" }, `Offline — ${offline.length}`),
    offline.map((m) => memberRow(m, presence.get(m.uid), opts(m))),
  ]);
}
