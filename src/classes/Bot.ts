import type { DataEditBot, DiscoverRequest } from "stoat-api";
import { decodeTime } from "ulid";

import type { BotCollection } from "../collections/BotCollection.js";
import type { BotFlags } from "../hydration/bot.js";
import { hydrate } from "../hydration/index.js";

import { PublicBot } from "./PublicBot.js";
import type { User } from "./User.js";

/**
 * Bot Class
 */
export class Bot {
  readonly #collection: BotCollection;
  readonly id: string;

  /**
   * Construct Bot
   * @param collection Collection
   * @param id Id
   */
  constructor(collection: BotCollection, id: string) {
    this.#collection = collection;
    this.id = id;
  }

  /**
   * Convert to string
   * @returns String
   */
  toString(): string {
    return `<@${this.id}>`;
  }

  /**
   * Whether this object exists
   */
  get $exists(): boolean {
    return !!this.#collection.getUnderlyingObject(this.id).id;
  }

  /**
   * Time when this user created their account
   */
  get createdAt(): Date {
    return new Date(decodeTime(this.id));
  }

  /**
   * Corresponding user
   */
  get user(): User | undefined {
    return this.#collection.client.users.get(this.id);
  }

  /**
   * Owner's Id
   */
  get ownerId(): string {
    return this.#collection.getUnderlyingObject(this.id).ownerId;
  }

  /**
   * Owner
   */
  get owner(): User | undefined {
    return this.#collection.client.users.get(this.ownerId);
  }

  /**
   * Bot Token
   */
  get token(): string {
    return this.#collection.getUnderlyingObject(this.id).token;
  }

  /**
   * Whether this bot can be invited by anyone
   */
  get public(): boolean {
    return this.#collection.getUnderlyingObject(this.id).public;
  }

  /**
   * Whether this bot has analytics enabled
   */
  get analytics(): boolean {
    return this.#collection.getUnderlyingObject(this.id).analytics;
  }

  /**
   * Whether this bot shows up on Discover
   */
  get discoverable(): boolean {
    return this.#collection.getUnderlyingObject(this.id).discoverable;
  }

  /**
   * Interactions URL
   */
  get interactionsUrl(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).interactionsUrl;
  }

  /**
   * Link to terms of service
   */
  get termsOfServiceUrl(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).termsOfServiceUrl;
  }

  /**
   * Link to privacy policy
   */
  get privacyPolicyUrl(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).privacyPolicyUrl;
  }

  /**
   * Bot Flags
   */
  get flags(): BotFlags {
    return this.#collection.getUnderlyingObject(this.id).flags;
  }

  /**
   * Bot default permissions
   */
  get defaultPermissions(): number | undefined {
    return this.#collection.getUnderlyingObject(this.id).defaultPermissions;
  }

  /**
   * Instantiate `PublicBot` class from this bot
   */
  get publicBot(): PublicBot {
    return new PublicBot(this.#collection.client, {
      _id: this.id,
      username: this.user?.username ?? "",
      avatar: this.user?.avatar?.id,
      default_permissions:
        this.defaultPermissions !== undefined
          ? Number(this.defaultPermissions)
          : undefined,
    });
  }

  /**
   * Edit a bot
   * @param data Changes
   */
  async edit(data: DataEditBot): Promise<void> {
    this.#collection.updateUnderlyingObject(
      this.id,
      hydrate(
        "bot",
        await this.#collection.client.api.patch(`/bots/${this.id as ""}`, data),
        this.#collection.client,
        false,
      ),
    );
  }

  /**
   * Delete a bot
   */
  async delete(): Promise<void> {
    await this.#collection.client.api.delete(`/bots/${this.id as ""}`);
    this.#collection.delete(this.id);
  }

  /**
   * Add bot to the discover request queue
   */
  async requestDiscover(): Promise<void> {
    await this.#collection.client.api.put(`/bots/${this.id as ""}/discover`);
  }

  /**
   * Get the status of the discover request for this bot
   * @returns The discovery request for this bot if one exists
   */
  async discoverRequestStatus(): Promise<DiscoverRequest> {
    return await this.#collection.client.api.get(
      `/bots/${this.id as ""}/discover`,
    );
  }

  /**
   * Cancel the discover request for this bot
   *
   * This cannot be used to remove bots from discover that have already been accepted
   * and should only be called on bots that have an outstanding discover request.
   */
  async cancelDiscoverRequest() {
    await this.#collection.client.api.delete(`/bots/${this.id as ""}/discover`);
  }
}
