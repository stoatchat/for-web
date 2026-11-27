import type { User as APIUser } from "stoat-api";

import type { Client } from "../Client.js";
import { User } from "../classes/User.js";
import type { HydratedUser } from "../hydration/user.js";

import { ClassCollection } from "./Collection.js";

/**
 * Collection of Users
 */
export class UserCollection extends ClassCollection<User, HydratedUser> {
  /**
   * Construct User collection
   */
  constructor(client: Client) {
    super(client);

    const SYSTEM_ID = "0".repeat(26);
    this.getOrCreate(SYSTEM_ID, {
      _id: SYSTEM_ID,
      username: "Revolt",
      discriminator: "0000",
      online: true,
      relationship: "None",
    });
  }

  /**
   * Fetch user by ID
   * @param id Id
   * @returns User
   */
  async fetch(id: string): Promise<User> {
    const user = this.get(id);
    if (user && !this.isPartial(id)) return user;
    const data = await this.client.api.get(`/users/${id as ""}`);
    return this.getOrCreate(data._id, data);
  }

  /**
   * Get or create
   * @param id Id
   * @param data Data
   */
  getOrCreate(id: string, data: APIUser): User {
    if (this.has(id) && !this.isPartial(id)) {
      return this.get(id)!;
    } else {
      const instance = new User(this, id);
      this.create(id, "user", instance, this.client, data);
      return instance;
    }
  }

  /**
   * Get or return partial
   * @param id Id
   */
  getOrPartial(id: string): User | undefined {
    if (this.has(id)) {
      return this.get(id)!;
    } else if (this.client.options.partials) {
      const instance = new User(this, id);
      this.create(id, "user", instance, this.client, {
        id,
        partial: true,
      });
      return instance;
    }
  }

  /**
   * Hydrate a new user if it is not in the collection yet. This function does
   * not add the user to the store, make sure you call {@link addHydratedUser}
   * afterwards. This function is particularly useful when adding many users
   * asynchronously. See Server.syncMembers for an example of this in use.
   * @param id The ID of the user
   * @param data The API object for a user
   * @returns The HydratedUser, or undefined if the user is in the collection
   */
  hydrateIfNotHas(id: string, data: APIUser): HydratedUser | undefined {
    if (this.has(id) && !this.isPartial(id)) {
      return;
    } else {
      return this.hydrate("user", this.client, data);
    }
  }

  /**
   * Add a pre-hydrated user to this collection.
   * @param user A hydrated user
   * @returns The user instance
   */
  addHydratedUser(user: HydratedUser): User {
    const instance = new User(this, user.id);
    this.add(user.id, instance, user);
    return instance;
  }
}
