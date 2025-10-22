import { Accessor, createMemo } from "solid-js";

import { ServerMember, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { useParams, useSmartParams } from "@revolt/routing";

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

/**
 * Resolve multiple users by their ID within the current context
 * @param ids User IDs
 * @param filterNull Filter out null values
 * @returns User information
 */
export function useUsers(
  ids: string[] | Accessor<string[]>,
  filterNull?: boolean,
): Accessor<(UserInformation | undefined)[]> {
  const clientAccessor = useClient();

  // TODO: use a context here for when we do multi view :)
  const params = useSmartParams();

  // eslint-disable-next-line solid/reactivity
  return createMemo(() => {
    const client = clientAccessor()!;
    const list = (typeof ids === "function" ? ids() : ids).map((id) => {
      const user = client.users.get(id)!;

      if (user) {
        return userInformation(
          user,
          params().serverId
            ? client.serverMembers.getByKey({
                server: params().serverId!,
                user: user.id,
              })
            : undefined,
        );
      }
    });

    return filterNull ? list.filter((x) => x) : list;
  });
}

/**
 * Use a specific user by their ID
 * @param id ID
 * @returns User information
 */
export function useUser(id: string): Accessor<UserInformation> {
  const users = useUsers([id]);
  return () => users()[0] ?? { username: "Unknown User" };
}
