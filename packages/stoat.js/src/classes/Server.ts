import { batch } from "solid-js";

import type { ReactiveMap } from "@solid-primitives/map";
import type { ReactiveSet } from "@solid-primitives/set";
import type {
  APIRoutes,
  Server as APIServer,
  AllMemberResponse,
  AuditLogEntry,
  BannedUser,
  Category,
  DataBanCreate,
  DataCreateEmoji,
  DataCreateServerChannel,
  DataEditRole,
  DataEditServer,
  DiscoverRequest,
  Override,
  Role,
} from "stoat-api";
import { decodeTime } from "ulid";

import type { ServerCollection } from "../collections/ServerCollection.js";
import { hydrate } from "../hydration/index.js";
import type { ServerFlags } from "../hydration/server.js";
import { HydratedServerMember } from "../hydration/serverMember.js";
import { HydratedUser } from "../hydration/user.js";
import {
  bitwiseAndEq,
  calculatePermission,
} from "../permissions/calculator.js";
import { Permission } from "../permissions/definitions.js";

import type { Channel } from "./Channel.js";
import type { Emoji } from "./Emoji.js";
import type { File } from "./File.js";
import { ChannelInvite } from "./Invite.js";
import { ServerBan } from "./ServerBan.js";
import { ServerMember } from "./ServerMember.js";
import { ServerRole } from "./ServerRole.js";
import { User } from "./User.js";
import { VoiceStatus } from "./VoiceParticipant.js";

/**
 * Server Class
 */
export class Server {
  readonly #collection: ServerCollection;
  readonly id: string;

  /**
   * Construct Server
   * @param collection Collection
   * @param id Id
   */
  constructor(collection: ServerCollection, id: string) {
    this.#collection = collection;
    this.id = id;
  }
  /**
   * Convert to string
   * @returns String
   */
  toString(): string {
    return `<%${this.id}>`;
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
   * Owner's user ID
   */
  get ownerId(): string {
    return this.#collection.getUnderlyingObject(this.id).ownerId;
  }

  /**
   * Owner
   */
  get owner(): User | undefined {
    return this.#collection.client.users.get(
      this.#collection.getUnderlyingObject(this.id).ownerId,
    );
  }

  /**
   * Absolute pathname to this server in the client
   */
  get path(): string {
    return `/server/${this.id}`;
  }

  /**
   * Name
   */
  get name(): string {
    return this.#collection.getUnderlyingObject(this.id).name;
  }

  /**
   * Description
   */
  get description(): string | undefined {
    return this.#collection.getUnderlyingObject(this.id).description;
  }

  /**
   * Icon
   */
  get icon(): File | undefined {
    return this.#collection.getUnderlyingObject(this.id).icon;
  }

  /**
   * Banner
   */
  get banner(): File | undefined {
    return this.#collection.getUnderlyingObject(this.id).banner;
  }

  /**
   * Channel IDs
   */
  get channelIds(): ReactiveSet<string> {
    return this.#collection.getUnderlyingObject(this.id).channelIds;
  }

  /**
   * Channels
   */
  get channels(): Channel[] {
    const channelIds = this.#collection.getUnderlyingObject(this.id).channelIds;
    if (!channelIds) return [];

    return [...channelIds.values()]
      .map((id) => this.#collection.client.channels.get(id)!)
      .filter((x) => x);
  }

  /**
   * Categories
   */
  get categories(): Category[] | undefined {
    return this.#collection.getUnderlyingObject(this.id).categories;
  }

  /**
   * System message channels
   */
  get systemMessages(): APIServer["system_messages"] {
    return this.#collection.getUnderlyingObject(this.id).systemMessages;
  }

  /**
   * Roles
   */
  get roles(): ReactiveMap<string, ServerRole> {
    return this.#collection.getUnderlyingObject(this.id).roles;
  }

  /**
   * Default permissions
   */
  get defaultPermissions(): bigint {
    return this.#collection.getUnderlyingObject(this.id).defaultPermissions;
  }

  /**
   * Server flags
   */
  get flags(): ServerFlags {
    return this.#collection.getUnderlyingObject(this.id).flags;
  }

  /**
   * Whether analytics are enabled for this server
   */
  get analytics(): boolean {
    return this.#collection.getUnderlyingObject(this.id).analytics;
  }

  /**
   * Whether this server is publicly discoverable
   */
  get discoverable(): boolean {
    return this.#collection.getUnderlyingObject(this.id).discoverable;
  }

  /**
   * Approximate amount of members in this server
   */
  get approximateMemberCount(): number {
    return this.#collection.getUnderlyingObject(this.id).approximateMemberCount;
  }

  /**
   * Whether this server is marked as mature
   */
  get mature(): boolean {
    return this.#collection.getUnderlyingObject(this.id).nsfw;
  }

  /**
   * Get an array of ordered categories with their respective channels.
   * Uncategorised channels are returned in `id="default"` category.
   */
  get orderedChannels(): (Omit<Category, "channels"> & {
    channels: Channel[];
  })[] {
    const uncategorised = new Set(this.channels.map((channel) => channel.id));

    const elements = [];
    let defaultCategory;

    const categories = this.categories;
    if (categories) {
      for (const category of categories) {
        const channels = [];
        for (const key of category.channels) {
          if (uncategorised.delete(key)) {
            channels.push(this.#collection.client.channels.get(key)!);
          }
        }

        const cat = {
          ...category,
          channels,
        };

        if (cat.id === "default") {
          if (channels.length === 0) continue;

          defaultCategory = cat;
        }

        elements.push(cat);
      }
    }

    // force Default category for client logic
    // if (uncategorised.size > 0) {
    const channels = [...uncategorised].map(
      (key) => this.#collection.client.channels.get(key)!,
    );

    if (defaultCategory) {
      defaultCategory.channels = [...defaultCategory.channels, ...channels];
    } else {
      elements.unshift({
        id: "default",
        title: "Default",
        channels,
      });
    }
    // }

    return elements;
  }

  /**
   * Default channel for this server
   */
  get defaultChannel(): Channel | undefined {
    return this.orderedChannels
      .flatMap((cat) => cat.channels)
      .find((channel) => this.#previewCanView(channel));
  }

  /**
   * Get an ordered array of roles with their IDs attached.
   * The highest ranking roles will be first followed by lower
   * ranking roles. This is dictated by the "rank" property
   * which is smaller for higher priority roles.
   */
  get orderedRoles(): ServerRole[] {
    const roles = this.roles;
    return roles
      ? [...roles.values()].sort((a, b) => (a.rank || 0) - (b.rank || 0))
      : [];
  }

  /**
   * Check whether the server is currently unread
   * @returns Whether the server is unread
   */
  get unread(): boolean {
    return !!this.channels.find(
      (channel) => channel.unread && this.#previewCanView(channel),
    );
  }

  /**
   * Find all message IDs of unread messages
   * @returns Array of message IDs which are unread
   */
  get mentions(): string[] {
    const arr = this.channels
      .filter((channel) => this.#previewCanView(channel))
      .map((channel) => Array.from(channel.mentions?.values() ?? []));

    return ([] as string[]).concat(...arr);
  }

  /**
   * URL to the server's icon
   */
  get iconURL(): string | undefined {
    return this.icon?.createFileURL();
  }

  /**
   * URL to the server's animated icon
   */
  get animatedIconURL(): string | undefined {
    return this.icon?.createFileURL(true);
  }

  /**
   * URL to the server's banner
   */
  get bannerURL(): string | undefined {
    return this.banner?.createFileURL();
  }

  /**
   * Own member object for this server
   */
  get member(): ServerMember | undefined {
    if (!this.#collection.client.user) return undefined;
    return this.#collection.client.serverMembers.getByKey({
      server: this.id,
      user: this.#collection.client.user.id,
    });
  }

  /**
   * Whether a channel is visible to the roles we are previewing, if any
   */
  #previewCanView(channel: Channel): boolean {
    return !this.previewRoles || channel.havePermission("ViewChannel");
  }

  /**
   * Roles we are previewing in this server, from lowest to highest priority
   */
  get previewRoles(): ServerRole[] | undefined {
    const viewAs = this.#collection.client.viewAs();
    if (viewAs?.server !== this.id) return;

    return viewAs.roles
      .map((id) => this.roles.get(id)!)
      .filter((role) => role)
      .sort((a, b) => b.rank! - a.rank!);
  }

  /**
   * Permission the currently authenticated user has against this server
   */
  get permission(): bigint {
    if (!this.$exists) return 0n;
    return calculatePermission(this.#collection.client, this);
  }

  /**
   * Check whether we have a given permission in a server
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
   * Check whether we have at least one of the given permissions in a server
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
   * Helper function to retrieve cached server member by their ID in this server
   * @param userId User's ID
   * @returns Server Member (if cached)
   */
  getMember(userId: string): ServerMember | undefined {
    return this.#collection.client.serverMembers.getByKey({
      server: this.id,
      user: userId,
    });
  }
  /**
   * @param params
   * @returns This server's tracked actions, members and users
   */
  async getAuditLogs(
    params?: (APIRoutes & {
      method: "get";
      path: "/servers/{target}/audit_logs";
      parts: 3;
    })["params"],
  ): Promise<{
    audit_logs: AuditLogEntry[];
    users: User[];
    members: ServerMember[];
  }> {
    const logs = await this.#collection.client.api.get(
      `/servers/${this.id as ""}/audit_logs`,
      { ...params },
    );

    return batch(() => ({
      audit_logs: logs.audit_logs,
      users: logs.users.map((user) =>
        this.#collection.client.users.getOrCreate(user._id, user),
      ),
      members: logs.members.map((member) =>
        this.#collection.client.serverMembers.getOrCreate(member._id, member),
      ),
    }));
  }

  /**
   * Create a channel
   * @param data Channel create route data
   * @returns The newly-created channel
   */
  async createChannel(data: DataCreateServerChannel): Promise<Channel> {
    const channel = await this.#collection.client.api.post(
      `/servers/${this.id as ""}/channels`,
      data,
    );

    return this.#collection.client.channels.getOrCreate(channel._id, channel);
  }

  /**
   * Edit a server
   * @param data Changes
   */
  async edit(data: DataEditServer): Promise<void> {
    this.#collection.updateUnderlyingObject(
      this.id,
      hydrate(
        "server",
        await this.#collection.client.api.patch(
          `/servers/${this.id as ""}`,
          data,
        ),
        this.#collection.client,
        false,
      ),
    );
  }

  /**
   * Set ordering of roles
   * @param roleIds Role IDs
   */
  async setRoleOrdering(roleIds: string[]): Promise<void> {
    this.#collection.updateUnderlyingObject(
      this.id,
      hydrate(
        "server",
        // Cast as APIServer because TypeScript matches both /roles/ranks and /roles/${role_id} in stoat-api routes
        (await this.#collection.client.api.patch(
          `/servers/${this.id as ""}/roles/ranks`,
          {
            ranks: roleIds,
          },
        )) as APIServer,
        this.#collection.client,
        false,
      ),
    );
  }

  /**
   * Delete the underlying server
   * @param leaveEvent Whether we are leaving
   */
  $delete(leaveEvent?: boolean): void {
    batch(() => {
      const server = this.#collection.client.servers.getUnderlyingObject(
        this.id,
      );

      // Avoid race conditions
      if (server.id) {
        this.#collection.client.emit(
          leaveEvent ? "serverLeave" : "serverDelete",
          server,
        );

        for (const channel of this.channelIds) {
          this.#collection.client.channels.delete(channel);
        }

        this.#collection.delete(this.id);

        if (this.#collection.client.viewAs()?.server === this.id) {
          this.#collection.client.setViewAs();
        }
      }
      // TODO: delete members, emoji, etc
    });
  }

  /**
   * Delete or leave a server
   * @param leaveSilently Whether to not send a message on leave
   */
  async delete(leaveSilently?: boolean): Promise<void> {
    await this.#collection.client.api.delete(`/servers/${this.id as ""}`, {
      leave_silently: leaveSilently,
    });

    this.$delete();
  }

  /**
   * Mark a server as read
   */
  async ack(): Promise<void> {
    batch(() => {
      for (const channel of this.channels) {
        channel.ack(undefined, false, true);
      }
    });

    await this.#collection.client.api.put(`/servers/${this.id}/ack`);
  }

  /**
   * Ban user from this server
   * @param user User
   * @param options Ban options
   */
  async banUser(
    user: string | User | ServerMember,
    options: DataBanCreate = {},
  ): Promise<ServerBan> {
    const userId =
      user instanceof User
        ? user.id
        : user instanceof ServerMember
          ? user.id.user
          : user;

    const ban = await this.#collection.client.api.put(
      `/servers/${this.id as ""}/bans/${userId as ""}`,
      options,
    );

    return new ServerBan(this.#collection.client, ban);
  }

  /**
   * Kick user from this server
   * @param user User
   */
  async kickUser(user: string | User | ServerMember): Promise<void> {
    return await this.#collection.client.api.delete(
      `/servers/${this.id as ""}/members/${
        typeof user === "string"
          ? user
          : user instanceof User
            ? user.id
            : user.id.user
      }`,
    );
  }

  /**
   * Pardon user's ban
   * @param user User
   */
  async unbanUser(user: string | User): Promise<void> {
    const userId = user instanceof User ? user.id : user;
    return await this.#collection.client.api.delete(
      `/servers/${this.id as ""}/bans/${userId}`,
    );
  }

  /**
   * Fetch a server's invites
   * @returns An array of the server's invites
   */
  async fetchInvites(): Promise<ChannelInvite[]> {
    const invites = await this.#collection.client.api.get(
      `/servers/${this.id as ""}/invites`,
    );

    return invites.map((invite) =>
      ChannelInvite.from(this.#collection.client, invite),
    );
  }

  /**
   * Fetch a server's bans
   * @returns An array of the server's bans.
   */
  async fetchBans(): Promise<ServerBan[]> {
    const { users, bans } = await this.#collection.client.api.get(
      `/servers/${this.id as ""}/bans`,
    );

    const userDict = users.reduce(
      (d, c) => ({ ...d, [c._id]: c }),
      {} as Record<string, BannedUser>,
    );

    return bans.map(
      (ban) =>
        new ServerBan(this.#collection.client, ban, userDict[ban._id.user]),
    );
  }

  /**
   * Set role permissions
   * @param roleId Role Id, set to 'default' to affect all users
   * @param permissions Permission value
   */
  async setPermissions(
    roleId = "default",
    permissions: Override | number,
  ): Promise<APIServer> {
    return await this.#collection.client.api.put(
      `/servers/${this.id as ""}/permissions/${roleId as ""}`,
      { permissions: permissions as Override },
    );
  }

  /**
   * Create role
   * @param name Role name
   */
  async createRole(name: string): Promise<{ id: string; role: Role }> {
    return await this.#collection.client.api.post(
      `/servers/${this.id as ""}/roles`,
      {
        name,
      },
    );
  }

  /**
   * Edit a role
   * @param roleId Role ID
   * @param data Role editing route data
   */
  async editRole(roleId: string, data: DataEditRole): Promise<ServerRole> {
    const updated = await this.#collection.client.api.patch(
      `/servers/${this.id as ""}/roles/${roleId as ""}`,
      data,
    );

    const role = new ServerRole(
      this.#collection.client,
      this.id,
      roleId,
      updated,
    );

    this.roles.set(roleId, role);

    return role;
  }

  /**
   * Delete role
   * @param roleId Role ID
   */
  async deleteRole(roleId: string): Promise<void> {
    return await this.#collection.client.api.delete(
      `/servers/${this.id as ""}/roles/${roleId as ""}`,
    );
  }

  /**
   * Fetch a server member
   * @param user User
   * @returns Server member object
   */
  async fetchMember(user: User | string): Promise<ServerMember> {
    const userId = typeof user === "string" ? user : user.id;
    const existing = this.#collection.client.serverMembers.getByKey({
      server: this.id,
      user: userId,
    });

    if (existing) return existing;
    return this.#collection.client.serverMembers.fetch(this.id, userId);
  }

  #synced: undefined | "partial" | "full";

  async syncMembers(excludeOffline?: boolean): Promise<void> {
    if (this.#synced && (this.#synced === "full" || excludeOffline)) return;

    const data = await this.#collection.client.api.get(
      `/servers/${this.id as ""}/members`,
      { exclude_offline: excludeOffline },
    );

    const newUsers: HydratedUser[] = [];
    const newServerMembers: HydratedServerMember[] = [];

    for (let i = 0; i < data.users.length; i++) {
      const user = data.users[i];
      if (!excludeOffline || user.online) {
        const newUser = this.#collection.client.users.hydrateIfNotHas(
          user._id,
          user,
        );
        if (newUser) {
          newUsers.push(newUser);
        }
        const newMember = this.#collection.client.serverMembers.hydrateIfNotHas(
          data.members[i]._id,
          data.members[i],
        );
        if (newMember) {
          newServerMembers.push(newMember);
        }
      }
    }

    batch(() => {
      for (const newUser of newUsers) {
        this.#collection.client.users.addHydratedUser(newUser);
      }
      for (const newServerMember of newServerMembers) {
        this.#collection.client.serverMembers.addHydratedServerMember(
          newServerMember,
        );
      }
    });
  }

  /**
   * Reset member sync status
   */
  resetSyncStatus(): void {
    this.#synced = undefined;
  }

  /**
   * Fetch a server's members
   * @returns List of the server's members and their user objects
   */
  async fetchMembers(): Promise<{ members: ServerMember[]; users: User[] }> {
    const data = (await this.#collection.client.api.get(
      // @ts-expect-error TODO weird typing issue
      `/servers/${this.id as ""}/members`,
    )) as AllMemberResponse;

    return batch(() => ({
      members: data.members.map((member) =>
        this.#collection.client.serverMembers.getOrCreate(member._id, member),
      ),
      users: data.users.map((user) =>
        this.#collection.client.users.getOrCreate(user._id, user),
      ),
    }));
  }

  /**
   * Query members from a server by name
   * @param query Name
   * @returns List of the server's members and their user objects
   */
  async queryMembersExperimental(
    query: string,
  ): Promise<{ members: ServerMember[]; users: User[] }> {
    const data = (await this.#collection.client.api.get(
      `/servers/${
        this.id as ""
      }/members_experimental_query?experimental_api=true&query=${encodeURIComponent(
        query,
      )}` as never,
    )) as AllMemberResponse;

    return batch(() => ({
      members: data.members.map((member) =>
        this.#collection.client.serverMembers.getOrCreate(member._id, member),
      ),
      users: data.users.map((user) =>
        this.#collection.client.users.getOrCreate(user._id, user),
      ),
    }));
  }

  /**
   * Create an emoji on the server
   * @param autumnId Autumn Id
   * @param options Options
   */
  async createEmoji(
    autumnId: string,
    options: Omit<DataCreateEmoji, "parent">,
  ): Promise<Emoji> {
    const emoji = await this.#collection.client.api.put(
      `/custom/emoji/${autumnId as ""}`,
      {
        parent: {
          type: "Server",
          id: this.id,
        },
        ...options,
      },
    );

    return this.#collection.client.emojis.getOrCreate(emoji._id, emoji, true);
  }

  /**
   * Fetch a server's emoji
   * @returns List of server emoji
   */
  async fetchEmojis(): Promise<Emoji[]> {
    const emojis = await this.#collection.client.api.get(
      `/servers/${this.id as ""}/emojis`,
    );

    return batch(() =>
      emojis.map((emoji) =>
        this.#collection.client.emojis.getOrCreate(emoji._id, emoji),
      ),
    );
  }

  /**
   * All emojis tied to this server
   */
  get emojis(): Emoji[] {
    return this.#collection.client.emojis.filter(
      (emoji) => emoji.parent.type === "Server" && emoji.parent.id === this.id,
    );
  }

  /**
   * Delete emoji
   * @param emojiId Emoji ID
   */
  async deleteEmoji(emojiId: string): Promise<void> {
    await this.#collection.client.api.delete(`/custom/emoji/${emojiId}`);
  }

  /**
   * The voice status of a server. Screenshare supersedes video, video
   * supersedes voice, and voice supersedes none. This getter takes the highest
   * priority status from all channels in the server.
   */
  get voiceStatus(): VoiceStatus {
    let highest: VoiceStatus = "none";

    for (const chan of this.channels) {
      const status = chan.voiceStatus;
      if (status === "screenshare") {
        return "screenshare";
      }
      if (status === "video") {
        highest = "video";
      }
      if (status === "voice" && highest === "none") {
        highest = "voice";
      }
    }

    return highest;
  }

  /**
   * Add server to the discover request queue
   */
  async requestDiscover(): Promise<void> {
    await this.#collection.client.api.put(`/servers/${this.id as ""}/discover`);
  }

  /**
   * Get the status of the discover request for this server
   * @returns The discovery request for this server if one exists
   */
  async discoverRequestStatus(): Promise<DiscoverRequest> {
    return await this.#collection.client.api.get(
      `/servers/${this.id as ""}/discover`,
    );
  }

  /**
   * Cancel the discover request for this server
   *
   * This cannot be used to remove servers from discover that have already been accepted
   * and should only be called on servers that have an outstanding discover request.
   */
  async cancelDiscoverRequest() {
    await this.#collection.client.api.delete(
      `/servers/${this.id as ""}/discover`,
    );
  }
}
