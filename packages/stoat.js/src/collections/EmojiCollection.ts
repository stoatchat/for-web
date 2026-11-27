import type { Emoji as APIEmoji } from "stoat-api";

import { Emoji } from "../classes/Emoji.js";
import type { HydratedEmoji } from "../hydration/emoji.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Emoji
 */
export class EmojiCollection extends ClassCollection<Emoji, HydratedEmoji> {
  /**
   * Fetch emoji by ID
   * @param id Id
   * @returns Emoji
   */
  async fetch(id: string): Promise<Emoji> {
    const emoji = this.get(id);
    if (emoji && !this.isPartial(id)) return emoji;
    const data = await this.client.api.get(`/custom/emoji/${id as ""}`);
    return this.getOrCreate(data._id, data);
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   * @param isNew Whether this object is new
   */
  getOrCreate(id: string, data: APIEmoji, isNew = false): Emoji {
    if (this.has(id) && !this.isPartial(id)) {
      return this.get(id)!;
    } else {
      const instance = new Emoji(this, id);
      this.create(id, "emoji", instance, this.client, data);
      if (isNew) this.client.emit("emojiCreate", instance);
      return instance;
    }
  }

  /**
   * Get or return partial
   * @param id Id
   */
  getOrPartial(id: string): Emoji | undefined {
    if (this.has(id)) {
      return this.get(id)!;
    } else if (this.client.options.partials) {
      const instance = new Emoji(this, id);
      this.create(id, "emoji", instance, this.client, {
        id,
      });
      return instance;
    }
  }
}
