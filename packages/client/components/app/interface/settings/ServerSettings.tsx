import {
  BiSolidEnvelope,
  BiSolidFlagAlt,
  BiSolidGroup,
  BiSolidHappyBeaming,
  BiSolidInfoCircle,
  BiSolidTrash,
  BiSolidUserX,
} from "solid-icons/bi";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Server } from "stoat.js";

import { useUser } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { ColouredText } from "@revolt/ui";

import { SettingsConfiguration } from ".";
import { ChannelPermissionsEditor } from "./channel/permissions/ChannelPermissionsEditor";
import Overview from "./server/Overview";
import { ListServerBans } from "./server/bans/ListBans";
import { EmojiList } from "./server/emojis/EmojiList";
import { ListServerInvites } from "./server/invites/ListServerInvites";
import { ServerRoleEditor } from "./server/roles/ServerRoleEditor";
import { ServerRoleOverview } from "./server/roles/ServerRoleOverview";

const Config: SettingsConfiguration<Server> = {
  /**
   * Page titles
   * @param key
   */
  title(ctx, key) {
    const { t } = useLingui();

    if (key.startsWith("roles/")) {
      if (key === "roles/default") return t`Default Permissions`;

      return ctx.context.roles.get(key.substring(6))?.name ?? "";
    }

    return ctx.entries
      .flatMap((category) => category.entries)
      .find((entry) => entry.id === key)?.title as string;
  },

  /**
   * Render the current server settings page
   */
  // we take care of the reactivity ourselves
  /* eslint-disable solid/components-return-once */
  render(props, server) {
    const id = props.page();

    if (!server.$exists) {
      useModals().pop();
      return null;
    }

    if (id?.startsWith("roles/")) {
      if (id === "roles/default") {
        return (
          <ChannelPermissionsEditor type="server_default" context={server} />
        );
      }

      return <ServerRoleEditor context={server} roleId={id.substring(6)} />;
    }

    switch (id) {
      case "overview":
        return <Overview server={server} />;
      case "emojis":
        return <EmojiList server={server} />;
      case "roles":
        return <ServerRoleOverview context={server} />;
      case "invites":
        return <ListServerInvites server={server} />;
      case "bans":
        return <ListServerBans server={server} />;

      default:
        return null;
    }
  },
  /* eslint-enable solid/components-return-once */

  /**
   * Generate list of categories / entries for server settings
   * @returns List
   */
  list(server) {
    const user = useUser();
    const { openModal } = useModals();

    return {
      context: server,
      entries: [
        {
          title: <TextWithEmoji content={server.name} />,
          entries: [
            {
              id: "overview",
              icon: <BiSolidInfoCircle size={20} />,
              title: <Trans>Overview</Trans>,
            },
          ],
        },
        {
          hidden: !server.havePermission("ManageCustomisation"),
          title: <Trans>Customisation</Trans>,
          entries: [
            {
              id: "emojis",
              icon: <BiSolidHappyBeaming size={20} />,
              title: <Trans>Emojis</Trans>,
            },
          ],
        },
        {
          hidden:
            !server.havePermission("ManageServer") &&
            !server.havePermission("BanMembers"),
          title: <Trans>User Management</Trans>,
          entries: [
            {
              hidden: true,
              id: "members",
              icon: <BiSolidGroup size={20} />,
              title: <Trans>Members</Trans>,
            },
            {
              hidden: !(
                server.havePermission("ManageRole") ||
                server.havePermission("ManagePermissions")
              ),
              id: "roles",
              icon: <BiSolidFlagAlt size={20} />,
              title: <Trans>Roles</Trans>,
            },
            {
              hidden: !server.havePermission("ManageServer"),
              id: "invites",
              icon: <BiSolidEnvelope size={20} />,
              title: <Trans>Invites</Trans>,
            },
            {
              hidden: !server.havePermission("BanMembers"),
              id: "bans",
              icon: <BiSolidUserX size={20} />,
              title: <Trans>Bans</Trans>,
            },
          ],
        },
        {
          hidden: !(server.ownerId === user()?.id),
          entries: [
            {
              icon: (
                <BiSolidTrash size={20} color="var(--md-sys-color-error)" />
              ),
              title: (
                <ColouredText colour="var(--md-sys-color-error)">
                  <Trans>Delete Server</Trans>
                </ColouredText>
              ),
              /**
               * Handle server deletion request
               */
              onClick() {
                openModal({
                  type: "delete_server",
                  server,
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

export type ServerSettingsProps = {
  /**
   * Server
   */
  server: Server;
};
