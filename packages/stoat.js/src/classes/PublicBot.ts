import type { File as APIFile, PublicBot as APIPublicBot } from "stoat-api";

import type { Client } from "../Client.js";

import { Channel } from "./Channel.js";
import { File } from "./File.js";
import { Server } from "./Server.js";

/**
 * Public Bot Class
 */
export class PublicBot {
  #client: Client;

  readonly id: string;
  readonly username: string;
  readonly avatar?: File;
  readonly description?: string;
  /**
   * Permissions the bot asks for (0n when unset or the instance doesn't send them)
   */
  readonly defaultPermissions: bigint;

  /**
   * Construct Public Bot
   * @param client Client
   * @param data Data
   */
  constructor(client: Client, data: APIPublicBot) {
    this.#client = client;
    this.id = data._id;
    this.username = data.username;
    this.avatar = data.avatar
      ? new File(client, {
          _id: data.avatar,
          tag: "avatars",
        } as APIFile)
      : undefined;
    this.description = data.description!;

    const requested = data.default_permissions as number | null | undefined;
    this.defaultPermissions = requested != null ? BigInt(requested) : 0n;
  }

  /**
   * Add the bot to a server
   * @param server Server
   * @param permissions Permissions to grant the bot (requires Manage Roles)
   */
  addToServer(server: Server | string, permissions?: bigint): void {
    this.#client.api.post(`/bots/${this.id as ""}/invite`, {
      server: server instanceof Server ? server.id : server,
      permissions: permissions ? Number(permissions) : undefined,
    });
  }

  /**
   * Add the bot to a group
   * @param group Group
   */
  addToGroup(group: Channel | string): void {
    // TODO: should use GroupChannel once that is added
    this.#client.api.post(`/bots/${this.id as ""}/invite`, {
      group: group instanceof Channel ? group.id : group,
    });
  }
}
