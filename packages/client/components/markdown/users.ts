import { type Accessor, createMemo } from "solid-js";

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
  // TODO: use a context here for when we do multi view :)
  const params = useSmartParams();
  const clientAccessor = useClient();

  const pending = new Map<string, Promise<unknown>>();
  function ensureUser(id: string) {
    if (clientAccessor().users.has(id) || pending.has(id)) return;
    const promise = clientAccessor()
      .users.fetch(id)
      .catch(() => undefined);

    pending.set(id, promise);

    promise.finally(() => {
      pending.delete(id);
    });
  }

  const users = createMemo(() => {
    const list = (typeof ids === "function" ? ids() : ids).map((id) => {
      const user = clientAccessor().users.get(id);
      if (!user) {
        // Fetch the user in the background and return an unknown user for now
        ensureUser(id);
        return userInformation();
      }

      return userInformation(
        user,
        params().serverId
          ? clientAccessor().serverMembers.getByKey({
              server: params().serverId!,
              user: user.id,
            })
          : undefined,
      );
    });

    return filterNull ? list.filter((x) => x) : list;
  });

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
