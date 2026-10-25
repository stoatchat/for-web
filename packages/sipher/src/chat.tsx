import { type User, signOut } from "firebase/auth";
import {
  type JSX,
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";

import {
  type Channel,
  type Dm,
  type Member,
  type Message,
  type MessagesPath,
  type Profile,
  type Server,
  DEFAULT_SERVER_ID,
  createChannel,
  createServer,
  deleteChannel,
  deleteMessage,
  describeError,
  findUserByUsername,
  forgetServer,
  getProfile,
  isMember,
  joinServer,
  kickMember,
  leaveServer,
  openDm,
  sendMessage,
  updateDisplayName,
  watchChannels,
  watchDms,
  watchMembers,
  watchMessages,
  watchMyServers,
} from "./data";
import { auth } from "./firebase";
import {
  Avatar,
  Bolt,
  ErrorText,
  Linkified,
  Modal,
  colourFor,
  initials,
} from "./ui";

type View =
  | { kind: "server"; serverId: string; channelId?: string }
  | { kind: "dms"; dmId?: string };

type ModalState =
  | { kind: "create-server" }
  | { kind: "join-server"; code?: string }
  | { kind: "create-channel"; serverId: string }
  | { kind: "invite"; server: Server }
  | { kind: "new-dm" }
  | { kind: "profile" };

/** Gap between messages from one person before their name is shown again */
const GROUP_GAP_MS = 5 * 60 * 1000;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatTime(date: Date) {
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (sameDay(date, now)) return `Today at ${time}`;
  if (sameDay(date, yesterday)) return `Yesterday at ${time}`;
  return `${date.toLocaleDateString()} ${time}`;
}

function inviteLink(serverId: string) {
  return `${location.origin}${location.pathname}#join=${serverId}`;
}

/** Read an invite code from a `#join=CODE` link, then tidy the address bar */
function takeInviteFromUrl(): string | undefined {
  const match = location.hash.match(/^#join=([\w-]+)$/);
  if (!match) return undefined;
  history.replaceState(null, "", location.pathname + location.search);
  return match[1];
}

export function ChatApp(props: { user: User; profile: Profile }) {
  const [servers, setServers] = createSignal<Server[]>([]);
  const [serversLoaded, setServersLoaded] = createSignal(false);
  const [dms, setDms] = createSignal<Dm[]>([]);
  const [people, setPeople] = createSignal<Record<string, Profile>>({});
  const [view, setView] = createSignal<View>({
    kind: "server",
    serverId: DEFAULT_SERVER_ID,
  });
  const [modal, setModal] = createSignal<ModalState | null>(null);
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [membersOpen, setMembersOpen] = createSignal(
    window.matchMedia("(min-width: 1100px)").matches,
  );

  const uid = () => props.profile.uid;

  // offer to join when opened from an invite link, now or later
  const checkInvite = () => {
    const code = takeInviteFromUrl();
    if (code) setModal({ kind: "join-server", code });
  };
  onMount(checkInvite);
  window.addEventListener("hashchange", checkInvite);
  onCleanup(() => window.removeEventListener("hashchange", checkInvite));

  onCleanup(
    watchMyServers(uid(), (list) => {
      setServers(list);
      setServersLoaded(true);
    }),
  );
  onCleanup(watchDms(uid(), setDms));

  // Pick another server when the selected one goes away (left or removed),
  // or when the starting choice isn't one of ours. A server that was just
  // created or joined may not be listed yet, so that alone isn't a reason.
  let chosen = false;
  let previousIds = new Set<string>();
  createEffect(() => {
    const ids = new Set(servers().map((s) => s.id));
    const current = untrack(view);
    if (
      current.kind === "server" &&
      !ids.has(current.serverId) &&
      (previousIds.has(current.serverId) || !chosen)
    ) {
      const fallback = ids.has(DEFAULT_SERVER_ID)
        ? DEFAULT_SERVER_ID
        : servers()[0]?.id;
      if (fallback) setView({ kind: "server", serverId: fallback });
    }
    previousIds = ids;
  });

  // look up names for everyone we have a DM with
  createEffect(() => {
    for (const dm of dms()) {
      const other = dm.members.find((m) => m !== uid());
      if (other && !people()[other]) {
        setPeople((p) => ({
          ...p,
          [other]: { uid: other, username: "…", displayName: "…" },
        }));
        getProfile(other).then((profile) => {
          if (profile) setPeople((p) => ({ ...p, [other]: profile }));
        });
      }
    }
  });

  const currentServer = createMemo(() => {
    const current = view();
    return current.kind === "server"
      ? servers().find((s) => s.id === current.serverId)
      : undefined;
  });

  const select = (next: View) => {
    chosen = true;
    setView(next);
    setDrawerOpen(false);
  };

  const startDm = async (otherUid: string) => {
    const dmId = await openDm(uid(), otherUid);
    select({ kind: "dms", dmId });
  };

  return (
    <div class="app" classList={{ "drawer-open": drawerOpen() }}>
      <div class="drawer-scrim" onClick={() => setDrawerOpen(false)} />
      <nav class="rail" aria-label="Servers">
        <button
          class="rail-icon home"
          classList={{ active: view().kind === "dms" }}
          title="Direct messages"
          aria-label="Direct messages"
          onClick={() => select({ kind: "dms" })}
        >
          <Bolt size={26} />
        </button>
        <div class="rail-divider" />
        <For each={servers()}>
          {(server) => (
            <button
              class="rail-icon"
              classList={{ active: currentServer()?.id === server.id }}
              style={{ background: colourFor(server.id) }}
              title={server.name}
              aria-label={server.name}
              onClick={() => select({ kind: "server", serverId: server.id })}
            >
              {initials(server.name)}
            </button>
          )}
        </For>
        <button
          class="rail-icon add"
          title="Create a server"
          aria-label="Create a server"
          onClick={() => setModal({ kind: "create-server" })}
        >
          +
        </button>
        <button
          class="rail-icon add"
          title="Join a server"
          aria-label="Join a server"
          onClick={() => setModal({ kind: "join-server" })}
        >
          ⇥
        </button>
      </nav>

      <Switch>
        <Match when={currentServer()}>
          {(server) => (
            <Show when={server().id} keyed>
              {(_serverId) => (
                <ServerView
                  server={server()}
                  profile={props.profile}
                  channelId={(view() as { channelId?: string }).channelId}
                  membersOpen={membersOpen()}
                  onToggleMembers={() => setMembersOpen((o) => !o)}
                  onSelectChannel={(channelId) =>
                    select({ kind: "server", serverId: server().id, channelId })
                  }
                  onOpenDrawer={() => setDrawerOpen(true)}
                  onModal={setModal}
                  onMessageUser={startDm}
                  onRemoved={() => forgetServer(uid(), server().id)}
                />
              )}
            </Show>
          )}
        </Match>
        <Match when={view().kind === "dms"}>
          <DmView
            profile={props.profile}
            dms={dms()}
            people={people()}
            dmId={(view() as { dmId?: string }).dmId}
            onSelect={(dmId) => select({ kind: "dms", dmId })}
            onNew={() => setModal({ kind: "new-dm" })}
            onOpenDrawer={() => setDrawerOpen(true)}
            onProfile={() => setModal({ kind: "profile" })}
          />
        </Match>
        <Match when={!serversLoaded()}>
          <div class="loading">Loading…</div>
        </Match>
        <Match when={servers().length === 0}>
          <section class="chat">
            <ChatHeader onOpenDrawer={() => setDrawerOpen(true)}>
              Sipher
            </ChatHeader>
            <div class="empty">
              <Bolt size={48} />
              <p>You're not in any servers yet.</p>
              <div class="sidebar-actions">
                <button
                  class="primary"
                  onClick={() => setModal({ kind: "join-server" })}
                >
                  Join a server
                </button>
                <button onClick={() => setModal({ kind: "create-server" })}>
                  Create one
                </button>
              </div>
            </div>
          </section>
        </Match>
      </Switch>

      <Show when={modal()}>
        {(m) => (
          <Modals
            state={m()}
            user={props.user}
            profile={props.profile}
            servers={servers()}
            onClose={() => setModal(null)}
            onOpenServer={(serverId) => select({ kind: "server", serverId })}
            onOpenChannel={(serverId, channelId) =>
              select({ kind: "server", serverId, channelId })
            }
            onOpenDm={startDm}
          />
        )}
      </Show>
    </div>
  );
}

function UserPanel(props: { profile: Profile; onProfile: () => void }) {
  return (
    <div class="user-panel">
      <Avatar name={props.profile.displayName} seed={props.profile.uid} />
      <div class="user-names">
        <strong>{props.profile.displayName}</strong>
        <span class="muted">@{props.profile.username}</span>
      </div>
      <button
        class="icon-button"
        title="Profile and settings"
        aria-label="Profile and settings"
        onClick={props.onProfile}
      >
        ⚙
      </button>
    </div>
  );
}

function ServerView(props: {
  server: Server;
  profile: Profile;
  channelId?: string;
  membersOpen: boolean;
  onToggleMembers: () => void;
  onSelectChannel: (channelId: string) => void;
  onOpenDrawer: () => void;
  onModal: (modal: ModalState) => void;
  onMessageUser: (uid: string) => void;
  onRemoved: () => void;
}) {
  const [channels, setChannels] = createSignal<Channel[]>([]);
  const [members, setMembers] = createSignal<Member[]>([]);
  const [error, setError] = createSignal<string | null>(null);

  const isOwner = () => props.server.ownerId === props.profile.uid;
  const channel = () =>
    channels().find((c) => c.id === props.channelId) ?? channels()[0];

  // losing access means we were removed from the server
  const onAccessError = async (err: Error) => {
    if (!(await isMember(props.profile.uid, props.server.id).catch(() => true)))
      props.onRemoved();
    else setError(describeError(err));
  };

  onCleanup(watchChannels(props.server.id, setChannels, onAccessError));
  onCleanup(watchMembers(props.server.id, setMembers, onAccessError));

  const leave = async () => {
    if (!confirm(`Leave ${props.server.name}?`)) return;
    try {
      await leaveServer(props.profile.uid, props.server.id);
    } catch (err) {
      setError(describeError(err));
    }
  };

  const removeChannel = async (target: Channel) => {
    if (!confirm(`Delete #${target.name}? Its messages will be hidden.`))
      return;
    try {
      await deleteChannel(props.server.id, target.id);
    } catch (err) {
      setError(describeError(err));
    }
  };

  const kick = async (member: Member) => {
    if (!confirm(`Remove ${member.displayName} from ${props.server.name}?`))
      return;
    try {
      await kickMember(props.server.id, member.id);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <>
      <aside class="sidebar">
        <header class="sidebar-header">
          <h2 title={props.server.name}>{props.server.name}</h2>
        </header>
        <div class="sidebar-actions">
          <button
            onClick={() =>
              props.onModal({ kind: "invite", server: props.server })
            }
          >
            Invite people
          </button>
          <Show
            when={isOwner()}
            fallback={
              <button class="danger-text" onClick={leave}>
                Leave
              </button>
            }
          >
            <button
              onClick={() =>
                props.onModal({
                  kind: "create-channel",
                  serverId: props.server.id,
                })
              }
            >
              New channel
            </button>
          </Show>
        </div>
        <div class="sidebar-list">
          <p class="section-label">Text channels</p>
          <For each={channels()}>
            {(item) => (
              <div
                class="list-item"
                classList={{ active: channel()?.id === item.id }}
              >
                <button
                  class="list-main"
                  onClick={() => props.onSelectChannel(item.id)}
                >
                  <span class="hash">#</span> {item.name}
                </button>
                <Show when={isOwner() && channels().length > 1}>
                  <button
                    class="icon-button small"
                    title={`Delete #${item.name}`}
                    aria-label={`Delete #${item.name}`}
                    onClick={() => removeChannel(item)}
                  >
                    ✕
                  </button>
                </Show>
              </div>
            )}
          </For>
          <ErrorText error={error()} />
        </div>
        <UserPanel
          profile={props.profile}
          onProfile={() => props.onModal({ kind: "profile" })}
        />
      </aside>

      <Show
        when={channel()}
        keyed
        fallback={
          <section class="chat">
            <ChatHeader onOpenDrawer={props.onOpenDrawer}>
              {props.server.name}
            </ChatHeader>
            <div class="empty">No channels yet.</div>
          </section>
        }
      >
        {(current) => (
          <ChatPane
            path={{
              kind: "channel",
              serverId: props.server.id,
              channelId: current.id,
            }}
            profile={props.profile}
            placeholder={`Message #${current.name}`}
            welcome={`Welcome to #${current.name}`}
            canDelete={(m) => m.authorId === props.profile.uid || isOwner()}
            onOpenDrawer={props.onOpenDrawer}
            header={
              <>
                <span class="hash">#</span> {current.name}
              </>
            }
            headerExtra={
              <button
                class="icon-button"
                classList={{ active: props.membersOpen }}
                title="Members"
                aria-label="Show members"
                aria-pressed={props.membersOpen}
                onClick={props.onToggleMembers}
              >
                👥
              </button>
            }
          />
        )}
      </Show>

      <Show when={props.membersOpen}>
        <aside class="members" aria-label="Members">
          <p class="section-label">Members — {members().length}</p>
          <For each={members()}>
            {(member) => (
              <div class="member">
                <button
                  class="member-main"
                  title={
                    member.id === props.profile.uid
                      ? "That's you"
                      : `Message ${member.displayName}`
                  }
                  disabled={member.id === props.profile.uid}
                  onClick={() => props.onMessageUser(member.id)}
                >
                  <Avatar
                    name={member.displayName}
                    seed={member.id}
                    size={32}
                  />
                  <span class="member-names">
                    <span>
                      {member.displayName}
                      <Show when={member.id === props.server.ownerId}>
                        <span class="owner" title="Owner">
                          {" "}
                          👑
                        </span>
                      </Show>
                    </span>
                    <span class="muted">@{member.username}</span>
                  </span>
                </button>
                <Show when={isOwner() && member.id !== props.profile.uid}>
                  <button
                    class="icon-button small"
                    title={`Remove ${member.displayName}`}
                    aria-label={`Remove ${member.displayName}`}
                    onClick={() => kick(member)}
                  >
                    ✕
                  </button>
                </Show>
              </div>
            )}
          </For>
        </aside>
      </Show>
    </>
  );
}

function DmView(props: {
  profile: Profile;
  dms: Dm[];
  people: Record<string, Profile>;
  dmId?: string;
  onSelect: (dmId: string) => void;
  onNew: () => void;
  onOpenDrawer: () => void;
  onProfile: () => void;
}) {
  const otherOf = (dm: Dm) =>
    props.people[dm.members.find((m) => m !== props.profile.uid) ?? ""];
  const current = () => props.dms.find((dm) => dm.id === props.dmId);

  return (
    <>
      <aside class="sidebar">
        <header class="sidebar-header">
          <h2>Direct messages</h2>
        </header>
        <div class="sidebar-actions">
          <button onClick={props.onNew}>New message</button>
        </div>
        <div class="sidebar-list">
          <For
            each={props.dms}
            fallback={<p class="muted pad">No conversations yet.</p>}
          >
            {(dm) => (
              <div
                class="list-item"
                classList={{ active: props.dmId === dm.id }}
              >
                <button class="list-main" onClick={() => props.onSelect(dm.id)}>
                  <Avatar
                    name={otherOf(dm)?.displayName ?? "?"}
                    seed={otherOf(dm)?.uid ?? dm.id}
                    size={28}
                  />
                  {otherOf(dm)?.displayName ?? "…"}
                </button>
              </div>
            )}
          </For>
        </div>
        <UserPanel profile={props.profile} onProfile={props.onProfile} />
      </aside>

      <Show
        when={current()}
        keyed
        fallback={
          <section class="chat">
            <ChatHeader onOpenDrawer={props.onOpenDrawer}>
              Direct messages
            </ChatHeader>
            <div class="empty">
              <Bolt size={48} />
              <p>Pick a conversation, or start a new one.</p>
              <p class="muted">
                Tip: click someone in a server's member list to message them.
              </p>
            </div>
          </section>
        }
      >
        {(dm) => (
          <ChatPane
            path={{ kind: "dm", dmId: dm.id }}
            profile={props.profile}
            placeholder={`Message ${otherOf(dm)?.displayName ?? ""}`}
            welcome={`This is the start of your conversation with ${otherOf(dm)?.displayName ?? "them"}.`}
            canDelete={(m) => m.authorId === props.profile.uid}
            onOpenDrawer={props.onOpenDrawer}
            header={<>@{otherOf(dm)?.username ?? "…"}</>}
          />
        )}
      </Show>
    </>
  );
}

function ChatHeader(props: {
  onOpenDrawer: () => void;
  children: JSX.Element;
  extra?: JSX.Element;
}) {
  return (
    <header class="chat-header">
      <button
        class="icon-button menu-button"
        aria-label="Open menu"
        onClick={props.onOpenDrawer}
      >
        ☰
      </button>
      <h3>{props.children}</h3>
      <div class="chat-header-extra">{props.extra}</div>
    </header>
  );
}

function ChatPane(props: {
  path: MessagesPath;
  profile: Profile;
  header: JSX.Element;
  headerExtra?: JSX.Element;
  placeholder: string;
  welcome: string;
  canDelete: (message: Message) => boolean;
  onOpenDrawer: () => void;
}) {
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [loaded, setLoaded] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [draft, setDraft] = createSignal("");
  let list!: HTMLDivElement;
  let input!: HTMLTextAreaElement;
  let stickToBottom = true;

  const onScroll = () => {
    stickToBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 120;
  };

  onCleanup(
    watchMessages(
      props.path,
      (next) => {
        setMessages(next);
        setLoaded(true);
      },
      (err) => setError(describeError(err)),
    ),
  );

  createEffect(
    on(messages, () => {
      if (stickToBottom)
        queueMicrotask(() => (list.scrollTop = list.scrollHeight));
    }),
  );

  const resize = () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
  };

  const send = async () => {
    const content = draft().trim();
    if (!content) return;
    setDraft("");
    queueMicrotask(resize);
    stickToBottom = true;
    try {
      setError(null);
      await sendMessage(props.path, props.profile, content);
    } catch (err) {
      setDraft(content);
      setError(describeError(err));
    }
  };

  const remove = async (message: Message) => {
    try {
      await deleteMessage(props.path, message.id);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <section class="chat">
      <ChatHeader onOpenDrawer={props.onOpenDrawer} extra={props.headerExtra}>
        {props.header}
      </ChatHeader>

      <div class="messages" ref={list} onScroll={onScroll}>
        <Show when={loaded() && messages().length < 100}>
          <div class="welcome">
            <h2>{props.welcome}</h2>
            <p class="muted">Say hi! 👋</p>
          </div>
        </Show>
        <For each={messages()}>
          {(message, index) => {
            const previous = () => messages()[index() - 1];
            const newDay = () =>
              !previous() || !sameDay(previous()!.createdAt, message.createdAt);
            const grouped = () =>
              !newDay() &&
              previous()!.authorId === message.authorId &&
              message.createdAt.getTime() - previous()!.createdAt.getTime() <
                GROUP_GAP_MS;

            return (
              <>
                <Show when={newDay()}>
                  <div class="day-divider">
                    <span>{message.createdAt.toLocaleDateString()}</span>
                  </div>
                </Show>
                <article class="message" classList={{ grouped: grouped() }}>
                  <Show
                    when={!grouped()}
                    fallback={
                      <time
                        class="hover-time"
                        title={formatTime(message.createdAt)}
                      >
                        {message.createdAt.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    }
                  >
                    <Avatar name={message.authorName} seed={message.authorId} />
                  </Show>
                  <div class="message-body">
                    <Show when={!grouped()}>
                      <header>
                        <strong style={{ color: "var(--text)" }}>
                          {message.authorName}
                        </strong>
                        <time class="muted">
                          {formatTime(message.createdAt)}
                        </time>
                      </header>
                    </Show>
                    <p>
                      <Linkified text={message.content} />
                    </p>
                  </div>
                  <Show when={props.canDelete(message)}>
                    <button
                      class="icon-button small message-delete"
                      title="Delete message"
                      aria-label="Delete message"
                      onClick={() => remove(message)}
                    >
                      🗑
                    </button>
                  </Show>
                </article>
              </>
            );
          }}
        </For>
      </div>

      <form
        class="composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <ErrorText error={error()} />
        <div class="composer-row">
          <textarea
            ref={input}
            rows={1}
            maxLength={2000}
            placeholder={props.placeholder}
            aria-label={props.placeholder}
            value={draft()}
            onInput={(event) => {
              setDraft(event.currentTarget.value);
              resize();
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
              ) {
                event.preventDefault();
                send();
              }
            }}
          />
          <button class="primary" type="submit" disabled={!draft().trim()}>
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

function Modals(props: {
  state: ModalState;
  user: User;
  profile: Profile;
  servers: Server[];
  onClose: () => void;
  onOpenServer: (serverId: string) => void;
  onOpenChannel: (serverId: string, channelId: string) => void;
  onOpenDm: (uid: string) => Promise<void>;
}) {
  const [value, setValue] = createSignal(
    props.state.kind === "join-server"
      ? (props.state.code ?? "")
      : props.state.kind === "profile"
        ? props.profile.displayName
        : "",
  );
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [copied, setCopied] = createSignal(false);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      props.onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const text = value().trim();
    const state = props.state;
    if (!text) return;

    switch (state.kind) {
      case "create-server":
        return run(async () =>
          props.onOpenServer(await createServer(props.profile, text)),
        );
      case "join-server":
        return run(async () => {
          // accept a full invite link as well as a bare code
          const code = text.match(/#join=([\w-]+)/)?.[1] ?? text;
          props.onOpenServer((await joinServer(props.profile, code)).id);
        });
      case "create-channel":
        return run(async () => {
          const name = text.toLowerCase().replace(/\s+/g, "-");
          props.onOpenChannel(
            state.serverId,
            await createChannel(state.serverId, name),
          );
        });
      case "new-dm":
        return run(async () => {
          const other = await findUserByUsername(text.replace(/^@/, ""));
          if (!other) throw new Error("Nobody has that username.");
          await props.onOpenDm(other.uid);
        });
      case "profile":
        return run(() =>
          updateDisplayName(
            props.profile.uid,
            text,
            props.servers.map((s) => s.id),
          ),
        );
    }
  };

  const field = (
    label: string,
    attrs: JSX.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <label>
      {label}
      <input
        {...attrs}
        autofocus
        required
        value={value()}
        onInput={(e) => setValue(e.currentTarget.value)}
      />
    </label>
  );

  const actions = (label: string) => (
    <>
      <ErrorText error={error()} />
      <div class="modal-actions">
        <button type="button" onClick={props.onClose}>
          Cancel
        </button>
        <button class="primary" type="submit" disabled={busy()}>
          {label}
        </button>
      </div>
    </>
  );

  return (
    <Switch>
      <Match when={props.state.kind === "create-server"}>
        <Modal title="Create a server" onClose={props.onClose}>
          <form class="stack" onSubmit={submit}>
            {field("Server name", { maxLength: 50, placeholder: "My hangout" })}
            {actions("Create")}
          </form>
        </Modal>
      </Match>
      <Match when={props.state.kind === "join-server"}>
        <Modal title="Join a server" onClose={props.onClose}>
          <form class="stack" onSubmit={submit}>
            {field("Invite link or code", { placeholder: "da-group" })}
            {actions("Join")}
          </form>
        </Modal>
      </Match>
      <Match when={props.state.kind === "create-channel"}>
        <Modal title="Create a channel" onClose={props.onClose}>
          <form class="stack" onSubmit={submit}>
            {field("Channel name", { maxLength: 32, placeholder: "memes" })}
            {actions("Create")}
          </form>
        </Modal>
      </Match>
      <Match when={props.state.kind === "new-dm"}>
        <Modal title="New message" onClose={props.onClose}>
          <form class="stack" onSubmit={submit}>
            {field("Their username", { placeholder: "@username" })}
            {actions("Message")}
          </form>
        </Modal>
      </Match>
      <Match when={props.state.kind === "invite" && props.state}>
        {(state) => {
          const server = (state() as { server: Server }).server;
          const link = inviteLink(server.id);
          return (
            <Modal
              title={`Invite people to ${server.name}`}
              onClose={props.onClose}
            >
              <div class="stack">
                <p class="muted">
                  Send this link. Anyone with a Sipher account can use it to
                  join.
                </p>
                <div class="copy-row">
                  <input
                    readOnly
                    value={link}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    class="primary"
                    onClick={async () => {
                      await navigator.clipboard
                        ?.writeText(link)
                        .catch(() => {});
                      setCopied(true);
                    }}
                  >
                    {copied() ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p class="muted">
                  Or share the code: <code>{server.id}</code>
                </p>
                <div class="modal-actions">
                  <button onClick={props.onClose}>Done</button>
                </div>
              </div>
            </Modal>
          );
        }}
      </Match>
      <Match when={props.state.kind === "profile"}>
        <Modal title="Your profile" onClose={props.onClose}>
          <form class="stack" onSubmit={submit}>
            <div class="profile-summary">
              <Avatar
                name={value() || props.profile.displayName}
                seed={props.profile.uid}
                size={56}
              />
              <div>
                <strong>@{props.profile.username}</strong>
                <p class="muted">{props.user.email}</p>
              </div>
            </div>
            {field("Display name", { maxLength: 32 })}
            {actions("Save")}
            <button
              type="button"
              class="danger-text"
              onClick={() => signOut(auth)}
            >
              Log out
            </button>
          </form>
        </Modal>
      </Match>
    </Switch>
  );
}
