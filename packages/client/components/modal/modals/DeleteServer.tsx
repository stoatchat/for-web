import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { useClient } from "@revolt/client";
import { useNavigate } from "@revolt/routing";
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
  const navigate = useNavigate();
  const modals = useModals();

  const deleteServer = useMutation(() => ({
    mutationFn: async () => {
      const mfa = await client().account.mfa();
      await mfaFlow(mfa as never);
      await props.server.delete(); // TODO: should use ticket in API
    },
    onError: showError,
    onSuccess: () => {
      modals.closeAll();
      navigate("/app", {replace: false});
      setTimeout(() => window.location.reload(), 0);
    },
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
