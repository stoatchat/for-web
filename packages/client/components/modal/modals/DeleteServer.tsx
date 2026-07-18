import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { useClient } from "@revolt/client";
import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to delete a server
 */
export function DeleteServerModal(
  props: DialogProps & Modals & { type: "delete_server" },
) {
  const client = useClient();
  const { showError, mfaFlow } = useModals();

  const deleteServer = useMutation(() => ({
    mutationFn: async () => {
      const mfa = await client().account.mfa();
      const ticket = await mfaFlow(mfa);
      if (ticket) {
        await props.server.delete();
      }
    },
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Delete {props.server.name}?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Delete</Trans>,
          onClick: () => deleteServer.mutateAsync(),
        },
      ]}
      isDisabled={deleteServer.isPending}
    >
      <Trans>Once it's deleted, there's no going back.</Trans>
    </Dialog>
  );
}
