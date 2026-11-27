import type { Member, MemberCompositeKey } from "stoat-api";

import { ServerMember } from "../classes/ServerMember.js";
import type { HydratedServerMember } from "../hydration/serverMember.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Server Members
 */
export class ServerMemberCollection extends ClassCollection<
  ServerMember,
  HydratedServerMember
> {
  /**
   * Check if member exists by composite key
   * @param id Id
   * @returns Whether it exists
   */
  hasByKey(id: MemberCompositeKey): boolean {
    return super.has(id.server + id.user);
  }

  /**
   * Get member by composite key
   * @param id Id
   * @returns Member
   */
  getByKey(id: MemberCompositeKey): ServerMember | undefined {
    return super.get(id.server + id.user);
  }

  /**
   * check partial status by composite key
   * @param id Id
   * @returns Member
   */
  isPartialByKey(id: MemberCompositeKey): boolean {
    return super.isPartial(id.server + id.user);
  }

  /**
   * Fetch server member by Id
   * @param serverId Server Id
   * @param userId User Id
   * @returns Message
   */
  async fetch(serverId: string, userId: string): Promise<ServerMember> {
    const member = this.get(serverId + userId);
    if (member && !this.isPartial(serverId + userId)) return member;

    const data = (await this.client.api.get(
      `/servers/${serverId as ""}/members/${userId as ""}`,
      {
        roles: false,
      },
      // TODO: fix typings in revolt-api
    )) as Member;

    return this.getOrCreate(data._id, data);
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   */
  getOrCreate(id: MemberCompositeKey, data: Member): ServerMember {
    if (this.hasByKey(id) && !this.isPartialByKey(id)) {
      return this.getByKey(id)!;
    } else {
      const instance = new ServerMember(this, id);
      this.create(
        id.server + id.user,
        "serverMember",
        instance,
        this.client,
        data,
      );
      return instance;
    }
  }

  /**
   * Get or return partial
   * @param id Id
   */
  getOrPartial(id: MemberCompositeKey): ServerMember | undefined {
    if (this.hasByKey(id)) {
      return this.getByKey(id)!;
    } else if (this.client.options.partials) {
      const instance = new ServerMember(this, id);
      this.create(id.server + id.user, "serverMember", instance, this.client, {
        id,
        partial: true,
      });
      return instance;
    }
  }

  /**
   * Hydrate a new server member if it is not in the collection yet. This
   * function does not add the server member to the store, make sure you call
   * {@link addHydratedServerMember} afterwards. This function is particularly
   * useful when adding many server members asynchronously. See
   * Server.syncMembers for an example of this in use.
   * @param id The ID of the server member
   * @param data The API object for a server member
   * @returns The HydratedServerMember, or undefined if the user is in the collection
   */
  hydrateIfNotHas(
    id: MemberCompositeKey,
    data: Member,
  ): HydratedServerMember | undefined {
    if (this.hasByKey(id) && !this.isPartialByKey(id)) {
      return;
    } else {
      return this.hydrate("serverMember", this.client, data);
    }
  }

  /**
   * Add a pre-hydrated server member to this collection.
   * @param user A hydrated server member
   * @returns The server member instance
   */
  addHydratedServerMember(member: HydratedServerMember): ServerMember {
    const instance = new ServerMember(this, member.id);
    this.add(member.id.server + member.id.user, instance, member);
    return instance;
  }
}
