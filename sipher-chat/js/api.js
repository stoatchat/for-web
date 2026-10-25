// All Firestore reads and writes live here.
//
// Data model:
//   users/{uid}                                 profile + lastSeen (presence)
//   users/{uid}/servers/{serverId}              the servers a user has joined
//   servers/{serverId}                          name, ownerId, inviteCode
//   servers/{serverId}/members/{uid}            membership (what the rules check)
//   servers/{serverId}/channels/{channelId}     text channels
//   servers/{serverId}/channels/{cid}/messages  chat messages
//   invites/{code}                              invite code -> server
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { db } from "./firebase.js";

export const MESSAGE_LIMIT = 2000;
const PAGE_SIZE = 100;

const INVITE_ALPHABET =
  "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(
    bytes,
    (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length],
  ).join("");
}

export function cleanChannelName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
}

// ---- users ----

export async function saveProfile(user) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      photoURL: user.photoURL || null,
      lastSeen: serverTimestamp(),
    },
    { merge: true },
  );
}

export function touchPresence(uid) {
  return updateDoc(doc(db, "users", uid), { lastSeen: serverTimestamp() });
}

export function watchUser(uid, cb) {
  return onSnapshot(doc(db, "users", uid), (snap) =>
    cb(snap.exists() ? snap.data() : null),
  );
}

export async function renameUser(uid, displayName, serverIds) {
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), { displayName });
  for (const sid of serverIds) {
    batch.update(doc(db, "servers", sid, "members", uid), { displayName });
  }
  await batch.commit();
}

// ---- servers ----

// Entries still waiting on the server are skipped: until the create/join batch
// commits, the membership it adds doesn't exist yet and opening the server
// would be denied.
export function watchMyServers(uid, cb) {
  const q = query(collection(db, "users", uid, "servers"), orderBy("joinedAt"));
  return onSnapshot(q, { includeMetadataChanges: true }, (snap) =>
    cb(
      snap.docs
        .filter((d) => !d.metadata.hasPendingWrites)
        .map((d) => ({ id: d.id, ...d.data() })),
    ),
  );
}

export function watchServer(serverId, cb, onError) {
  return onSnapshot(
    doc(db, "servers", serverId),
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  );
}

export async function createServer(user, profile, name) {
  const serverRef = doc(collection(db, "servers"));
  const channelRef = doc(collection(serverRef, "channels"));
  const code = newInviteCode();
  const batch = writeBatch(db);

  batch.set(serverRef, {
    name,
    ownerId: user.uid,
    inviteCode: code,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(serverRef, "members", user.uid), {
    uid: user.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL || null,
    role: "owner",
    joinedAt: serverTimestamp(),
  });
  batch.set(channelRef, { name: "general", createdAt: serverTimestamp() });
  batch.set(doc(db, "invites", code), {
    serverId: serverRef.id,
    serverName: name,
  });
  batch.set(doc(db, "users", user.uid, "servers", serverRef.id), {
    name,
    joinedAt: serverTimestamp(),
  });

  await batch.commit();
  return serverRef.id;
}

export function parseInvite(input) {
  const trimmed = input.trim();
  const match =
    trimmed.match(/[?&#]invite=([A-Za-z0-9]+)/) ||
    trimmed.match(/^([A-Za-z0-9]+)$/);
  return match ? match[1] : null;
}

export async function joinServer(user, profile, code) {
  const invite = await getDoc(doc(db, "invites", code));
  if (!invite.exists())
    throw new Error("That invite is invalid or has expired.");
  const { serverId, serverName } = invite.data();

  const memberRef = doc(db, "servers", serverId, "members", user.uid);
  const batch = writeBatch(db);
  batch.set(memberRef, {
    uid: user.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL || null,
    role: "member",
    invite: code,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", user.uid, "servers", serverId), {
    name: serverName,
    joinedAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    // Already a member: the rules forbid re-creating the member doc.
    const existing = await getDoc(memberRef).catch(() => null);
    if (existing?.exists()) return serverId;
    throw err;
  }
  return serverId;
}

// Each member's sidebar entry can only be written by that member, so everyone
// refreshes their own copy (syncServerName) when they next open the server.
export async function renameServer(serverId, name) {
  const server = await getDoc(doc(db, "servers", serverId));
  const batch = writeBatch(db);
  batch.update(doc(db, "servers", serverId), { name });
  batch.update(doc(db, "invites", server.data().inviteCode), {
    serverName: name,
  });
  await batch.commit();
}

export async function regenerateInvite(serverId) {
  const server = await getDoc(doc(db, "servers", serverId));
  const { inviteCode, name } = server.data();
  const code = newInviteCode();
  const batch = writeBatch(db);
  batch.delete(doc(db, "invites", inviteCode));
  batch.set(doc(db, "invites", code), { serverId, serverName: name });
  batch.update(doc(db, "servers", serverId), { inviteCode: code });
  await batch.commit();
  return code;
}

export async function syncServerName(uid, serverId, name) {
  await updateDoc(doc(db, "users", uid, "servers", serverId), { name });
}

export async function leaveServer(uid, serverId) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "servers", serverId, "members", uid));
  batch.delete(doc(db, "users", uid, "servers", serverId));
  await batch.commit();
}

// Removes a stale sidebar entry (e.g. after the server was deleted).
export function forgetServer(uid, serverId) {
  return deleteDoc(doc(db, "users", uid, "servers", serverId));
}

export async function deleteServer(uid, serverId) {
  const serverRef = doc(db, "servers", serverId);
  const server = await getDoc(serverRef);
  const [channels, members] = await Promise.all([
    getDocs(collection(serverRef, "channels")),
    getDocs(collection(serverRef, "members")),
  ]);

  // Messages are left behind; with the member docs gone nobody can read them.
  // A Cloud Function (or the Firebase CLI's recursive delete) can purge them.
  // Rules evaluate every write in a batch against the pre-batch state, so the
  // owner check still passes for each delete here.
  const batch = writeBatch(db);
  channels.forEach((c) => batch.delete(c.ref));
  members.forEach((m) => batch.delete(m.ref));
  batch.delete(doc(db, "invites", server.data().inviteCode));
  batch.delete(doc(db, "users", uid, "servers", serverId));
  batch.delete(serverRef);
  await batch.commit();
}

// ---- members ----

export function watchMembers(serverId, cb, onError) {
  return onSnapshot(
    collection(db, "servers", serverId, "members"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export function kickMember(serverId, uid) {
  return deleteDoc(doc(db, "servers", serverId, "members", uid));
}

// ---- channels ----

export function watchChannels(serverId, cb, onError) {
  const q = query(
    collection(db, "servers", serverId, "channels"),
    orderBy("createdAt"),
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export async function createChannel(serverId, name) {
  const ref = doc(collection(db, "servers", serverId, "channels"));
  await setDoc(ref, { name, createdAt: serverTimestamp() });
  return ref.id;
}

export function renameChannel(serverId, channelId, name) {
  return updateDoc(doc(db, "servers", serverId, "channels", channelId), {
    name,
  });
}

export function deleteChannel(serverId, channelId) {
  return deleteDoc(doc(db, "servers", serverId, "channels", channelId));
}

// ---- messages ----

function messagesRef(serverId, channelId) {
  return collection(db, "servers", serverId, "channels", channelId, "messages");
}

export function watchMessages(serverId, channelId, cb, onError) {
  const q = query(
    messagesRef(serverId, channelId),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE),
  );
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const messages = snap.docs
        .map((d) => ({
          id: d.id,
          pending: d.metadata.hasPendingWrites,
          ...d.data({ serverTimestamps: "estimate" }),
        }))
        .reverse();
      cb(messages);
    },
    onError,
  );
}

export function sendMessage(serverId, channelId, user, profile, text) {
  const ref = doc(messagesRef(serverId, channelId));
  return setDoc(ref, {
    text,
    authorId: user.uid,
    authorName: profile.displayName,
    authorPhoto: profile.photoURL || null,
    createdAt: serverTimestamp(),
  });
}

export function editMessage(serverId, channelId, messageId, text) {
  return updateDoc(doc(messagesRef(serverId, channelId), messageId), {
    text,
    editedAt: serverTimestamp(),
  });
}

export function deleteMessage(serverId, channelId, messageId) {
  return deleteDoc(doc(messagesRef(serverId, channelId), messageId));
}
