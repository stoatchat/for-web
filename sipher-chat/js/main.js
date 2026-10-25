import {
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import * as api from "./api.js";
import { clear, h, toast } from "./dom.js";
import { auth } from "./firebase.js";
import { renderAuth } from "./ui/auth.js";
import { createChat } from "./ui/chat.js";
import { renderMembers } from "./ui/members.js";
import { confirmModal, openModal, promptModal } from "./ui/modal.js";
import { renderServerRail } from "./ui/servers.js";
import { renderSidebar } from "./ui/sidebar.js";

const appEl = document.getElementById("app");
const PRESENCE_INTERVAL_MS = 60 * 1000;

const state = {
  user: null,
  profile: null,
  servers: [],
  serverId: null,
  server: null,
  channels: [],
  channelsLoaded: false,
  channelId: null,
  members: [],
  presence: new Map(),
};

// Active Firestore listeners, so they can be torn down when switching views.
const subs = {
  profile: null,
  servers: null,
  server: null,
  channels: null,
  members: null,
  messages: null,
};
const presenceSubs = new Map();
let timers = [];
let ui = null;
// The channel subs.messages is listening to.
let messagesChannel = null;

// ---- small utilities ----

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable (private mode); these are just conveniences.
    }
  },
};

function stop(key) {
  subs[key]?.();
  subs[key] = null;
}

function stopPresence() {
  for (const unsub of presenceSubs.values()) unsub();
  presenceSubs.clear();
  state.presence = new Map();
}

function teardown() {
  Object.keys(subs).forEach(stop);
  stopPresence();
  timers.forEach(clearInterval);
  timers = [];
}

function report(err, fallback = "Something went wrong.") {
  console.error(err);
  const text =
    err?.code === "permission-denied"
      ? "You don't have permission to do that."
      : err?.message || fallback;
  toast(text, "error");
}

// Runs an action and turns failures into a toast.
function guarded(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      report(err);
    }
  };
}

function currentChannel() {
  return state.channels.find((c) => c.id === state.channelId) || null;
}

function isOwner() {
  return state.server?.ownerId === state.user?.uid;
}

function memberMap() {
  return new Map(state.members.map((m) => [m.uid, m]));
}

function setHash(serverId, channelId) {
  const hash = serverId
    ? `#/${serverId}${channelId ? "/" + channelId : ""}`
    : "";
  if (location.hash !== hash)
    history.replaceState(null, "", location.pathname + location.search + hash);
}

function parseHash() {
  const [, serverId, channelId] = location.hash.split("/");
  return { serverId: serverId || null, channelId: channelId || null };
}

// ---- rendering ----

function buildLayout() {
  const rail = h("nav", { class: "server-rail", "aria-label": "Servers" });
  const sidebar = h("aside", { class: "sidebar" });
  const chatEl = h("main", { class: "chat" });
  const members = h("aside", { class: "member-list", "aria-label": "Members" });
  const scrim = h("div", {
    class: "scrim",
    onclick: () => root.classList.remove("show-sidebar"),
  });
  const root = h(
    "div",
    { class: "layout" },
    rail,
    sidebar,
    chatEl,
    members,
    scrim,
  );
  if (storage.get("sipher:hideMembers") === "1")
    root.classList.add("hide-members");

  clear(appEl).append(root);
  const chat = createChat(chatEl, chatActions);
  ui = { root, rail, sidebar, chat, members };
}

function renderRail() {
  renderServerRail(ui.rail, state, { openServer: navigateServer, addServer });
}

function renderSide() {
  renderSidebar(ui.sidebar, state, sidebarActions);
}

function renderChat() {
  let emptyMessage = "";
  if (!state.serverId) {
    emptyMessage =
      state.servers.length === 0
        ? "You're not in any servers yet. Use the + on the left to create or join one."
        : "Select a server.";
  } else if (state.channelsLoaded && state.channels.length === 0) {
    emptyMessage = isOwner()
      ? "This server has no channels. Create one from the server menu."
      : "No channels here yet.";
  }
  ui.chat.setContext({
    uid: state.user.uid,
    channel: currentChannel(),
    members: memberMap(),
    canModerate: isOwner(),
    emptyMessage,
  });
}

function renderMemberList() {
  renderMembers(
    ui.members,
    {
      members: state.members,
      presence: state.presence,
      ownerId: state.server?.ownerId,
      uid: state.user.uid,
    },
    kickMember,
  );
}

function renderAll() {
  if (!ui) return;
  renderRail();
  renderSide();
  renderChat();
  renderMemberList();
}

// ---- navigation ----

function route() {
  const { serverId, channelId } = parseHash();
  if (serverId && state.servers.some((s) => s.id === serverId)) {
    openServer(serverId, channelId);
  } else if (state.servers.length > 0) {
    const last = storage.get("sipher:lastServer");
    const target = state.servers.find((s) => s.id === last) || state.servers[0];
    openServer(target.id, null);
  } else {
    closeServer();
  }
}

function navigateServer(serverId) {
  openServer(serverId, null);
  ui.root.classList.add("show-sidebar");
}

function closeServer() {
  ["server", "channels", "members", "messages"].forEach(stop);
  messagesChannel = null;
  stopPresence();
  Object.assign(state, {
    serverId: null,
    server: null,
    channels: [],
    channelsLoaded: false,
    channelId: null,
    members: [],
  });
  setHash(null);
  renderAll();
}

function openServer(serverId, channelId) {
  if (serverId === state.serverId) {
    if (channelId && channelId !== state.channelId) openChannel(channelId);
    return;
  }
  closeServer();
  state.serverId = serverId;
  state.channelId = channelId;
  storage.set("sipher:lastServer", serverId);
  setHash(serverId, channelId);

  let gone = false;
  const lost = async (err) => {
    // Server deleted, or we were kicked: drop it from the sidebar.
    if (err && err.code !== "permission-denied")
      return report(err, "Couldn't load the server.");
    if (gone || state.serverId !== serverId) return;
    gone = true;
    const name = state.servers.find((s) => s.id === serverId)?.name;
    await api.forgetServer(state.user.uid, serverId).catch(() => {});
    if (name) toast(`You no longer have access to ${name}.`);
  };

  subs.server = api.watchServer(
    serverId,
    (server) => {
      if (!server) return lost();
      state.server = server;
      const entry = state.servers.find((s) => s.id === serverId);
      if (entry && entry.name !== server.name)
        api
          .syncServerName(state.user.uid, serverId, server.name)
          .catch(() => {});
      renderAll();
    },
    lost,
  );

  subs.channels = api.watchChannels(
    serverId,
    (channels) => {
      state.channels = channels;
      state.channelsLoaded = true;
      if (!channels.some((c) => c.id === state.channelId)) {
        const remembered = storage.get(`sipher:lastChannel:${serverId}`);
        const next = channels.find((c) => c.id === remembered) || channels[0];
        state.channelId = null;
        if (next) return openChannel(next.id);
        stop("messages");
        messagesChannel = null;
      }
      if (state.channelId && messagesChannel !== state.channelId)
        return openChannel(state.channelId);
      renderAll();
    },
    lost,
  );

  subs.members = api.watchMembers(
    serverId,
    (members) => {
      // Open listeners aren't re-checked against the rules, so notice being
      // kicked by dropping out of the member list.
      if (!members.some((m) => m.uid === state.user.uid)) return lost();
      state.members = members;
      syncPresence(members);
      renderAll();
    },
    lost,
  );

  renderAll();
}

function openChannel(channelId) {
  const serverId = state.serverId;
  stop("messages");
  messagesChannel = null;
  state.channelId = channelId;
  storage.set(`sipher:lastChannel:${serverId}`, channelId);
  setHash(serverId, channelId);
  ui.root.classList.remove("show-sidebar");
  renderAll();

  if (!state.channels.some((c) => c.id === channelId)) return;
  messagesChannel = channelId;
  subs.messages = api.watchMessages(
    serverId,
    channelId,
    (messages) => ui.chat.setMessages(messages),
    (err) => report(err, "Couldn't load messages."),
  );
}

function syncPresence(members) {
  const wanted = new Set(members.map((m) => m.uid));
  for (const [uid, unsub] of presenceSubs) {
    if (!wanted.has(uid)) {
      unsub();
      presenceSubs.delete(uid);
      state.presence.delete(uid);
    }
  }
  for (const uid of wanted) {
    if (presenceSubs.has(uid)) continue;
    presenceSubs.set(
      uid,
      api.watchUser(uid, (data) => {
        state.presence.set(uid, data);
        if (ui) renderMemberList();
      }),
    );
  }
}

// ---- actions ----

const chatActions = {
  send: async (text) => {
    try {
      await api.sendMessage(
        state.serverId,
        state.channelId,
        state.user,
        state.profile,
        text,
      );
    } catch (err) {
      report(err, "Message failed to send.");
      throw err;
    }
  },
  edit: guarded((msg, text) =>
    api.editMessage(state.serverId, state.channelId, msg.id, text),
  ),
  remove: guarded(async (msg, skipConfirm) => {
    if (!skipConfirm) {
      const ok = await confirmModal({
        title: "Delete Message",
        message:
          "Are you sure you want to delete this message? (Tip: hold Shift when clicking delete to skip this.)",
        confirm: "Delete",
        danger: true,
      });
      if (!ok) return;
    }
    await api.deleteMessage(state.serverId, state.channelId, msg.id);
  }),
  toggleMembers: () => {
    const hidden = ui.root.classList.toggle("hide-members");
    storage.set("sipher:hideMembers", hidden ? "1" : "0");
  },
  toggleSidebar: () => ui.root.classList.toggle("show-sidebar"),
};

const sidebarActions = {
  openChannel,
  invite: () => showInvite(),
  createChannel: guarded(async () => {
    const raw = await promptModal({
      title: "Create Channel",
      subtitle: "in Text Channels",
      label: "Channel name",
      placeholder: "new-channel",
      confirm: "Create Channel",
      maxLength: 32,
    });
    const name = raw && api.cleanChannelName(raw);
    if (!name) return;
    const id = await api.createChannel(state.serverId, name);
    state.channelId = id;
    setHash(state.serverId, id);
  }),
  editChannel: guarded(async (channel) => {
    let action = null;
    await new Promise((resolve) =>
      openModal({
        title: `#${channel.name}`,
        onClose: resolve,
        render: (close) => {
          const input = h("input", {
            class: "input",
            value: channel.name,
            maxLength: 32,
          });
          return h(
            "form",
            {
              class: "modal-form",
              onsubmit: (e) => {
                e.preventDefault();
                action = { rename: api.cleanChannelName(input.value) };
                close();
              },
            },
            h(
              "label",
              { class: "field" },
              h("span", { class: "field-label" }, "Channel name"),
              input,
            ),
            h(
              "div",
              { class: "modal-actions" },
              h(
                "button",
                {
                  type: "button",
                  class: "btn ghost danger-text",
                  onclick: () => {
                    action = { delete: true };
                    close();
                  },
                },
                "Delete Channel",
              ),
              h("div", { class: "spacer" }),
              h("button", { type: "submit", class: "btn primary" }, "Save"),
            ),
          );
        },
      }),
    );
    if (action?.rename && action.rename !== channel.name) {
      await api.renameChannel(state.serverId, channel.id, action.rename);
    } else if (action?.delete) {
      const ok = await confirmModal({
        title: "Delete Channel",
        message: `Are you sure you want to delete #${channel.name}? This cannot be undone.`,
        confirm: "Delete Channel",
        danger: true,
      });
      if (ok) await api.deleteChannel(state.serverId, channel.id);
    }
  }),
  renameServer: guarded(async () => {
    const name = await promptModal({
      title: "Server Settings",
      label: "Server name",
      value: state.server.name,
      maxLength: 50,
    });
    if (name && name !== state.server.name)
      await api.renameServer(state.serverId, name);
  }),
  leaveServer: guarded(async () => {
    const ok = await confirmModal({
      title: `Leave '${state.server.name}'`,
      message: `Are you sure you want to leave ${state.server.name}? You won't be able to rejoin unless you are re-invited.`,
      confirm: "Leave Server",
      danger: true,
    });
    if (!ok) return;
    const id = state.serverId;
    closeServer();
    await api.leaveServer(state.user.uid, id);
  }),
  deleteServer: guarded(async () => {
    const name = state.server.name;
    const typed = await promptModal({
      title: `Delete '${name}'`,
      subtitle:
        "This will delete the server and all of its channels. Type the server name to confirm.",
      label: "Server name",
      placeholder: name,
      confirm: "Delete Server",
    });
    if (typed !== name) {
      if (typed != null)
        toast("The name didn't match, so nothing was deleted.");
      return;
    }
    const id = state.serverId;
    closeServer();
    await api.deleteServer(state.user.uid, id);
    toast(`Deleted ${name}.`);
  }),
  editProfile: guarded(async () => {
    const name = await promptModal({
      title: "My Account",
      label: "Display name",
      value: state.profile.displayName,
      maxLength: 32,
    });
    if (!name || name === state.profile.displayName) return;
    await updateProfile(auth.currentUser, { displayName: name });
    await api.renameUser(
      state.user.uid,
      name,
      state.servers.map((s) => s.id),
    );
    toast("Display name updated.", "ok");
  }),
  signOut: guarded(async () => {
    const ok = await confirmModal({
      title: "Log Out",
      message: "Are you sure you want to log out?",
      confirm: "Log Out",
    });
    if (ok) await signOut(auth);
  }),
};

const kickMember = guarded(async (member) => {
  const ok = await confirmModal({
    title: `Kick ${member.displayName}`,
    message: `Remove ${member.displayName} from ${state.server.name}? They can rejoin with a new invite.`,
    confirm: "Kick",
    danger: true,
  });
  if (ok) await api.kickMember(state.serverId, member.uid);
});

function inviteLink(code) {
  return `${location.origin}${location.pathname}?invite=${code}`;
}

function showInvite() {
  openModal({
    title: `Invite friends to ${state.server.name}`,
    subtitle:
      "Share this link or code. Anyone signed in to Sipher can use it to join.",
    render: () => {
      const link = h("input", {
        class: "input",
        readOnly: true,
        value: inviteLink(state.server.inviteCode),
      });
      const copy = h(
        "button",
        {
          class: "btn primary",
          onclick: async () => {
            link.select();
            try {
              await navigator.clipboard.writeText(link.value);
              copy.textContent = "Copied";
              setTimeout(() => (copy.textContent = "Copy"), 1500);
            } catch {
              toast("Press Ctrl+C to copy the selected link.");
            }
          },
        },
        "Copy",
      );
      return h(
        "div",
        { class: "modal-form" },
        h("div", { class: "copy-row" }, link, copy),
        h(
          "p",
          { class: "muted small" },
          "Invite code: ",
          h("code", { class: "inline-code" }, state.server.inviteCode),
        ),
        isOwner() &&
          h(
            "button",
            {
              class: "link-btn",
              onclick: guarded(async () => {
                const code = await api.regenerateInvite(state.serverId);
                link.value = inviteLink(code);
                toast("New invite created. The old one no longer works.", "ok");
              }),
            },
            "Reset invite link",
          ),
      );
    },
  });
}

function addServer() {
  openModal({
    title: "Add a server",
    subtitle: "Your server is where you and your friends hang out.",
    render: (close) => {
      const name = h("input", {
        class: "input",
        maxLength: 50,
        value: `${state.profile.displayName}'s server`,
        required: true,
      });
      const code = h("input", {
        class: "input",
        placeholder: "hTKzmak or a full invite link",
        required: true,
      });
      const create = h(
        "form",
        {
          class: "modal-form",
          onsubmit: guarded(async (e) => {
            e.preventDefault();
            const value = name.value.trim();
            if (!value) return;
            close();
            const id = await api.createServer(state.user, state.profile, value);
            setHash(id);
            openServer(id, null);
          }),
        },
        h("h3", { class: "modal-section" }, "Create My Own"),
        h(
          "label",
          { class: "field" },
          h("span", { class: "field-label" }, "Server name"),
          name,
        ),
        h(
          "div",
          { class: "modal-actions" },
          h("button", { type: "submit", class: "btn primary" }, "Create"),
        ),
      );
      const join = h(
        "form",
        {
          class: "modal-form",
          onsubmit: (e) => {
            e.preventDefault();
            const parsed = api.parseInvite(code.value);
            if (!parsed)
              return toast("That doesn't look like an invite.", "error");
            close();
            joinWithCode(parsed);
          },
        },
        h("h3", { class: "modal-section" }, "Have an invite already?"),
        h(
          "label",
          { class: "field" },
          h("span", { class: "field-label" }, "Invite link or code"),
          code,
        ),
        h(
          "div",
          { class: "modal-actions" },
          h(
            "button",
            { type: "submit", class: "btn secondary" },
            "Join Server",
          ),
        ),
      );
      return h(
        "div",
        null,
        create,
        h("div", { class: "divider" }, h("span", null, "or")),
        join,
      );
    },
  });
}

const joinWithCode = guarded(async (code) => {
  const id = await api.joinServer(state.user, state.profile, code);
  setHash(id);
  openServer(id, null);
  toast("Joined the server!", "ok");
});

function consumeInviteFromUrl() {
  const params = new URLSearchParams(location.search);
  const code = params.get("invite");
  if (!code) return;
  params.delete("invite");
  const search = params.toString();
  history.replaceState(
    null,
    "",
    location.pathname + (search ? "?" + search : "") + location.hash,
  );
  joinWithCode(code);
}

// ---- session lifecycle ----

onAuthStateChanged(auth, async (user) => {
  teardown();
  ui = null;
  Object.assign(state, {
    user,
    servers: [],
    serverId: null,
    server: null,
    channels: [],
    channelsLoaded: false,
    channelId: null,
    members: [],
  });

  if (!user) {
    state.profile = null;
    renderAuth(appEl);
    return;
  }

  state.profile = {
    displayName: user.displayName || user.email?.split("@")[0] || "User",
    photoURL: user.photoURL || null,
  };
  try {
    await api.saveProfile(user);
  } catch (err) {
    report(err, "Couldn't save your profile.");
  }
  if (auth.currentUser?.uid !== user.uid) return;

  buildLayout();
  renderAll();

  subs.profile = api.watchUser(user.uid, (profile) => {
    if (!profile) return;
    state.profile = { ...state.profile, ...profile };
    renderSide();
  });

  let first = true;
  subs.servers = api.watchMyServers(user.uid, (servers) => {
    // Re-route on first load, or when the open server left the list (left,
    // kicked, deleted). A just-created server may not be listed yet; stay put.
    const had = state.servers.some((s) => s.id === state.serverId);
    const has = servers.some((s) => s.id === state.serverId);
    state.servers = servers;
    if (first || !state.serverId || (had && !has)) route();
    else renderAll();
    if (first) consumeInviteFromUrl();
    first = false;
  });

  timers.push(
    setInterval(
      () => api.touchPresence(user.uid).catch(() => {}),
      PRESENCE_INTERVAL_MS,
    ),
    // Re-evaluate who counts as online even when nobody's presence doc changes.
    setInterval(() => ui && renderMemberList(), 30 * 1000),
  );
});

window.addEventListener("hashchange", () => {
  if (state.user && ui) route();
});
