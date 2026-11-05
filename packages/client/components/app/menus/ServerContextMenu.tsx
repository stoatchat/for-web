import MdFolder from "@material-design-icons/svg/outlined/folder.svg?component-solid";
import { For, Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import dayjs from "dayjs";
import { Server } from "stoat.js";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Column, Symbol, Text, Time } from "@revolt/ui";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
  ContextMenuSubMenu,
} from "./ContextMenu";

/**
 * Context menu for servers
 */
export function ServerContextMenu(props: { server: Server }) {
  const state = useState();
  const client = useClient();
  const device = useDevice();
  const { openModal } = useModals();

  /**
   * Mark server as read
   */
  function markAsRead() {
    props.server.ack();
  }

  /**
   * Create a new invite
   */
  function createInvite() {
    // Find the first channel we can invite people to
    const channel = props.server.orderedChannels
      .find((category) =>
        category.channels.find((channel) =>
          channel.havePermission("InviteOthers"),
        ),
      )!
      .channels.find((channel) => channel.havePermission("InviteOthers"))!;

    openModal({
      type: "create_invite",
      channel,
    });
  }

  /**
   * Open server settings
   */
  function editIdentity() {
    openModal({
      type: "server_identity",
      member: props.server.member!,
    });
  }

  /**
   * Open server settings
   */
  function openSettings() {
    openModal({
      type: "settings",
      config: "server",
      context: props.server,
    });
  }

  /**
   * Report the server
   */
  function report() {
    openModal({
      type: "report_content",
      target: props.server,
      client: client(),
    });
  }

  /**
   * Leave the server
   */
  function leave() {
    openModal({
      type: "leave_server",
      server: props.server,
    });
  }

  /**
   * Open server in Stoat Admin Panel
   */
  function openAdminPanel() {
    window.open(
      `https://admin.stoatinternal.com/panel/inspect/server/${props.server.id}`,
      "_blank",
    );
  }

  /**
   * Copy server id to clipboard
   */
  function copyId() {
    navigator.clipboard.writeText(props.server.id);
  }

  /**
   * Determine whether we can invite others to any channels
   */
  const permissionInviteOthers = () =>
    props.server.channels.find((channel) =>
      channel.havePermission("InviteOthers"),
    );

  /**
   * Determine whether we can edit our identity
   */
  const permissionEditIdentity = () =>
    props.server.havePermission("ChangeNickname") ||
    props.server.havePermission("ChangeAvatar");

  /**
   * Determine whether we can access settings
   */
  const permissionServerSettings = () =>
    props.server.owner?.self ||
    props.server.havePermission("AssignRoles") ||
    props.server.havePermission("BanMembers") ||
    props.server.havePermission("KickMembers") ||
    props.server.havePermission("ManageChannel") ||
    props.server.havePermission("ManageCustomisation") ||
    props.server.havePermission("ManageNicknames") ||
    props.server.havePermission("ManagePermissions") ||
    props.server.havePermission("ManageRole") ||
    props.server.havePermission("ManageServer") ||
    props.server.havePermission("ManageWebhooks");

  return (
    <ContextMenu>
      <Show when={props.server.unread}>
        <ContextMenuButton
          icon={<Symbol size={16}>mark_chat_read</Symbol>}
          onClick={markAsRead}
        >
          <Trans>Mark as read</Trans>
        </ContextMenuButton>
        <ContextMenuDivider />
      </Show>

      <Show
        when={!state.notifications.isMuted(props.server)}
        fallback={
          <ContextMenuButton
            onClick={() =>
              state.notifications.setServerMute(props.server, undefined)
            }
            icon={<Symbol size={16}>do_not_disturb_off</Symbol>}
            _titleCase={false}
          >
            <Column gap="none">
              <Trans>Unmute Server</Trans>
              <Show
                when={state.notifications.getServerMute(props.server)?.until}
              >
                <Text class="label" size="small">
                  <Trans>
                    Muted until{" "}
                    <Time
                      format="datetime"
                      value={
                        state.notifications.getServerMute(props.server)!.until
                      }
                    />
                  </Trans>
                </Text>
              </Show>
            </Column>
          </ContextMenuButton>
        }
      >
        <ContextMenuSubMenu
          onClick={() => state.notifications.setServerMute(props.server, {})}
          buttonContent={<Trans>Mute Server</Trans>}
          icon={<Symbol size={16}>do_not_disturb_on</Symbol>}
        >
          <For
            each={
              [
                [15, <Trans>For 15 minutes</Trans>],
                [60, <Trans>For 1 hour</Trans>],
                [180, <Trans>For 3 hours</Trans>],
                [480, <Trans>For 8 hours</Trans>],
                [1440, <Trans>For 24 hours</Trans>],
                [undefined, <Trans>Until I turn it back on</Trans>],
              ] as const
            }
          >
            {([timeMin, i18n]) => (
              <ContextMenuButton
                onClick={() =>
                  state.notifications.setServerMute(props.server, {
                    until: timeMin
                      ? +dayjs().add(timeMin, "minutes")
                      : undefined,
                  })
                }
                _titleCase={false}
              >
                {i18n}
              </ContextMenuButton>
            )}
          </For>
        </ContextMenuSubMenu>
      </Show>

      <ContextMenuSubMenu
        onClick={
          device.layout() === "desktop" && !device.isMobile && !device.hasTouch
            ? () => state.ordering.createFolder("New Folder", [props.server.id])
            : undefined
        }
        icon={MdFolder}
        buttonContent={<Trans>Add to folder</Trans>}
      >
        <For each={state.ordering.folders()}>
          {(folder) => (
            <ContextMenuButton
              onClick={() =>
                state.ordering.addToFolder(folder.id, props.server.id)
              }
            >
              <Show when={folder.name} fallback={<Trans>Unnamed folder</Trans>}>
                {folder.name}
              </Show>
            </ContextMenuButton>
          )}
        </For>
        <ContextMenuButton
          icon={<Symbol size={16}>create_new_folder</Symbol>}
          onClick={() =>
            state.ordering.createFolder("New Folder", [props.server.id])
          }
        >
          <Trans>New folder</Trans>
        </ContextMenuButton>
      </ContextMenuSubMenu>

      <Show when={state.ordering.folderOf(props.server.id)}>
        <ContextMenuButton
          icon={<Symbol size={16}>folder_off</Symbol>}
          onClick={() => state.ordering.removeFromFolder(props.server.id)}
        >
          <Trans>Remove from folder</Trans>
        </ContextMenuButton>
      </Show>

      <ContextMenuDivider />

      <ContextMenuSubMenu
        icon={<Symbol size={16}>notification_settings</Symbol>}
        buttonContent={<Trans>Notifications</Trans>}
      >
        <ContextMenuButton
          icon={<Symbol size={16}>notifications_active</Symbol>}
          onClick={() => state.notifications.setServer(props.server, "all")}
          actionSymbol={
            state.notifications.computeForServer(props.server) === "all" ? (
              <Symbol size={16}>radio_button_checked</Symbol>
            ) : (
              <Symbol size={16}>radio_button_unchecked</Symbol>
            )
          }
        >
          <Trans>All Messages</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={<Symbol size={16}>alternate_email</Symbol>}
          onClick={() => state.notifications.setServer(props.server, "mention")}
          actionSymbol={
            state.notifications.computeForServer(props.server) === "mention" ? (
              <Symbol size={16}>radio_button_checked</Symbol>
            ) : (
              <Symbol size={16}>radio_button_unchecked</Symbol>
            )
          }
        >
          <Trans>Mentions Only</Trans>
        </ContextMenuButton>
        <ContextMenuButton
          icon={<Symbol size={16}>notifications_off</Symbol>}
          onClick={() => state.notifications.setServer(props.server, "none")}
          actionSymbol={
            state.notifications.computeForServer(props.server) === "none" ? (
              <Symbol size={16}>radio_button_checked</Symbol>
            ) : (
              <Symbol size={16}>radio_button_unchecked</Symbol>
            )
          }
        >
          <Trans>None</Trans>
        </ContextMenuButton>
      </ContextMenuSubMenu>
      <ContextMenuDivider />

      <Show when={permissionInviteOthers()}>
        <ContextMenuButton
          icon={<Symbol size={16}>person_add</Symbol>}
          onClick={createInvite}
        >
          <Trans>Create invite</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={permissionEditIdentity()}>
        <ContextMenuButton
          icon={<Symbol size={16}>face</Symbol>}
          onClick={editIdentity}
        >
          <Trans>Edit your identity</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={permissionServerSettings()}>
        <ContextMenuButton
          icon={<Symbol size={16}>settings</Symbol>}
          onClick={openSettings}
        >
          <Trans>Open server settings</Trans>
        </ContextMenuButton>
      </Show>
      <Show
        when={
          permissionInviteOthers() ||
          permissionEditIdentity() ||
          permissionServerSettings()
        }
      >
        <ContextMenuDivider />
      </Show>

      <ContextMenuButton
        icon={<Symbol size={16}>report</Symbol>}
        onClick={report}
        destructive
      >
        <Trans>Report server</Trans>
      </ContextMenuButton>
      <Show when={!props.server.owner?.self}>
        <ContextMenuButton
          icon={<Symbol size={16}>logout</Symbol>}
          onClick={leave}
          destructive
        >
          <Trans>Leave server</Trans>
        </ContextMenuButton>
      </Show>

      <Show
        when={
          state.settings.getValue("advanced:admin_panel") &&
          state.settings.getValue("advanced:copy_id")
        }
      >
        <ContextMenuDivider />
      </Show>

      <Show when={state.settings.getValue("advanced:admin_panel")}>
        <ContextMenuButton
          icon={<Symbol size={16}>shield</Symbol>}
          onClick={openAdminPanel}
        >
          <Trans>Admin Panel</Trans>
        </ContextMenuButton>
      </Show>
      <Show when={state.settings.getValue("advanced:copy_id")}>
        <ContextMenuButton
          icon={<Symbol size={16}>badge</Symbol>}
          onClick={copyId}
        >
          <Trans>Copy server ID</Trans>
        </ContextMenuButton>
      </Show>
    </ContextMenu>
  );
}
