import type { Webhook } from "stoat-api";

import { ChannelWebhook } from "../classes/ChannelWebhook.js";
import type { HydratedChannelWebhook } from "../hydration/channelWebhook.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Channel Webhooks
 */
export class ChannelWebhookCollection extends ClassCollection<
  ChannelWebhook,
  HydratedChannelWebhook
> {
  /**
   * Fetch webhook by ID
   * @param id Id
   * @returns Webhook
   */
  async fetch(id: string): Promise<ChannelWebhook> {
    const webhook = this.get(id);
    if (webhook) return webhook;
    const data = await this.client.api.get(`/webhooks/${id as ""}`);
    return this.getOrCreate(data.id, data as Webhook);
  }

  /**
   * Create webhook with ID and token
   * @param id Id
   * @param token Token
   * @returns Webhook
   */
  async fromToken(id: string, token: string): Promise<ChannelWebhook> {
    const webhook = this.get(id);
    if (webhook) return webhook;
    const data = await this.client.api.get(
      `/webhooks/${id as ""}/${token as ""}`,
    );
    return this.getOrCreate(data.id, data);
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   */
  getOrCreate(id: string, data: Webhook): ChannelWebhook {
    if (this.has(id)) {
      return this.get(id)!;
    } else {
      const instance = new ChannelWebhook(this, id);
      this.create(id, "channelWebhook", instance, this.client, data);
      return instance;
    }
  }
}
