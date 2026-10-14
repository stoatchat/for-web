import { Client } from "stoat.js";
import { afterEach, describe, expect, test, vi } from "vitest";

const VIEW = 2 ** 20;
const READ = 2 ** 21;
const SEND = 2 ** 22;

/**
 * Client holding one server we own, with three roles and gated channels
 */
function setup() {
  const client = new Client();
  client.user = client.users.getOrCreate("me", {
    _id: "me",
    username: "me",
    discriminator: "0001",
    relationship: "User",
    online: true,
  } as never);

  client.servers.getOrCreate("server", {
    _id: "server",
    owner: "me",
    name: "Server",
    channels: ["general", "memes", "staff"],
    default_permissions: VIEW + READ + SEND,
    roles: {
      mod: { name: "Mod", permissions: { a: 0, d: 0 }, rank: 1 },
      member: { name: "Member", permissions: { a: 0, d: 0 }, rank: 5 },
      helper: { name: "Helper", permissions: { a: 0, d: 0 }, rank: 6 },
    },
  } as never);

  const channel = (id: string, extra = {}) =>
    client.channels.getOrCreate(id, {
      _id: id,
      channel_type: "TextChannel",
      server: "server",
      name: id,
      ...extra,
    } as never);

  channel("general");
  channel("memes", {
    default_permissions: { a: 0, d: VIEW },
    role_permissions: { helper: { a: VIEW, d: 0 } },
  });
  channel("staff", {
    default_permissions: { a: 0, d: VIEW },
    role_permissions: { mod: { a: VIEW, d: 0 } },
  });

  client.serverMembers.getOrCreate({ server: "server", user: "me" }, {
    _id: { server: "server", user: "me" },
    joined_at: "2024-01-01T00:00:00Z",
    roles: [],
  } as never);

  const visible = () =>
    ["general", "memes", "staff"].filter((id) =>
      client.channels.get(id)!.havePermission("ViewChannel"),
    );

  return { client, server: client.servers.get("server")!, visible };
}

describe("view server as role", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("the owner sees everything when not previewing", () => {
    const { visible } = setup();
    expect(visible()).toEqual(["general", "memes", "staff"]);
  });

  test("previewing no roles hides gated channels", () => {
    const { client, visible } = setup();
    client.setViewAs("server");
    expect(visible()).toEqual(["general"]);
  });

  test("previewing several roles combines them", () => {
    const { client, visible } = setup();
    client.setViewAs("server", ["member", "helper"]);
    expect(visible()).toEqual(["general", "memes"]);

    client.setViewAs("server", ["helper", "mod"]);
    expect(visible()).toEqual(["general", "memes", "staff"]);
  });

  test("stopping the preview restores real permissions", () => {
    const { client, visible } = setup();
    client.setViewAs("server", ["member"]);
    client.setViewAs();
    expect(visible()).toEqual(["general", "memes", "staff"]);
  });

  test("our rank follows the preview but the real rank does not", () => {
    const { client, server } = setup();
    client.setViewAs("server", ["member", "mod"]);
    expect(server.member!.ranking).toBe(1);
    expect(server.member!.realRanking).toBe(-Infinity);
  });

  test("the default channel skips channels the role cannot see", () => {
    const { client, server } = setup();
    client.setViewAs("server", ["mod"]);
    expect(server.defaultChannel?.id).toBe("general");
  });

  test("changes to the previewed server are blocked", async () => {
    const { client } = setup();
    const fetch = vi.fn(() =>
      Promise.resolve(new Response("{}", { status: 200 })),
    );
    vi.stubGlobal("fetch", fetch);

    // Logging in replaces the API object, so the block must survive it
    client.useExistingSession({
      _id: "session",
      token: "token",
      user_id: "me",
    });
    client.setViewAs("server", ["mod"]);

    await expect(
      client.api.post("/channels/general/messages", { content: "hi" }),
    ).rejects.toEqual({ type: "ViewingAsRole" });
    await expect(client.api.delete("/servers/server")).rejects.toEqual({
      type: "ViewingAsRole",
    });
    await expect(client.api.delete("/invites/code")).rejects.toEqual({
      type: "ViewingAsRole",
    });
    expect(fetch).not.toHaveBeenCalled();

    // Marking as read is still allowed
    await client.api.put("/channels/general/ack/message");
    expect(fetch).toHaveBeenCalledOnce();

    // Stopping the preview restores write permissions
    client.setViewAs();
    await client.api.post("/channels/general/messages", { content: "hi" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
