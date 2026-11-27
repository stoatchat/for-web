import { Accessor, Setter, batch, createSignal } from "solid-js";

import { ReactiveMap } from "@solid-primitives/map";
import type { ReactiveSet } from "@solid-primitives/set";
import type {
  Channel as APIChannel,
  Member as APIMember,
  Message as APIMessage,
  User as APIUser,
  DataCreateInvite,
  DataEditChannel,
  DataMessageSearch,
  DataMessageSend,
  Invite,
  Override,
} from "stoat-api";
import type { APIRoutes } from "stoat-api";
import { decodeTime, ulid } from "ulid";

import { ChannelCollection } from "../collections/index.js";
import { UserSlowmodes } from "../events/v1.js";
import { hydrate } from "../hydration/index.js";
import {
  bitwiseAndEq,
  calculatePermission,
} from "../permissions/calculator.js";
import { Permission } from "../permissions/definitions.js";

import type { ChannelWebhook } from "./ChannelWebhook.js";
import type { File } from "./File.js";
import type { Message } from "./Message.js";
import type { Server } from "./Server.js";
import type { ServerMember } from "./ServerMember.js";
import type { User } from "./User.js";
import { VoiceParticipant, VoiceStatus } from "./VoiceParticipant.js";

/**
 * Channel Class
 */
export class Channel {
  readonly #collection: ChannelCollection;
  readonly id: string;

  _typingTimers: Record<string, number> = {};

  voiceParticipants = new ReactiveMap<string, VoiceParticipant>();

  readonly userSlowmode: Accessor<UserSlowmodes | undefined>;
  readonly #setUserSlowmode: Setter<UserSlowmodes | undefined>;
  #slowmodeTimeout: NodeJS.Timeout | undefined;

  /**
   * Construct Channel
   * @param collection Collection
   * @param id Channel Id
   */
  constructor(collection: ChannelCollection, id: string) {
    this.#collection = collection;
    this.id = id;

    const [slowmode, setSlowmode] = createSignal<UserSlowmodes | undefined>();
    this.userSlowmode = slowmode;
    this.#setUserSlowmode = setSlowmode;
  }

  /**
   * Write to string as a channel mention
   * @returns Formatted String
   */
  toString(): string {
    return `<#${this.id}>`;
  }

  /**
   * Whether this object exists
   */
  get $exists(): boolean {
    return !!this.#collection.getUnderlyingObject(this.id).id;
  }

  /**
   * Time when this server was created
   */
  get createdAt(): Date {
    return new Date(decodeTime(this.id));
  }

  /**
   * Channel type
   */
  get type(): APIChannel["channel_type"] {
    return this.#collection.getUnderlyingObject(this.id).channelType;
  }

  /**
   * Absolute pathname to this channel in the client
   */
  get path(): string {
    if (this.serverId) {
      return `/server/${this.serverId}/channel/${this.id}`;
    } else {
      return `/channel/${this.id}`;
    }
  }

  /**
   * URL to this channel
   */
  get url(): string {
    return this.#collection.client.configuration?.app + this.path;
  }

  /**
   * Channel name
   */
  get name(): string {
    return this.#collection.getUnderlyingObject(this.id).name;
  }

  /**
   * Display name
   */
  get displayName(): string | undefined {
    return this.type === "SavedMessages"
      ? this.user?.username
      : this.type === "DirectMessage"
        ? this.recipient?.username
        : this.name;
  }

  /**
   * Channel description
   */
  get description(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).description;
  }

  /**
   * Channel icon
   */
  get icon(): File | undefined {
    return this.#collection.getUnderlyingObject(this.id).icon;
  }

  /**
   * Whether the conversation is active
   */
  get active(): boolean {
    return this.#collection.getUnderlyingObject(this.id).active;
  }

  /**
   * User ids of people currently typing in channel
   */
  get typingIds(): ReactiveSet<string> {
    return this.#collection.getUnderlyingObject(this.id).typingIds;
  }

  /**
   * Users currently trying in channel
   */
  get typing(): User[] {
    return [...this.typingIds.values()].map(
      (id) => this.#collection.client.users.get(id)!,
    );
  }

  /**
   * User ids of recipients of the group
   */
  get recipientIds(): ReactiveSet<string> {
    return this.#collection.getUnderlyingObject(this.id).recipientIds;
  }

  /**
   * Recipients of the group
   */
  get recipients(): User[] {
    return [
      ...this.#collection.getUnderlyingObject(this.id).recipientIds.values(),
    ].map((id) => this.#collection.client.users.get(id)!);
  }

  /**
   * Find recipient of this DM
   */
  get recipient(): User | undefined {
    return this.type === "DirectMessage"
      ? this.recipients?.find(
          (user) => user && user?.id !== this.#collection.client.user?.id,
        )
      : undefined;
  }

  /**
   * User ID
   */
  get userId(): string {
    return this.#collection.getUnderlyingObject(this.id).userId!;
  }

  /**
   * User this channel belongs to
   */
  get user(): User | undefined {
    return this.#collection.client.users.get(
      this.#collection.getUnderlyingObject(this.id).userId!,
    );
  }

  /**
   * Owner ID
   */
  get ownerId(): string {
    return this.#collection.getUnderlyingObject(this.id).ownerId!;
  }

  /**
   * Owner of the group
   */
  get owner(): User | undefined {
    return this.#collection.client.users.get(
      this.#collection.getUnderlyingObject(this.id).ownerId!,
    );
  }

  /**
   * Server ID
   */
  get serverId(): string {
    return this.#collection.getUnderlyingObject(this.id).serverId!;
  }

  /**
   * Server this channel is in
   */
  get server(): Server | undefined {
    return this.#collection.client.servers.get(
      this.#collection.getUnderlyingObject(this.id).serverId!,
    );
  }

  /**
   * Permissions allowed for users in this group
   */
  get permissions(): bigint | undefined {
    return this.#collection.getUnderlyingObject(this.id).permissions;
  }

  /**
   * Default permissions for this server channel
   */
  get defaultPermissions(): { a: bigint; d: bigint } | undefined {
    return this.#collection.getUnderlyingObject(this.id).defaultPermissions;
  }

  /**
   * Role permissions for this server channel
   */
  get rolePermissions(): Record<string, { a: bigint; d: bigint }> | undefined {
    return this.#collection.getUnderlyingObject(this.id).rolePermissions;
  }

  /**
   * Whether this channel is marked as mature
   */
  get mature(): boolean {
    return this.#collection.getUnderlyingObject(this.id).nsfw;
  }

  /**
   * ID of the last message sent in this channel
   */
  get lastMessageId(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).lastMessageId;
  }

  /**
   * Last message sent in this channel
   */
  get lastMessage(): Message | undefined {
    return this.#collection.client.messages.get(this.lastMessageId!);
  }

  /**
   * Time when the last message was sent
   */
  get lastMessageAt(): Date | undefined {
    return this.lastMessageId && this.lastMessageId.length === 26
      ? new Date(decodeTime(this.lastMessageId))
      : undefined;
  }

  /**
   * Time when the channel was last updated (either created or a message was sent)
   */
  get updatedAt(): Date {
    return this.lastMessageAt ?? this.createdAt;
  }

  /**
   * Whether this channel is unread
   */
  get unread(): boolean {
    if (
      this.#collection.closed ||
      !this.lastMessageId ||
      this.type === "SavedMessages" ||
      this.#collection.client.options.channelExclusiveMuted(this)
    )
      return false;

    const unread = this.#collection.client.channelUnreads.for(this);
    return (
      (unread.lastMessageId ?? "0").localeCompare(this.lastMessageId) === -1 ||
      unread.messageMentionIds.size > 0
    );
  }

  /**
   * Whether this channel is muted
   */
  get muted(): boolean {
    return this.#collection.client.options.channelIsMuted(this);
  }

  /**
   * Get mentions in this channel for user.
   */
  get mentions(): ReactiveSet<string> | undefined {
    if (this.type === "SavedMessages") return undefined;

    return this.#collection.client.channelUnreads.get(this.id)
      ?.messageMentionIds;
  }

  /**
   * Whether this is a 'voice chats v2' channel
   *
   * NB. subject to change as vc(2) goes to production
   */
  get isVoice(): boolean {
    return (
      this.type === "DirectMessage" ||
      this.type === "Group" ||
      typeof this.#collection.getUnderlyingObject(this.id).voice === "object"
    );
  }

  /**
   * URL to the channel icon
   */
  get iconURL(): string | undefined {
    return this.icon?.createFileURL() ?? this.recipient?.avatarURL;
  }

  /**
   * URL to the animated channel icon
   */
  get animatedIconURL(): string | undefined {
    return this.icon?.createFileURL(true) ?? this.recipient?.animatedAvatarURL;
  }

  /**
   * Whether this channel may be hidden to some users
   */
  get potentiallyRestrictedChannel(): string | boolean | undefined {
    if (!this.serverId) return false;
    return (
      bitwiseAndEq(this.defaultPermissions?.d ?? 0n, Permission.ViewChannel) ||
      !bitwiseAndEq(this.server!.defaultPermissions, Permission.ViewChannel) ||
      [...(this.server?.roles.keys() ?? [])].find(
        (role) =>
          bitwiseAndEq(
            this.rolePermissions?.[role]?.d ?? 0n,
            Permission.ViewChannel,
          ) ||
          bitwiseAndEq(
            this.server?.roles.get(role)?.permissions.d ?? 0n,
            Permission.ViewChannel,
          ),
      )
    );
  }

  /**
   * Permission the currently authenticated user has against this channel
   */
  get permission(): bigint {
    return calculatePermission(this.#collection.client, this);
  }

  /**
   * Check whether we have a given permission in a channel
   * @param permission Permission Names
   * @returns Whether we have this permission
   */
  havePermission(...permission: (keyof typeof Permission)[]): boolean {
    return bitwiseAndEq(
      this.permission,
      ...permission.map((x) => Permission[x]),
    );
  }

  /**
   * Check whether we have at least one of the given permissions in a channel
   * @param permission Permission Names
   * @returns Whether we have one of the permissions
   */
  orPermission(...permission: (keyof typeof Permission)[]): boolean {
    return (
      permission.findIndex((x) =>
        bitwiseAndEq(this.permission, Permission[x]),
      ) !== -1
    );
  }

  /**
   * Fetch a channel's members.
   * @requires `Group`
   * @returns An array of the channel's members.
   */
  async fetchMembers(): Promise<User[]> {
    const members = await this.#collection.client.api.get(
      `/channels/${this.id as ""}/members`,
    );

    return batch(() =>
      members.map((user) =>
        this.#collection.client.users.getOrCreate(user._id, user),
      ),
    );
  }

  /**
   * Create a webhook
   * @param name Webhook name
   * @returns The newly-created webhook
   */
  async createWebhook(name: string): Promise<ChannelWebhook> {
    const webhook = await this.#collection.client.api.post(
      `/channels/${this.id as ""}/webhooks`,
      {
        name,
      },
    );

    return this.#collection.client.channelWebhooks.getOrCreate(
      webhook.id,
      webhook,
    );
  }

  /**
   * Fetch a channel's webhooks
   * @requires `TextChannel`, `Group`
   * @returns Webhooks
   */
  async fetchWebhooks(): Promise<ChannelWebhook[]> {
    const webhooks = await this.#collection.client.api.get(
      `/channels/${this.id as ""}/webhooks`,
    );

    return batch(() =>
      webhooks.map((webhook) =>
        this.#collection.client.channelWebhooks.getOrCreate(
          webhook.id,
          webhook,
        ),
      ),
    );
  }

  /**
   * Edit a channel
   * @param data Changes
   */
  async edit(data: DataEditChannel) {
    const channel = await this.#collection.client.api.patch(
      `/channels/${this.id as ""}`,
      data,
    );

    this.#collection.updateUnderlyingObject(
      this.id,
      hydrate("channel", channel, this.#collection.client, false),
    );
  }

  /**
   * Delete or leave a channel
   * @param leaveSilently Whether to not send a message on leave
   * @requires `DirectMessage`, `Group`, `TextChannel`
   */
  async delete(leaveSilently?: boolean): Promise<void> {
    await this.#collection.client.api.delete(`/channels/${this.id as ""}`, {
      leave_silently: leaveSilently,
    });

    if (this.type === "DirectMessage") {
      this.#collection.updateUnderlyingObject(this.id, "active", false);
      return;
    }

    this.#collection.delete(this.id);
  }

  /**
   * Add a user to a group
   * @param user_id ID of the target user
   * @requires `Group`
   */
  async addMember(user_id: string): Promise<void> {
    return await this.#collection.client.api.put(
      `/channels/${this.id as ""}/recipients/${user_id as ""}`,
    );
  }

  /**
   * Remove a user from a group
   * @param user_id ID of the target user
   * @requires `Group`
   */
  async removeMember(user_id: string): Promise<void> {
    return await this.#collection.client.api.delete(
      `/channels/${this.id as ""}/recipients/${user_id as ""}`,
    );
  }

  /**
   * Send a message
   * @param data Either the message as a string or message sending route data
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   * @returns Sent message
   */
  async sendMessage(
    data: string | DataMessageSend,
    idempotencyKey: string = ulid(),
  ): Promise<Message> {
    const msg: DataMessageSend =
      typeof data === "string" ? { content: data } : data;

    // Mark as silent message
    if (msg.content?.startsWith("@silent ")) {
      msg.content = msg.content.substring(8);
      msg.flags ||= 1;
      msg.flags |= 1;
    }

    const message = await this.#collection.client.api.post(
      `/channels/${this.id as ""}/messages`,
      msg,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    return this.#collection.client.messages.getOrCreate(
      message._id,
      message,
      true,
    );
  }

  /**
   * Fetch a message by its ID
   * @param messageId ID of the target message
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   * @returns Message
   */
  async fetchMessage(messageId: string): Promise<Message> {
    const message = await this.#collection.client.api.get(
      `/channels/${this.id as ""}/messages/${messageId as ""}`,
    );

    return this.#collection.client.messages.getOrCreate(message._id, message);
  }

  /**
   * Fetch multiple messages from a channel
   * @param params Message fetching route data
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   * @returns Messages
   */
  async fetchMessages(
    params?: Omit<
      (APIRoutes & {
        method: "get";
        path: "/channels/{target}/messages";
      })["params"],
      "include_users"
    >,
  ): Promise<Message[]> {
    const messages = (await this.#collection.client.api.get(
      `/channels/${this.id as ""}/messages`,
      { ...params },
    )) as APIMessage[];

    return messages.map((message) =>
      this.#collection.client.messages.getOrCreate(message._id, message),
    );
  }

  /**
   * Fetch multiple messages from a channel including the users that sent them
   * @param params Message fetching route data
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   * @returns Object including messages and users
   */
  async fetchMessagesWithUsers(
    params?: Omit<
      (APIRoutes & {
        method: "get";
        path: "/channels/{target}/messages";
      })["params"],
      "include_users"
    >,
  ): Promise<{
    messages: Message[];
    users: User[];
    members: ServerMember[] | undefined;
  }> {
    const data = (await this.#collection.client.api.get(
      `/channels/${this.id as ""}/messages`,
      { ...params, include_users: true },
    )) as { messages: APIMessage[]; users: APIUser[]; members?: APIMember[] };

    return batch(() => ({
      messages: data.messages.map((message) =>
        this.#collection.client.messages.getOrCreate(message._id, message),
      ),
      users: data.users.map((user) =>
        this.#collection.client.users.getOrCreate(user._id, user),
      ),
      members: data.members?.map((member) =>
        this.#collection.client.serverMembers.getOrCreate(member._id, member),
      ),
    }));
  }

  /**
   * Search for messages
   * @param params Message searching route data
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   * @returns Messages
   */
  async search(
    params: Omit<DataMessageSearch, "include_users">,
  ): Promise<Message[]> {
    const messages = (await this.#collection.client.api.post(
      `/channels/${this.id as ""}/search`,
      params,
    )) as APIMessage[];

    return batch(() =>
      messages.map((message) =>
        this.#collection.client.messages.getOrCreate(message._id, message),
      ),
    );
  }

  /**
   * Search for messages including the users that sent them
   * @param params Message searching route data
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   * @returns Object including messages and users
   */
  async searchWithUsers(
    params: Omit<DataMessageSearch, "include_users">,
  ): Promise<{
    messages: Message[];
    users: User[];
    members: ServerMember[] | undefined;
  }> {
    const data = (await this.#collection.client.api.post(
      `/channels/${this.id as ""}/search`,
      {
        ...params,
        include_users: true,
      },
    )) as { messages: APIMessage[]; users: APIUser[]; members?: APIMember[] };

    return batch(() => ({
      messages: data.messages.map((message) =>
        this.#collection.client.messages.getOrCreate(message._id, message),
      ),
      users: data.users.map((user) =>
        this.#collection.client.users.getOrCreate(user._id, user),
      ),
      members: data.members?.map((member) =>
        this.#collection.client.serverMembers.getOrCreate(member._id, member),
      ),
    }));
  }

  /**
   * Delete many messages by their IDs
   * @param ids List of message IDs
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   */
  async deleteMessages(ids: string[]): Promise<void> {
    await this.#collection.client.api.delete(
      `/channels/${this.id as ""}/messages/bulk`,
      {
        ids,
      },
    );
  }

  /**
   * Create an invite to the channel
   * @param data Invite options
   * @requires `TextChannel`
   * @returns Newly created invite code
   */
  async createInvite(data: DataCreateInvite = {}): Promise<Invite> {
    return await this.#collection.client.api.post(
      `/channels/${this.id as ""}/invites`,
      data,
    );
  }

  #ackTimeout?: number;
  #ackLimit?: number;
  #manuallyMarked?: boolean;

  /**
   * Clear pending timers and voice state held by this channel
   * @internal
   */
  _dispose(): void {
    for (const timer of Object.values(this._typingTimers)) clearTimeout(timer);
    this._typingTimers = {};
    clearTimeout(this.#ackTimeout);
    this.#ackTimeout = undefined;
    clearTimeout(this.#slowmodeTimeout);
    this.#slowmodeTimeout = undefined;
    this.voiceParticipants.clear();
  }

  /**
   * Mark a channel as read
   * @param message Last read message or its ID
   * @param skipRateLimiter Whether to skip the internal rate limiter
   * @param skipRequest For internal updates only
   * @param skipNextMarking For internal usage only
   * @requires `SavedMessages`, `DirectMessage`, `Group`, `TextChannel`
   */
  async ack(
    message?: Message | string,
    skipRateLimiter?: boolean,
    skipRequest?: boolean,
    skipNextMarking?: boolean,
  ): Promise<void> {
    // Nothing to acknowledge on a disposed client, and continuing would
    // re-arm the ack timer and touch the closed unread collection
    if (this.#collection.closed) return;

    if (!message && this.#manuallyMarked) {
      this.#manuallyMarked = false;
      return;
    }
    // Skip the next unread marking
    else if (skipNextMarking) {
      this.#manuallyMarked = true;
    }

    const lastMessageId =
      (typeof message === "string" ? message : message?.id) ??
      this.lastMessageId ??
      ulid();

    const channelUnread = this.#collection.client.channelUnreads.for(this);

    batch(() => {
      this.#collection.client.channelUnreads.updateUnderlyingObject(
        this.id,
        "lastMessageId",
        lastMessageId,
      );

      if (channelUnread.messageMentionIds.size) {
        channelUnread.messageMentionIds.clear();
      }
    });

    // Skip request if not needed
    if (skipRequest) return;

    /**
     * Send the actual acknowledgement request
     */
    const performAck = (): void => {
      this.#ackLimit = undefined;
      this.#collection.client.api.put(
        `/channels/${this.id}/ack/${lastMessageId as ""}`,
      );
    };

    if (skipRateLimiter) return performAck();

    clearTimeout(this.#ackTimeout);
    if (this.#ackLimit && +new Date() > this.#ackLimit) {
      performAck();
    }

    this.#ackTimeout = setTimeout(performAck, 1500) as unknown as number;

    if (!this.#ackLimit) {
      this.#ackLimit = +new Date() + 4e3;
    }
  }

  /**
   * Set role permissions
   * @param role_id Role Id, set to 'default' to affect all users
   * @param permissions Permission value
   * @requires `Group`, `TextChannel`
   */
  async setPermissions(
    role_id = "default",
    permissions: Override | number,
  ): Promise<APIChannel> {
    return await this.#collection.client.api.put(
      `/channels/${this.id as ""}/permissions/${role_id as ""}`,
      { permissions: permissions as never },
    );
  }

  /**
   * Get slowmode value for the channel
   */
  get slowmode(): number {
    return this.#collection.getUnderlyingObject(this.id).slowmode ?? 0;
  }

  /**
   * Join a call
   * @param node Target node
   * @param forceDisconnect Whether to disconnect existing call
   * @param recipients Ring targets
   * @returns LiveKit URL and Token
   */
  async joinCall(
    node?: string,
    forceDisconnect = true,
    recipients?: (User | string)[],
  ) {
    return await this.#collection.client.api.post(
      `/channels/${this.id as ""}/join_call`,
      {
        node,
        recipients: recipients?.map((entry) =>
          typeof entry === "string" ? entry : entry.id,
        ),
        force_disconnect: forceDisconnect,
      },
    );
  }

  /**
   * Start typing in this channel
   * @requires `DirectMessage`, `Group`, `TextChannel`
   */
  startTyping(): void {
    this.#collection.client.events.send({
      type: "BeginTyping",
      channel: this.id,
    });
  }

  /**
   * Stop typing in this channel
   * @requires `DirectMessage`, `Group`, `TextChannel`
   */
  stopTyping(): void {
    this.#collection.client.events.send({
      type: "EndTyping",
      channel: this.id,
    });
  }

  /**
   * The voice status of a channel. Screenshare supersedes video, video
   * supersedes voice, and voice supersedes none. This getter takes the highest
   * priority status from all participants in the channel.
   */
  get voiceStatus(): VoiceStatus {
    if (!this.isVoice || this.voiceParticipants.size === 0) {
      return "none";
    }

    let highest: VoiceStatus = "voice";
    for (const participant of this.voiceParticipants.values()) {
      const status = participant.voiceStatus;
      if (status === "screenshare") {
        return "screenshare";
      }
      if (status === "video") {
        highest = "video";
      }
    }

    return highest;
  }

  setUserSlowmode(slowmode: UserSlowmodes) {
    if (this.#collection.closed) return;
    if (this.#slowmodeTimeout) {
      clearTimeout(this.#slowmodeTimeout);
    }

    this.#setUserSlowmode({ ...slowmode, receivedAt: Date.now() });

    this.#slowmodeTimeout = setTimeout(() => {
      this.#setUserSlowmode();
      this.#slowmodeTimeout = undefined;
      this.#collection.client.emit("userSlowmodes");
    }, slowmode.retry_after * 1000);
  }
}
