import { createQuery } from "@tanstack/solid-query";
import { User } from "stoat.js";

import { useClient } from ".";

/**
 * Create a new resource for current account's MFA configuration
 * @returns MFA configuration
 */
export function createMfaResource() {
  const client = useClient();

  return createQuery(() => ({
    queryKey: ["mfa", client().user!.id],
    queryFn: () => client().account.mfa(),
    throwOnError: true,
  }));
}

/**
 * Create a new resource for user profile
 * @param user User
 * @returns User profile resource
 */
export function createProfileResource(user: User) {
  return createQuery(() => ({
    queryKey: ["profile", user.id],
    queryFn: () => user!.fetchProfile(),
    throwOnError: true,
  }));
}

/**
 * Create a new resource for own user profile
 * @returns User profile resource
 */
export function createOwnProfileResource() {
  const client = useClient();
  return createProfileResource(client().user!);
}

/**
 * Create a new resource for own bots
 * @returns List of owned bots
 */
export function createOwnBotsResource() {
  const client = useClient();
  return createQuery(() => ({
    queryKey: ["bots", client().user!.id],
    queryFn: () => client().bots.fetchOwned(),
    throwOnError: true,
  }));
}
