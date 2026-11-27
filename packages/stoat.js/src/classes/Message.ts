import type { ReactiveMap } from "@solid-primitives/map";
import type { ReactiveSet } from "@solid-primitives/set";
import type {
  Message as APIMessage,
  MessageWebhook as APIMessageWebhook,
  DataEditMessage,
  DataMessageSend,
  Masquerade,
} from "stoat-api";
import { decodeTime } from "ulid";

import type { Client } from "../Client.js";
import type { MessageCollection } from "../collections/MessageCollection.js";
import { MessageFlags } from "../hydration/message.js";

import type { Channel } from "./Channel.js";
import { File } from "./File.js";
import type { MessageEmbed } from "./MessageEmbed.js";
import type { Server } from "./Server.js";
import type { ServerMember } from "./ServerMember.js";
import { ServerRole } from "./ServerRole.js";
import type { SystemMessage } from "./SystemMessage.js";
import type { User } from "./User.js";

/**
 * Message Class
 */
export class Message {
  readonly #collection: MessageCollection;
  readonly id: string;

  /**
   * Construct Message
   * @param collection Collection
   * @param id Message Id
   */
  constructor(collection: MessageCollection, id: string) {
    this.#collection = collection;
    this.id = id;
  }

  /**
   * Whether this object exists
   */
  get $exists(): boolean {
    return !!this.#collection.getUnderlyingObject(this.id).id;
  }

  /**
   * Time when this message was posted
   */
  get createdAt(): Date {
    return new Date(decodeTime(this.id));
  }

  /**
   * Absolute pathname to this message in the client
   */
  get path(): string {
    return `${this.channel?.path}/${this.id}`;
  }

  /**
   * URL to this message
   */
  get url(): string | undefined {
    return this.#collection.client.configuration?.app + this.path;
  }

  /**
   * Nonce value
   */
  get nonce(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).nonce;
  }

  /**
   * Id of channel this message was sent in
   */
  get channelId(): string {
    return this.#collection.getUnderlyingObject(this.id).channelId;
  }

  /**
   * Channel this message was sent in
   */
  get channel(): Channel | undefined {
    return this.#collection.client.channels.get(
      this.#collection.getUnderlyingObject(this.id).channelId,
    );
  }

  /**
   * Server this message was sent in
   */
  get server(): Server | undefined {
    return this.channel?.server;
  }

  /**
   * Member this message was sent by
   */
  get member(): ServerMember | undefined {
    return this.#collection.client.serverMembers.getByKey({
      server: this.channel?.serverId as string,
      user: this.authorId!,
    });
  }

  /**
   * Id of user or webhook this message was sent by
   */
  get authorId(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).authorId;
  }

  /**
   * User this message was sent by
   */
  get author(): User | undefined {
    return this.#collection.client.users.get(
      this.#collection.getUnderlyingObject(this.id).authorId!,
    );
  }

  /**
   * Webhook information for this message
   */
  get webhook(): MessageWebhook | undefined {
    return this.#collection.getUnderlyingObject(this.id).webhook!;
  }

  /**
   * Content
   */
  get content(): string {
    return this.#collection.getUnderlyingObject(this.id).content ?? "";
  }

  /**
   * Content converted to plain text
   */
  get contentPlain(): string {
    return this.#collection.client.markdownToText(this.content);
  }

  /**
   * System message content
   */
  get systemMessage(): SystemMessage | undefined {
    return this.#collection.getUnderlyingObject(this.id).systemMessage;
  }

  /**
   * Attachments
   */
  get attachments(): File[] | undefined {
    return this.#collection.getUnderlyingObject(this.id).attachments;
  }

  /**
   * Time at which this message was edited
   */
  get editedAt(): Date | undefined {
    return this.#collection.getUnderlyingObject(this.id).editedAt;
  }

  /**
   * Embeds
   */
  get embeds(): MessageEmbed[] | undefined {
    return this.#collection.getUnderlyingObject(this.id).embeds;
  }

  /**
   * IDs of users this message mentions
   */
  get mentionIds(): string[] | undefined {
    return this.#collection.getUnderlyingObject(this.id).mentionIds;
  }

  /**
   * IDs of roles this message mentions
   */
  get roleMentionIds(): string[] | undefined {
    return this.#collection.getUnderlyingObject(this.id).roleMentionIds;
  }

  /**
   * Roles this message mentions
   */
  get roleMentions(): ServerRole[] | undefined {
    return this.roleMentionIds
      ?.map((roleId) => this.server?.roles.get(roleId) as ServerRole)
      .filter((role) => role);
  }

  /**
   * Whether this message mentions us
   */
  get mentioned(): boolean {
    return (
      !!(this.flags & MessageFlags.MentionsEveryone) ||
      !!(this.flags & MessageFlags.MentionsOnline) ||
      (this.#collection.client.user &&
        this.mentionIds?.includes(this.#collection.client.user.id)) ||
      this.roleMentions?.some((role) => role.assigned) ||
      false
    );
  }

  /**
   * IDs of messages this message replies to
   */
  get replyIds(): string[] | undefined {
    return this.#collection.getUnderlyingObject(this.id).replyIds;
  }

  /**
   * Reactions
   */
  get reactions(): ReactiveMap<string, ReactiveSet<string>> {
    return this.#collection.getUnderlyingObject(this.id).reactions;
  }

  /**
   * Interactions
   */
  get interactions(): APIMessage["interactions"] {
    return this.#collection.getUnderlyingObject(this.id).interactions;
  }

  /**
   * Masquerade
   */
  get masquerade(): Masquerade | undefined {
    return this.#collection.getUnderlyingObject(this.id).masquerade;
  }

  /**
   * Whether this message is pinned
   */
  get pinned(): boolean {
    return this.#collection.getUnderlyingObject(this.id).pinned || false;
  }

  /**
   * Flags
   */
  get flags(): number {
    return this.#collection.getUnderlyingObject(this.id).flags || 0;
  }

  /**
   * Get the username for this message
   */
  get username(): string | undefined {
    const webhook = this.webhook;

    return (
      this.masquerade?.name ??
      (webhook
        ? webhook.name
        : (this.member?.nickname ??
          this.author?.displayName ??
          this.author?.username))
    );
  }

  /**
   * Get the role colour for this message
   */
  get roleColour(): string | null | undefined {
    return this.masquerade?.colour ?? this.member?.roleColour;
  }

  /**
   * Get the role colour for this message
   */
  get iconRole(): ServerRole | null | undefined {
    return this.member?.iconRole;
  }

  /**
   * Get the avatar URL for this message
   */
  get avatarURL(): string | undefined {
    const webhook = this.webhook;

    return (
      this.masqueradeAvatarURL ??
      (webhook
        ? webhook.avatarURL
        : (this.member?.avatarURL ?? this.author?.avatarURL))
    );
  }

  /**
   * Get the animated avatar URL for this message
   */
  get animatedAvatarURL(): string | undefined {
    const webhook = this.webhook;

    return (
      this.masqueradeAvatarURL ??
      (webhook
        ? webhook.avatarURL
        : this.member
          ? this.member?.animatedAvatarURL
          : this.author?.animatedAvatarURL)
    );
  }

  /**
   * Avatar URL from the masquerade
   */
  get masqueradeAvatarURL(): string | undefined {
    const avatar = this.masquerade?.avatar;
    return avatar ? this.#collection.client.proxyFile(avatar) : undefined;
  }

  /**
   * Whether this message has suppressed desktop/push notifications
   */
  get isSuppressed(): boolean {
    return (this.flags & 1) === 1;
  }

  /**
   * Edit a message
   * @param data Message edit route data
   */
  async edit(data: DataEditMessage): Promise<APIMessage> {
    return await this.#collection.client.api.patch(
      `/channels/${this.channelId as ""}/messages/${this.id as ""}`,
      data,
    );
  }

  /**
   * Delete a message
   */
  async delete(): Promise<void> {
    return await this.#collection.client.api.delete(
      `/channels/${this.channelId as ""}/messages/${this.id as ""}`,
    );
  }

  /**
   * Acknowledge this message as read
   * @param skipRateLimiter Whether to skip the internal rate limiter
   * @param skipRequest For internal updates only
   * @param skipNextMarking For internal usage only
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   */
  ack(
    skipRateLimiter?: boolean,
    skipRequest?: boolean,
    skipNextMarking?: boolean,
  ): void {
    this.channel?.ack(this, skipRateLimiter, skipRequest, skipNextMarking);
  }

  /**
   * Reply to Message
   */
  reply(
    data:
      | string
      | (Omit<DataMessageSend, "nonce"> & {
          nonce?: string;
        }),
    mention = true,
  ): Promise<Message> | undefined {
    const obj = typeof data === "string" ? { content: data } : data;
    return this.channel?.sendMessage({
      ...obj,
      replies: [{ id: this.id, mention }],
    });
  }

  /**
   * Clear all reactions from this message
   */
  async clearReactions(): Promise<void> {
    return await this.#collection.client.api.delete(
      `/channels/${this.channelId as ""}/messages/${this.id as ""}/reactions`,
    );
  }

  /**
   * React to a message
   * @param emoji Unicode or emoji ID
   */
  async react(emoji: string): Promise<void> {
    return await this.#collection.client.api.put(
      `/channels/${this.channelId as ""}/messages/${this.id as ""}/reactions/${
        emoji as ""
      }`,
    );
  }

  /**
   * Un-react from a message
   * @param emoji Unicode or emoji ID
   * @param deleteAll Remove all reactions
   */
  async unreact(emoji: string, deleteAll = false): Promise<void> {
    return await this.#collection.client.api.delete(
      `/channels/${this.channelId as ""}/messages/${this.id as ""}/reactions/${
        emoji as ""
      }`,
      { remove_all: deleteAll },
    );
  }

  /**
   * Pin the message
   */
  pin(): Promise<void> {
    return this.#collection.client.api.post(
      `/channels/${this.channelId as ""}/messages/${this.id as ""}/pin`,
    );
  }

  /**
   * Unpin the message
   */
  unpin(): Promise<void> {
    return this.#collection.client.api.delete(
      `/channels/${this.channelId as ""}/messages/${this.id as ""}/pin`,
    );
  }
}

/**
 * Message Webhook Class
 */
export class MessageWebhook {
  #client: Client;

  readonly id: string;
  readonly name: string;
  readonly avatar?: File;

  /**
   * Construct Message Webhook
   * @param client Client
   * @param webhook Webhook data
   */
  constructor(client: Client, webhook: APIMessageWebhook, id: string) {
    this.#client = client;
    this.id = id;
    this.name = webhook.name;
    this.avatar = webhook.avatar
      ? new File(client, {
          _id: webhook.avatar,
          tag: "avatars",
          metadata: {
            type: "Image",
            width: 256,
            height: 256,
          },
        })
      : undefined;
  }

  /**
   * Get the avatar URL for this message webhook
   */
  get avatarURL(): string {
    return (
      this.avatar?.createFileURL() ??
      `${this.#client.options.baseURL}/users/${this.id}/default_avatar`
    );
  }
}
