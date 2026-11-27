import type { BannedUser as APIBannedUser } from "stoat-api";

import type { Client } from "../Client.js";

import { File } from "./File.js";

/**
 * Banned User
 */
export class BannedUser {
  readonly id: string;
  readonly avatar?: File;
  readonly username: string;
  readonly discriminator: string;

  /**
   * Construct Banned User
   * @param client Client
   * @param data Data
   */
  constructor(client: Client, data: APIBannedUser) {
    this.id = data._id;
    this.avatar = data.avatar ? new File(client, data.avatar) : undefined;
    this.username = data.username;
    this.discriminator = data.discriminator;
  }
}
