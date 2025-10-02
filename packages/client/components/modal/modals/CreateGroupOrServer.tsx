import { Trans } from "@lingui-solid/solid/macro";

import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to create a group or server
 */
export function CreateGroupOrServer(
  props: DialogProps & Modals & { type: "create_group_or_server" },
) {
  const { openModal } = useModals();

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title="Create a group or server"
      actions={[
        {
          text: "Group",
          onClick: () => {
            openModal({
              type: "create_group",
              client: props.client,
            });
          },
        },
        {
          text: "Server",
          onClick: () => {
            openModal({
              type: "create_server",
              client: props.client,
            });
          },
        },
      ]}
    >
      <Trans>
        Would you like to create a new group or server?
      </Trans>
    </Dialog>
  );
}
