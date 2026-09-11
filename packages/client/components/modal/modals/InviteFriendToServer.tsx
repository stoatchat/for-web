import { createFormControl, createFormGroup } from "solid-forms";
import { createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";

import { useInstance } from "@revolt/instance";
import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Form2,
  Row,
  TextField,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

import { getInviteLink } from "./CreateInvite";

/**
 * Invite a friend to one of the current user's servers by sending them an
 * invite link in DM.
 */
export function InviteFriendToServerModal(
  props: DialogProps & Modals & { type: "invite_friend_to_server" },
) {
  const { t } = useLingui();
  const instance = useInstance();
  const { showError } = useModals();

  const group = createFormGroup({
    server: createFormControl([] as string[], { required: true }),
  });

  async function onSubmit() {
    try {
      const serverId = group.controls.server.value[0];
      const server = props.client.servers.get(serverId);
      const channel = server?.defaultChannel ?? server?.channels[0];
      if (!channel) throw new Error("No channel to invite through");

      const invite = await channel.createInvite();
      const link = getInviteLink(invite._id, instance);

      const dm = await props.user.openDM();
      await dm.sendMessage(link);

      props.onClose();
    } catch (err) {
      showError(err);
    }
  }

  const [filter, setFilter] = createSignal("");

  const filterLowercase = createMemo(() => filter().toLowerCase());

  const servers = createMemo(() =>
    props.client.servers
      .filter((server) => server.havePermission("InviteOthers"))
      .filter((server) => server.name.toLowerCase().includes(filterLowercase()))
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map((server) => ({ item: server, value: server.id })),
  );

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Invite {props.user.displayName} to a server</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Send Invite</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column>
          <TextField
            value={filter()}
            variant="filled"
            placeholder={t`Search for servers...`}
            onKeyUp={(e) => setFilter(e.currentTarget.value)}
          />

          <Form2.VirtualSelect
            items={servers()}
            control={group.controls.server}
          >
            {(item) => (
              <Row align>
                <Avatar
                  src={item.animatedIconURL}
                  fallback={item.name}
                  size={24}
                />{" "}
                <span>{item.name}</span>
              </Row>
            )}
          </Form2.VirtualSelect>
        </Column>
      </form>
    </Dialog>
  );
}
