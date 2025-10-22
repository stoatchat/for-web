import {
  BiRegularListUl,
  BiSolidCloud,
  BiSolidInfoCircle,
  BiSolidTrash,
} from "solid-icons/bi";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";

import { useClient } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { ColouredText } from "@revolt/ui";

import { SettingsConfiguration } from ".";
import ChannelOverview from "./channel/Overview";
import { ChannelPermissionsEditor } from "./channel/permissions/ChannelPermissionsEditor";
import { ChannelPermissionsOverview } from "./channel/permissions/ChannelPermissionsOverview";
import { ViewWebhook } from "./channel/webhooks/ViewWebhook";
import { WebhooksList } from "./channel/webhooks/WebhooksList";

const Config: SettingsConfiguration<Channel> = {
  /**
   * Page titles
   */
  title(ctx, key) {
    const client = useClient();
    const { t } = useLingui();

    if (key.startsWith("webhooks/")) {
      const webhook = client().channelWebhooks.get(key.substring(9));
      if (webhook) return webhook.name;
    }

    if (key.startsWith("permissions/")) {
      if (key === "permissions/default") return t`Default Permissions`;

      return ctx.context.server?.roles.get(key.substring(12))?.name ?? "";
    }

    return ctx.entries
      .flatMap((category) => category.entries)
      .find((entry) => entry.id === key)?.title as string;
  },

  /**
   * Render the current channel settings page
   */
  // we take care of the reactivity ourselves
  /* eslint-disable solid/components-return-once */
  render(props, channel) {
    const id = props.page();
    const client = useClient();

    if (id?.startsWith("webhooks/")) {
      const webhook = client().channelWebhooks.get(id.substring(9));
      return <ViewWebhook webhook={webhook!} />;
    }

    if (id?.startsWith("permissions/")) {
      if (id === "permissions/default") {
        return (
          <ChannelPermissionsEditor type="channel_default" context={channel} />
        );
      }

      return (
        <ChannelPermissionsEditor
          type="channel_role"
          context={channel}
          roleId={id.substring(12)}
        />
      );
    }

    switch (id) {
      case "overview":
        return <ChannelOverview channel={channel} />;
      case "permissions":
        switch (channel.type) {
          case "Group":
            return <ChannelPermissionsEditor type="group" context={channel} />;
          case "TextChannel":
            return <ChannelPermissionsOverview context={channel} />;
          default:
            return null;
        }
      case "webhooks":
        return <WebhooksList channel={channel} />;
      default:
        return null;
    }
  },
  /* eslint-enable solid/components-return-once */

  /**
   * Generate list of categories / entries for channel settings
   * @returns List
   */
  list(channel) {
    const { openModal } = useModals();

    return {
      context: channel,
      entries: [
        {
          title: <TextWithEmoji content={channel.name} />,
          entries: [
            {
              id: "overview",
              icon: <BiSolidInfoCircle size={20} />,
              title: <Trans>Overview</Trans>,
            },
            {
              hidden:
                channel.type === "SavedMessages" ||
                !channel.havePermission("ManagePermissions"),
              id: "permissions",
              icon: <BiRegularListUl size={20} />,
              title: <Trans>Permissions</Trans>,
            },
            {
              hidden:
                !channel.havePermission("ManageWebhooks") &&
                import.meta.env.DEV,
              id: "webhooks",
              icon: <BiSolidCloud size={20} />,
              title: <Trans>Webhooks</Trans>,
            },
          ],
        },
        {
          hidden: !(
            channel.type !== "Group" && channel.havePermission("ManageChannel")
          ),
          entries: [
            {
              icon: (
                <BiSolidTrash size={20} color="var(--md-sys-color-error)" />
              ),
              title: (
                <ColouredText colour="var(--md-sys-color-error)">
                  <Trans>Delete Channel</Trans>
                </ColouredText>
              ),
              onClick() {
                openModal({
                  type: "delete_channel",
                  channel,
                });
              },
            },
          ],
        },
      ],
    };
  },
};

export default Config;

export type ChannelSettingsProps = {
  /**
   * Channel
   */
  channel: Channel;
};
