import { For, Match, Switch, createMemo, createSignal } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import type { Channel, Client, Server, User } from "stoat.js";
import { UserPermission } from "stoat.js";

import { useClient } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import {
  Avatar,
  CategoryButton,
  Column,
  Dialog,
  DialogProps,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * First channel of a server we are allowed to create an invite for
 */
function invitableChannel(server: Server): Channel | undefined {
  return server.channels.find((channel) =>
    channel.havePermission("InviteOthers"),
  );
}

/**
 * Whether we are allowed to send the given user a direct message
 *
 * The invite is delivered as a DM, so without this the request fails
 * server-side whichever server is picked.
 */
function canDirectMessage(user: User): boolean {
  return (user.permission & UserPermission.SendMessage) !== 0;
}

/**
 * Servers we can invite the given user to
 *
 * Excludes servers they already belong to, and servers where we lack the
 * permission to create an invite.
 */
export function invitableServers(client: Client, user: User): Server[] {
  return client.servers.filter(
    (server) => !server.getMember(user.id) && !!invitableChannel(server),
  );
}

/**
 * Whether we can invite the given user to one of our servers
 *
 * The invite is delivered as a direct message, so it needs both somewhere to
 * invite them to and the permission to message them.
 */
export function canInviteToServer(client: Client, user: User): boolean {
  return canDirectMessage(user) && invitableServers(client, user).length > 0;
}

/**
 * Invite someone to one of your servers by sending them the link in a DM
 */
export function InviteToServerModal(
  props: DialogProps & Modals & { type: "invite_to_server" },
) {
  const client = useClient();
  const instance = useInstance();
  const { showError } = useModals();

  const [sending, setSending] = createSignal<string>();

  /**
   * Servers we can invite this person to, in alphabetical order
   */
  const servers = createMemo(() =>
    invitableServers(client(), props.user).toSorted((a, b) =>
      a.name.localeCompare(b.name),
    ),
  );

  /**
   * Create an invite for the chosen server and send it to the user directly
   */
  async function invite(server: Server) {
    if (sending()) return;
    setSending(server.id);

    try {
      const channel = invitableChannel(server)!;
      const { _id } = await channel.createInvite();
      const link = instance.isStoat
        ? `https://stt.gg/${_id}`
        : instance.href(`/invite/${_id}`);

      const dm = await props.user.openDM();
      await dm.sendMessage(link);

      props.onClose();
    } catch (error) {
      showError(error);
    } finally {
      setSending(undefined);
    }
  }

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Invite {props.user.displayName} to a server</Trans>}
      actions={[{ text: <Trans>Close</Trans> }]}
      isDisabled={!!sending()}
    >
      <Column>
        <Switch
          fallback={
            <For each={servers()}>
              {(server) => (
                <CategoryButton
                  icon={
                    <Avatar
                      shape="rounded-square"
                      size={24}
                      src={server.iconURL}
                      fallback={server.name}
                    />
                  }
                  action="chevron"
                  onClick={() => invite(server)}
                >
                  {server.name}
                </CategoryButton>
              )}
            </For>
          }
        >
          <Match when={!canDirectMessage(props.user)}>
            <Trans>
              You cannot send {props.user.displayName} a direct message, so you
              cannot send them an invite either. You may need to be friends
              first.
            </Trans>
          </Match>
          <Match when={!servers().length}>
            <Trans>
              You have no server you can invite them to. They may already be in
              all of them, or you may not be allowed to create invites.
            </Trans>
          </Match>
        </Switch>
      </Column>
    </Dialog>
  );
}
