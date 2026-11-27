import type {
  User as APIUser,
  BotInformation,
  RelationshipStatus,
  UserStatus,
} from "stoat-api";

import type { Client } from "../Client.js";
import { File } from "../classes/File.js";

import type { Hydrate } from "./index.js";

export type HydratedUser = {
  id: string;
  username: string;
  discriminator: string;
  displayName?: string;
  relationship: RelationshipStatus;
  relations: null;

  online: boolean;
  privileged: boolean;

  badges: UserBadges;
  flags: UserFlags;

  avatar?: File;
  pronouns?: string;
  status?: UserStatus;
  bot?: BotInformation;
};

export const userHydration: Hydrate<APIUser, HydratedUser> = {
  keyMapping: {
    _id: "id",
    display_name: "displayName",
  },
  functions: {
    id: (user) => user._id,
    username: (user) => user.username,
    discriminator: (user) => user.discriminator,
    displayName: (user) => user.display_name!,
    relationship: (user) => user.relationship!,
    relations: () => null,

    online: (user) => user.online!,
    privileged: (user) => user.privileged,

    badges: (user) => user.badges!,
    flags: (user) => user.flags!,

    avatar: (user, ctx) => new File(ctx as Client, user.avatar!),
    pronouns: (user) => user.pronouns,
    status: (user) => user.status!,
    bot: (user) => user.bot!,
  },
  initialHydration: () => ({
    relationship: "None",
  }),
};

/**
 * Badges available to users
 */
export enum UserBadges {
  Developer = 1,
  Translator = 2,
  Supporter = 4,
  ResponsibleDisclosure = 8,
  Founder = 16,
  PlatformModeration = 32,
  ActiveSupporter = 64,
  Paw = 128,
  EarlyAdopter = 256,
  ReservedRelevantJokeBadge1 = 512,
  ReservedRelevantJokeBadge2 = 1024,
}

/**
 * Flags attributed to users
 */
export enum UserFlags {
  Suspended = 1,
  Deleted = 2,
  Banned = 4,
}
