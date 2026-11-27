import type { Channel as APIChannel } from "stoat-api";

import { Channel } from "../classes/Channel.js";
import { User } from "../classes/User.js";
import type { HydratedChannel } from "../hydration/channel.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Channels
 */
export class ChannelCollection extends ClassCollection<
  Channel,
  HydratedChannel
> {
  /**
   * Delete an object
   * @param id Id
   */
  override delete(id: string): void {
    const channel = this.get(id);
    channel?.server?.channelIds.delete(id);
    super.delete(id);
  }

  /**
   * Fetch channel by ID
   * @param id Id
   * @returns Channel
   */
  async fetch(id: string): Promise<Channel> {
    const channel = this.get(id);
    if (channel && !this.isPartial(id)) return channel;
    const data = await this.client.api.get(`/channels/${id as ""}`);
    return this.getOrCreate(data._id, data);
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   * @param isNew Whether this object is new
   */
  getOrCreate(id: string, data: APIChannel, isNew = false): Channel {
    if (this.has(id) && !this.isPartial(id)) {
      return this.get(id)!;
    } else {
      const instance = new Channel(this, id);
      this.create(id, "channel", instance, this.client, data);
      if (isNew) this.client.emit("channelCreate", instance);
      return instance;
    }
  }

  /**
   * Get or return partial
   * @param id Id
   */
  getOrPartial(id: string): Channel | undefined {
    if (this.has(id)) {
      return this.get(id)!;
    } else if (this.client.options.partials) {
      const instance = new Channel(this, id);
      this.create(id, "channel", instance, this.client, {
        id,
        partial: true,
      });
      return instance;
    }
  }

  /**
   * Create a group
   * @param name Group name
   * @param users Users to add
   * @returns The newly-created group
   */
  async createGroup(name: string, users: (User | string)[]): Promise<Channel> {
    const group = await this.client.api.post(`/channels/create`, {
      name,
      users: users.map((user) => (user instanceof User ? user.id : user)),
    });

    return this.getOrCreate(group._id, group, true);
  }

  override _close(): void {
    super._close();
    for (const channel of this.values()) channel._dispose();
  }
}
