import type { Member as APIMember, MemberCompositeKey } from "stoat-api";

import type { Client } from "../Client.js";
import { File } from "../classes/File.js";
import type { Merge } from "../lib/merge.js";

import type { Hydrate } from "./index.js";

export type HydratedServerMember = {
  id: MemberCompositeKey;
  joinedAt: Date;
  nickname?: string;
  avatar?: File;
  pronouns?: string;
  roles: string[];
  timeout?: Date;
};

export const serverMemberHydration: Hydrate<
  Merge<APIMember>,
  HydratedServerMember
> = {
  keyMapping: {
    _id: "id",
    joined_at: "joinedAt",
  },
  functions: {
    id: (member) => member._id,
    joinedAt: (member) => new Date(member.joined_at),
    nickname: (member) => member.nickname!,
    avatar: (member, ctx) => new File(ctx as Client, member.avatar!),
    pronouns: (member) => member.pronouns!,
    roles: (member) => member.roles,
    timeout: (member) => new Date(member.timeout!),
  },
  initialHydration: () => ({
    roles: [],
  }),
};
