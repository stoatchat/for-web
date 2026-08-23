import {
  type Accessor,
  type InitializedResource,
  createResource,
} from "solid-js";

import { ServerMember, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useSmartParams } from "@revolt/routing";

// TODO: move to @revolt/common?

/**
 * Resolved user information
 */
interface UserInformation {
  /**
   * Username or nickname
   */
  username: string;

  /**
   * Avatar or server profile avatar
   */
  avatar?: string;

  /**
   * Role colour
   */
  colour?: string | null;

  /**
   * Underlying user
   */
  user?: User;

  /**
   * Underlying member
   */
  member?: ServerMember;
}

/**
 * Create user information from given objects
 * @param user User
 * @param member Member
 * @returns Information
 */
export function userInformation(user?: User, member?: ServerMember) {
  return {
    username: member?.nickname ?? user?.displayName ?? "Unknown User",
    avatar: member?.animatedAvatarURL ?? user?.animatedAvatarURL,
    colour: member?.roleColour,
    user,
    member,
  };
}

async function getOrFetchUsers(options: {
  ids: string[];
  params: Accessor<{ serverId?: string }>;
  filterNull?: boolean;
}) {
  const client = useClient();
  const serverId = options.params().serverId;
  return Promise.all(
    options.ids.map(async (id) => {
      const user =
        client().users.get(id) ??
        (await client()
          .users.fetch(id)
          .catch(() => null));

      // Edge case: what if user fails to fetch on a spotty/intermittent conenction?
      // Promise.all fails as soon as possible, so if one fetch fails, everything else
      // does too and we don't get any data at all
      if (!user) return undefined;

      return userInformation(
        user,
        serverId
          ? client().serverMembers.getByKey({
              server: serverId,
              user: user.id,
            })
          : undefined,
      );
    }),
  ).then((arr) => (options.filterNull ? arr.filter((x) => x) : arr));
}

/**
 * Resolve multiple users by their ID within the current context
 * @param ids User IDs
 * @param filterNull Filter out null values
 * @returns User information
 */
export function useUsers(
  ids: string[] | Accessor<string[]>,
  filterNull?: boolean,
): InitializedResource<(UserInformation | undefined)[]> {
  // TODO: use a context here for when we do multi view :)
  const params = useSmartParams();
  const [users] = createResource(
    {
      ids: typeof ids === "function" ? ids() : ids,
      params,
      filterNull,
    },
    getOrFetchUsers,
    { initialValue: [] as (UserInformation | undefined)[] },
  );

  return users;
}

/**
 * Use a specific user by their ID
 * @param id ID
 * @returns User information
 */
export function useUser(
  id: string | Accessor<string>,
): Accessor<UserInformation> {
  const users = useUsers(typeof id === "function" ? () => [id()] : [id]);
  return () => users()[0] ?? { username: "Unknown User" };
}
