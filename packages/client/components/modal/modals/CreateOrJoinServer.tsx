import { Trans } from "@lingui/solid/macro";

import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to create or join a server
 */
export function CreateOrJoinServerModal(
  props: DialogProps & Modals & { type: "create_or_join_server" },
) {
  const { openModal } = useModals();

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title="Create or join a server"
      actions={[
        {
          text: "Create",
          onClick: () => {
            openModal({
              type: "create_server",
              client: props.client,
            });
          },
        },
        {
          text: "Join",
          onClick: () => {
            openModal({ type: "join_server", client: props.client });
          },
        },
      ]}
    >
      <Trans>
        Would you like to create a new server or join an existing one?
      </Trans>
    </Dialog>
  );
}
