import { MESSAGE_LIMIT } from "../api.js";
import { append, avatar, clear, h, icon } from "../dom.js";

const GROUP_GAP_MS = 7 * 60 * 1000;

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function toDate(ts) {
  return ts?.toDate ? ts.toDate() : new Date();
}

function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function stamp(date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return `Today at ${timeFmt.format(date)}`;
  if (sameDay(date, yesterday)) return `Yesterday at ${timeFmt.format(date)}`;
  return `${date.toLocaleDateString()} ${timeFmt.format(date)}`;
}

// ---- lightweight markdown: ```blocks```, `code`, **bold**, *italic*, links ----

const INLINE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\s][^*\n]*\*)|(https?:\/\/[^\s<]*[^\s<.,:;"')\]!?])/g;

function inline(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const [token, code, bold, italic, url] = m;
    if (code) out.push(h("code", { class: "inline-code" }, code.slice(1, -1)));
    else if (bold) out.push(h("strong", null, bold.slice(2, -2)));
    else if (italic) out.push(h("em", null, italic.slice(1, -1)));
    else if (url)
      out.push(
        h(
          "a",
          { href: url, target: "_blank", rel: "noopener noreferrer" },
          url,
        ),
      );
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function formatText(text) {
  return text
    .split(/```(?:[a-zA-Z0-9]*\n)?([\s\S]*?)```/g)
    .map((part, i) =>
      i % 2 ? h("pre", { class: "code-block" }, part) : inline(part),
    );
}

// ---- the chat pane ----

export function createChat(el, actions) {
  const drafts = new Map();
  let channel = null;
  let messages = [];
  let members = new Map();
  let me = null;
  let canModerate = false;
  let editingId = null;

  const title = h("div", { class: "chat-title" });
  const header = h(
    "header",
    { class: "chat-header" },
    h(
      "button",
      {
        class: "icon-btn mobile-only",
        title: "Channels",
        onclick: actions.toggleSidebar,
      },
      icon("menu"),
    ),
    title,
    h("div", { class: "spacer" }),
    h(
      "button",
      {
        class: "icon-btn",
        title: "Member List",
        onclick: actions.toggleMembers,
      },
      icon("users"),
    ),
  );
  const list = h("div", {
    class: "messages",
    role: "log",
    "aria-live": "polite",
  });
  const scroller = h("div", { class: "messages-scroller" }, list);

  const input = h("textarea", {
    class: "composer-input",
    rows: 1,
    maxLength: MESSAGE_LIMIT,
    oninput: () => {
      autosize(input);
      if (channel) drafts.set(channel.id, input.value);
    },
    onkeydown: (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        send();
      } else if (e.key === "ArrowUp" && !input.value) {
        const mine = [...messages].reverse().find((m) => m.authorId === me);
        if (mine) {
          e.preventDefault();
          startEdit(mine.id);
        }
      }
    },
  });
  const sendBtn = h(
    "button",
    { class: "icon-btn send", title: "Send", onclick: () => send() },
    icon("send"),
  );
  const composer = h(
    "div",
    { class: "composer" },
    h("div", { class: "composer-box" }, input, sendBtn),
  );

  const empty = h("div", { class: "chat-empty" });
  append(el, [header, scroller, composer, empty]);

  function autosize(t) {
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 240) + "px";
  }

  async function send() {
    const text = input.value.trim();
    if (!text || !channel) return;
    input.value = "";
    drafts.delete(channel.id);
    autosize(input);
    try {
      await actions.send(text);
    } catch {
      // actions.send already reported the error; give the text back.
      input.value = text;
      drafts.set(channel.id, text);
      autosize(input);
    }
  }

  function startEdit(id) {
    editingId = id;
    render(true);
  }

  function stopEdit() {
    editingId = null;
    render(false);
    input.focus();
  }

  function nearBottom() {
    return (
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 120
    );
  }

  function editor(msg) {
    const box = h("textarea", {
      class: "edit-input",
      value: msg.text,
      maxLength: MESSAGE_LIMIT,
      oninput: () => autosize(box),
      onkeydown: async (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          stopEdit();
        } else if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          save();
        }
      },
    });
    async function save() {
      const text = box.value.trim();
      if (!text) return actions.remove(msg).then(stopEdit);
      if (text !== msg.text) await actions.edit(msg, text);
      stopEdit();
    }
    queueMicrotask(() => {
      autosize(box);
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    });
    return h(
      "div",
      { class: "edit-wrap" },
      box,
      h(
        "div",
        { class: "edit-hint" },
        "escape to ",
        h("button", { class: "link-btn", onclick: stopEdit }, "cancel"),
        " • enter to ",
        h("button", { class: "link-btn", onclick: save }, "save"),
      ),
    );
  }

  function messageRow(msg, grouped) {
    const date = toDate(msg.createdAt);
    const author = members.get(msg.authorId) || {
      uid: msg.authorId,
      displayName: msg.authorName,
      photoURL: msg.authorPhoto,
    };
    const name = author.displayName || msg.authorName || "Unknown";
    const mine = msg.authorId === me;

    const content =
      msg.id === editingId
        ? editor(msg)
        : h(
            "div",
            { class: "message-text" },
            formatText(msg.text),
            msg.editedAt &&
              h(
                "span",
                { class: "edited", title: stamp(toDate(msg.editedAt)) },
                " (edited)",
              ),
          );

    const tools =
      (mine || canModerate) &&
      msg.id !== editingId &&
      h(
        "div",
        { class: "message-tools" },
        mine &&
          h(
            "button",
            {
              class: "icon-btn small",
              title: "Edit",
              onclick: () => startEdit(msg.id),
            },
            icon("edit", 16),
          ),
        h(
          "button",
          {
            class: "icon-btn small danger",
            title: "Delete",
            onclick: (e) => actions.remove(msg, e.shiftKey),
          },
          icon("trash", 16),
        ),
      );

    if (grouped) {
      return h(
        "div",
        {
          class: `message grouped${msg.pending ? " pending" : ""}`,
          dataset: { id: msg.id },
        },
        h(
          "span",
          { class: "message-gutter", title: stamp(date) },
          timeFmt.format(date),
        ),
        h("div", { class: "message-body" }, content),
        tools,
      );
    }
    return h(
      "div",
      {
        class: `message${msg.pending ? " pending" : ""}`,
        dataset: { id: msg.id },
      },
      h(
        "div",
        { class: "message-avatar" },
        avatar({ ...author, displayName: name }, 40),
      ),
      h(
        "div",
        { class: "message-body" },
        h(
          "div",
          { class: "message-meta" },
          h("span", { class: "message-author" }, name),
          h(
            "span",
            { class: "message-time", title: date.toLocaleString() },
            stamp(date),
          ),
        ),
        content,
      ),
      tools,
    );
  }

  function render(keepScroll) {
    const stick = !keepScroll || nearBottom();
    const rows = [
      channel &&
        h(
          "div",
          { class: "channel-intro" },
          h("div", { class: "channel-intro-icon" }, icon("hash", 40)),
          h("h1", null, `Welcome to #${channel.name}!`),
          h(
            "p",
            { class: "muted" },
            `This is the start of the #${channel.name} channel.`,
          ),
        ),
    ];

    let prev = null;
    for (const msg of messages) {
      const date = toDate(msg.createdAt);
      const prevDate = prev && toDate(prev.createdAt);
      if (!prev || !sameDay(prevDate, date)) {
        rows.push(
          h(
            "div",
            { class: "day-divider" },
            h("span", null, dayFmt.format(date)),
          ),
        );
      }
      const grouped =
        prev &&
        prev.authorId === msg.authorId &&
        sameDay(prevDate, date) &&
        date - prevDate < GROUP_GAP_MS;
      rows.push(messageRow(msg, grouped));
      prev = msg;
    }

    append(clear(list), rows);
    if (stick) scroller.scrollTop = scroller.scrollHeight;
  }

  return {
    setContext(next) {
      me = next.uid;
      canModerate = next.canModerate;
      members = next.members;
      const changed = next.channel?.id !== channel?.id;
      channel = next.channel;

      el.classList.toggle("no-channel", !channel);
      clear(empty).append(next.emptyMessage || "");
      if (!channel) {
        clear(title);
        clear(list);
        return;
      }
      clear(title).append(
        icon("hash", 22),
        h("span", { class: "truncate" }, channel.name),
      );
      input.placeholder = `Message #${channel.name}`;

      if (changed) {
        editingId = null;
        messages = [];
        input.value = drafts.get(channel.id) || "";
        autosize(input);
        render(false);
        input.focus();
      } else {
        render(true);
      }
    },
    setMessages(next) {
      const first = messages.length === 0;
      messages = next;
      render(!first);
    },
  };
}
