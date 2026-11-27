import type { Webhook } from "stoat-api";

import type { Client } from "../Client.js";
import { File } from "../classes/File.js";
import type { Merge } from "../lib/merge.js";

import type { Hydrate } from "./index.js";

export type HydratedChannelWebhook = {
  id: string;
  name: string;
  avatar?: File;
  channelId: string;
  token: string;
};

export const channelWebhookHydration: Hydrate<
  Merge<Webhook>,
  HydratedChannelWebhook
> = {
  keyMapping: {
    id: "id",
    name: "name",
    avatar: "avatar",
    channel_id: "channelId",
    token: "token",
  },
  functions: {
    id: (webhook) => webhook.id,
    name: (webhook) => webhook.name,
    avatar: (webhook, ctx) =>
      webhook.avatar ? new File(ctx as Client, webhook.avatar) : undefined,
    channelId: (webhook) => webhook.channel_id,
    token: (webhook) => webhook.token!,
  },
  initialHydration: () => ({}),
};
