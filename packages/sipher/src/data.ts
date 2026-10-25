import { FirebaseError } from "firebase/app";
import {
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebase";

/** Server everyone joins when they finish signing up */
export const DEFAULT_SERVER_ID = "da-group";
export const DEFAULT_SERVER_NAME = "Da Group";

/** Messages loaded per channel or DM */
const MESSAGE_LIMIT = 100;

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const CHANNEL_PATTERN = /^[a-z0-9-]{1,32}$/;

export interface Profile {
  uid: string;
  username: string;
  displayName: string;
}

export interface Server {
  id: string;
  name: string;
  ownerId: string;
}

export interface Channel {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  username: string;
  displayName: string;
}

export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface Dm {
  id: string;
  members: string[];
  updatedAt: Date;
}

/** Where a conversation's messages live */
export type MessagesPath =
  | { kind: "channel"; serverId: string; channelId: string }
  | { kind: "dm"; dmId: string };

function messagesCollection(path: MessagesPath) {
  return path.kind === "channel"
    ? collection(
        db,
        "servers",
        path.serverId,
        "channels",
        path.channelId,
        "messages",
      )
    : collection(db, "dms", path.dmId, "messages");
}

/** Turn a Firebase error into something a person can act on */
export function describeError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Wrong email or password.";
      case "auth/email-already-in-use":
        return "There's already an account with that email. Try logging in.";
      case "auth/invalid-email":
        return "That email address doesn't look right.";
      case "auth/weak-password":
        return "Use a password with at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes and try again.";
      case "auth/network-request-failed":
      case "unavailable":
        return "Can't reach Sipher. Check your internet connection.";
      case "permission-denied":
        return "You don't have permission to do that.";
    }
    return error.message.replace(/^Firebase: /, "");
  }
  return error instanceof Error ? error.message : String(error);
}

function toDate(value: unknown): Date {
  return value && typeof (value as { toDate?: unknown }).toDate === "function"
    ? (value as { toDate(): Date }).toDate()
    : new Date();
}

function toMessage(snap: QueryDocumentSnapshot<DocumentData>): Message {
  const data = snap.data({ serverTimestamps: "estimate" });
  return {
    id: snap.id,
    authorId: data.authorId,
    authorName: data.authorName,
    content: data.content,
    createdAt: toDate(data.createdAt),
  };
}

// ---------------------------------------------------------------- profiles

export function watchProfile(
  uid: string,
  cb: (profile: Profile | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    const data = snap.data();
    cb(
      data
        ? { uid, username: data.username, displayName: data.displayName }
        : null,
    );
  });
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.data();
  return data
    ? { uid, username: data.username, displayName: data.displayName }
    : null;
}

/**
 * Reserve a username and create the profile
 * @throws if the username is taken
 */
export async function createProfile(
  uid: string,
  username: string,
  displayName: string,
) {
  const name = username.toLowerCase();
  if (!USERNAME_PATTERN.test(name))
    throw new Error(
      "Usernames are 3–20 characters: letters, numbers and underscores.",
    );

  const taken = await getDoc(doc(db, "usernames", name));
  if (taken.exists()) throw new Error("That username is taken.");

  const batch = writeBatch(db);
  batch.set(doc(db, "usernames", name), { uid });
  batch.set(doc(db, "users", uid), {
    username: name,
    displayName,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

/** Change display name everywhere it's shown in member lists */
export async function updateDisplayName(
  uid: string,
  displayName: string,
  serverIds: string[],
) {
  const batch = writeBatch(db);
  batch.update(doc(db, "users", uid), { displayName });
  for (const sid of serverIds) {
    batch.update(doc(db, "servers", sid, "members", uid), { displayName });
  }
  await batch.commit();
}

export async function findUserByUsername(
  username: string,
): Promise<Profile | null> {
  const snap = await getDoc(doc(db, "usernames", username.toLowerCase()));
  return snap.exists() ? getProfile(snap.data().uid) : null;
}

// ----------------------------------------------------------------- servers

export async function getServer(sid: string): Promise<Server | null> {
  const snap = await getDoc(doc(db, "servers", sid));
  const data = snap.data();
  return data ? { id: sid, name: data.name, ownerId: data.ownerId } : null;
}

/** List the servers a user is in, keeping it up to date */
export function watchMyServers(
  uid: string,
  cb: (servers: Server[]) => void,
): Unsubscribe {
  let latest = 0;
  return onSnapshot(collection(db, "users", uid, "servers"), async (snap) => {
    const run = ++latest;
    const servers = await Promise.all(
      snap.docs.map((d) => getServer(d.id).catch(() => null)),
    );
    // ignore results that a newer snapshot has overtaken
    if (run === latest) cb(servers.filter((s): s is Server => s !== null));
  });
}

/**
 * Create a server with a #general channel
 * @param id Use a fixed id instead of a random one
 */
export async function createServer(
  profile: Profile,
  name: string,
  id?: string,
): Promise<string> {
  const server = id ? doc(db, "servers", id) : doc(collection(db, "servers"));

  const batch = writeBatch(db);
  batch.set(server, {
    name,
    ownerId: profile.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(server, "members", profile.uid), {
    username: profile.username,
    displayName: profile.displayName,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", profile.uid, "servers", server.id), {
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(collection(server, "channels")), {
    name: "general",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return server.id;
}

/**
 * Join a server by its code
 * @returns the server joined
 */
export async function joinServer(
  profile: Profile,
  code: string,
): Promise<Server> {
  const server = await getServer(code.trim());
  if (!server) throw new Error("No server has that invite code.");

  const member = doc(db, "servers", server.id, "members", profile.uid);
  if ((await getDoc(member)).exists()) return server;

  const batch = writeBatch(db);
  batch.set(member, {
    username: profile.username,
    displayName: profile.displayName,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", profile.uid, "servers", server.id), {
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return server;
}

/**
 * Put a new account in Da Group, creating it if this is the first account
 * (whoever signs up first becomes its owner)
 */
export async function joinDefaultServer(profile: Profile) {
  if (await getServer(DEFAULT_SERVER_ID)) {
    await joinServer(profile, DEFAULT_SERVER_ID);
  } else {
    await createServer(profile, DEFAULT_SERVER_NAME, DEFAULT_SERVER_ID);
  }
}

export async function leaveServer(uid: string, sid: string) {
  await deleteDoc(doc(db, "servers", sid, "members", uid));
  await deleteDoc(doc(db, "users", uid, "servers", sid));
}

/** Remove a server from someone's list once they're no longer a member */
export async function forgetServer(uid: string, sid: string) {
  await deleteDoc(doc(db, "users", uid, "servers", sid));
}

export async function isMember(uid: string, sid: string) {
  return (await getDoc(doc(db, "servers", sid, "members", uid))).exists();
}

export async function kickMember(sid: string, uid: string) {
  await deleteDoc(doc(db, "servers", sid, "members", uid));
}

export function watchMembers(
  sid: string,
  cb: (members: Member[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "servers", sid, "members"),
    (snap) =>
      cb(
        snap.docs
          .map((d) => ({
            id: d.id,
            username: d.data().username,
            displayName: d.data().displayName,
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      ),
    onError,
  );
}

// ---------------------------------------------------------------- channels

export function watchChannels(
  sid: string,
  cb: (channels: Channel[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "servers", sid, "channels"), orderBy("createdAt")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, name: d.data().name }))),
    onError,
  );
}

export async function createChannel(sid: string, name: string) {
  if (!CHANNEL_PATTERN.test(name))
    throw new Error(
      "Channel names are up to 32 lowercase letters, numbers and dashes.",
    );
  const ref = doc(collection(db, "servers", sid, "channels"));
  await setDoc(ref, { name, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteChannel(sid: string, cid: string) {
  await deleteDoc(doc(db, "servers", sid, "channels", cid));
}

// ---------------------------------------------------------------- messages

export function watchMessages(
  path: MessagesPath,
  cb: (messages: Message[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      messagesCollection(path),
      orderBy("createdAt"),
      limitToLast(MESSAGE_LIMIT),
    ),
    (snap) => cb(snap.docs.map(toMessage)),
    onError,
  );
}

export async function sendMessage(
  path: MessagesPath,
  profile: Profile,
  content: string,
) {
  const batch = writeBatch(db);
  batch.set(doc(messagesCollection(path)), {
    authorId: profile.uid,
    authorName: profile.displayName,
    content,
    createdAt: serverTimestamp(),
  });
  if (path.kind === "dm") {
    batch.update(doc(db, "dms", path.dmId), { updatedAt: serverTimestamp() });
  }
  await batch.commit();
}

export async function deleteMessage(path: MessagesPath, id: string) {
  await deleteDoc(doc(messagesCollection(path), id));
}

// --------------------------------------------------------- direct messages

export function watchDms(uid: string, cb: (dms: Dm[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "dms"), where("members", "array-contains", uid)),
    (snap) =>
      cb(
        snap.docs
          .map((d) => {
            const data = d.data({ serverTimestamps: "estimate" });
            return {
              id: d.id,
              members: data.members as string[],
              updatedAt: toDate(data.updatedAt),
            };
          })
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      ),
  );
}

/**
 * Open (creating if needed) a DM with someone
 * @returns the DM id
 */
export async function openDm(myUid: string, otherUid: string) {
  if (myUid === otherUid) throw new Error("You can't message yourself.");
  const members = [myUid, otherUid].sort();
  const id = members.join("_");
  const ref = doc(db, "dms", id);
  if (!(await getDoc(ref)).exists()) {
    await setDoc(ref, { members, updatedAt: serverTimestamp() });
  }
  return id;
}
