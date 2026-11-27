import type {
  BannedUser as APIBannedUser,
  ServerBan as APIServerBan,
  MemberCompositeKey,
} from "stoat-api";

import type { Client } from "../Client.js";

import { BannedUser } from "./BannedUser.js";
import type { Server } from "./Server.js";

/**
 * Server Ban
 */
export class ServerBan {
  protected client: Client;
  readonly id: MemberCompositeKey;
  readonly reason?: string;
  readonly user?: BannedUser;

  /**
   * Construct Server Ban
   * @param client Client
   * @param data Data
   */
  constructor(client: Client, data: APIServerBan, user?: APIBannedUser) {
    this.client = client;
    this.id = data._id;
    this.reason = data.reason!;
    this.user = user ? new BannedUser(client, user) : undefined;
  }

  /**
   * Server
   */
  get server(): Server | undefined {
    return this.client.servers.get(this.id.server);
  }

  /**
   * Remove this server ban
   */
  async pardon(): Promise<void> {
    await this.client.api.delete(
      `/servers/${this.id.server as ""}/bans/${this.id.user as ""}`,
    );
  }
}
