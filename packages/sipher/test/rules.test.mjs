// Security rule tests. Run with the Firestore emulator going:
//   firebase emulators:start --only firestore   (in packages/sipher)
//   pnpm test
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-sipher",
    firestore: {
      rules: readFileSync(
        new URL("../firestore.rules", import.meta.url),
        "utf8",
      ),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

after(() => env.cleanup());

const as = (uid, verified = true) =>
  env.authenticatedContext(uid, { email_verified: verified }).firestore();

const message = (uid, name, content = "hi") => ({
  authorId: uid,
  authorName: name,
  content,
  createdAt: serverTimestamp(),
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, name] of [
      ["owner", "Owner"],
      ["friend", "Friend"],
      ["stranger", "Stranger"],
    ]) {
      await setDoc(doc(db, "users", uid), {
        username: uid,
        displayName: name,
        createdAt: new Date(),
      });
      await setDoc(doc(db, "usernames", uid), { uid });
    }
    await setDoc(doc(db, "servers/da-group"), {
      name: "Da Group",
      ownerId: "owner",
      createdAt: new Date(),
    });
    for (const uid of ["owner", "friend"]) {
      await setDoc(doc(db, `servers/da-group/members/${uid}`), {
        username: uid,
        displayName: uid === "owner" ? "Owner" : "Friend",
        joinedAt: new Date(),
      });
    }
    await setDoc(doc(db, "servers/da-group/channels/general"), {
      name: "general",
      createdAt: new Date(),
    });
    await setDoc(doc(db, "servers/da-group/channels/general/messages/m1"), {
      ...message("owner", "Owner"),
      createdAt: new Date(),
    });
    await setDoc(doc(db, "dms/friend_owner"), {
      members: ["friend", "owner"],
      updatedAt: new Date(),
    });
    await setDoc(doc(db, "dms/friend_owner/messages/d1"), {
      ...message("owner", "Owner", "secret"),
      createdAt: new Date(),
    });
  });
});

const general = "servers/da-group/channels/general/messages";

describe("accounts", () => {
  it("signed out people can't read anything", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users/owner")));
    await assertFails(getDoc(doc(db, "servers/da-group")));
  });

  it("unverified emails can't use servers", async () => {
    const db = as("newbie", false);
    await assertFails(getDoc(doc(db, "servers/da-group")));
    await assertFails(getDocs(collection(db, general)));
  });

  it("can claim a free username", async () => {
    const db = as("newbie");
    const batch = writeBatch(db);
    batch.set(doc(db, "usernames/newbie"), { uid: "newbie" });
    batch.set(doc(db, "users/newbie"), {
      username: "newbie",
      displayName: "Newbie",
      createdAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it("can't take someone else's username", async () => {
    const db = as("newbie");
    const batch = writeBatch(db);
    batch.set(doc(db, "usernames/owner"), { uid: "newbie" });
    batch.set(doc(db, "users/newbie"), {
      username: "owner",
      displayName: "Fake",
      createdAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  it("can't edit someone else's profile", async () => {
    await assertFails(
      updateDoc(doc(as("friend"), "users/owner"), { displayName: "lol" }),
    );
  });
});

describe("servers", () => {
  it("members can read and post", async () => {
    const db = as("friend");
    await assertSucceeds(getDocs(collection(db, general)));
    await assertSucceeds(
      setDoc(doc(collection(db, general)), message("friend", "Friend")),
    );
  });

  it("non-members can't read messages until they join", async () => {
    await assertFails(getDocs(collection(as("stranger"), general)));
  });

  it("can't post as someone else", async () => {
    const db = as("friend");
    await assertFails(
      setDoc(doc(collection(db, general)), message("owner", "Owner")),
    );
    await assertFails(
      setDoc(doc(collection(db, general)), message("friend", "Owner")),
    );
  });

  it("only the owner can make channels", async () => {
    const channel = { name: "memes", createdAt: serverTimestamp() };
    await assertFails(
      setDoc(doc(as("friend"), "servers/da-group/channels/memes"), channel),
    );
    await assertSucceeds(
      setDoc(doc(as("owner"), "servers/da-group/channels/memes"), channel),
    );
  });

  it("can't delete other people's messages, but the owner can", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), `${general}/f1`), {
        ...message("friend", "Friend"),
        createdAt: new Date(),
      }),
    );
    await assertFails(deleteDoc(doc(as("friend"), `${general}/m1`)));
    await assertSucceeds(deleteDoc(doc(as("owner"), `${general}/f1`)));
  });

  it("nobody can take over Da Group", async () => {
    await assertFails(
      setDoc(doc(as("friend"), "servers/da-group"), {
        name: "Mine now",
        ownerId: "friend",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(as("owner"), "servers/da-group"), { ownerId: "friend" }),
    );
  });

  it("can join, but only as yourself", async () => {
    const join = (db, uid) =>
      setDoc(doc(db, `servers/da-group/members/${uid}`), {
        username: uid,
        displayName: "Stranger",
        joinedAt: serverTimestamp(),
      });
    await assertFails(join(as("friend"), "stranger"));
    await assertSucceeds(join(as("stranger"), "stranger"));
  });

  it("the owner can remove members, members can't remove others", async () => {
    await assertFails(
      deleteDoc(doc(as("friend"), "servers/da-group/members/owner")),
    );
    await assertSucceeds(
      deleteDoc(doc(as("owner"), "servers/da-group/members/friend")),
    );
  });

  it("the owner can't leave their own server", async () => {
    await assertFails(
      deleteDoc(doc(as("owner"), "servers/da-group/members/owner")),
    );
  });
});

describe("direct messages", () => {
  it("the two people can read and reply", async () => {
    const db = as("friend");
    await assertSucceeds(getDocs(collection(db, "dms/friend_owner/messages")));
    await assertSucceeds(
      setDoc(
        doc(collection(db, "dms/friend_owner/messages")),
        message("friend", "Friend"),
      ),
    );
  });

  it("nobody else can read or post", async () => {
    const db = as("stranger");
    await assertFails(getDoc(doc(db, "dms/friend_owner")));
    await assertFails(getDocs(collection(db, "dms/friend_owner/messages")));
    await assertFails(
      setDoc(
        doc(collection(db, "dms/friend_owner/messages")),
        message("stranger", "Stranger"),
      ),
    );
  });

  it("can't start a DM between two other people", async () => {
    await assertFails(
      setDoc(doc(as("stranger"), "dms/friend_owner"), {
        members: ["friend", "owner"],
        updatedAt: serverTimestamp(),
      }),
    );
  });
});
