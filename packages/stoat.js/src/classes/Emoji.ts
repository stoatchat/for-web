import type { DataEditEmoji, EmojiParent } from "stoat-api";
import { decodeTime } from "ulid";

import type { EmojiCollection } from "../collections/EmojiCollection.js";
import { hydrate } from "../hydration/index.js";

import type { User } from "./User.js";

/**
 * Emoji Class
 */
export class Emoji {
  readonly #collection: EmojiCollection;
  readonly id: string;

  /**
   * Construct Emoji
   * @param collection Collection
   * @param id Emoji Id
   */
  constructor(collection: EmojiCollection, id: string) {
    this.#collection = collection;
    this.id = id;
  }

  /**
   * Convert to string
   * @returns String
   */
  toString(): string {
    return `:${this.id}:`;
  }

  /**
   * Whether this object exists
   */
  get $exists(): boolean {
    return !!this.#collection.getUnderlyingObject(this.id).id;
  }

  /**
   * Time when this emoji was created
   */
  get createdAt(): Date {
    return new Date(decodeTime(this.id));
  }

  /**
   * Information about the parent of this emoji
   */
  get parent(): EmojiParent {
    return this.#collection.getUnderlyingObject(this.id).parent;
  }

  /**
   * Creator of the emoji
   */
  get creator(): User | undefined {
    return this.#collection.client.users.get(
      this.#collection.getUnderlyingObject(this.id).creatorId,
    );
  }

  /**
   * Name
   */
  get name(): string {
    return this.#collection.getUnderlyingObject(this.id).name;
  }

  /**
   * Whether the emoji is animated
   */
  get animated(): boolean {
    return this.#collection.getUnderlyingObject(this.id).animated;
  }

  /**
   * Whether the emoji is marked as mature
   */
  get mature(): boolean {
    return this.#collection.getUnderlyingObject(this.id).nsfw;
  }

  /**
   * URL to emoji
   */
  get url() {
    return `${this.#collection.client.configuration?.features.autumn.url}/emojis/${
      this.id
    }`;
  }

  async edit(data: DataEditEmoji): Promise<void> {
    this.#collection.updateUnderlyingObject(
      this.id,
      hydrate(
        "emoji",
        await this.#collection.client.api.patch(
          `/custom/emoji/${this.id as ""}`,
          data,
        ),
        this.#collection.client,
        false,
      ),
    );
  }

  /**
   * Delete Emoji
   */
  async delete(): Promise<void> {
    await this.#collection.client.api.delete(`/custom/emoji/${this.id}`);

    const emoji = this.#collection.getUnderlyingObject(this.id);
    if (emoji) {
      this.#collection.client.emit("emojiDelete", emoji);
      this.#collection.delete(this.id);
    }
  }
}
