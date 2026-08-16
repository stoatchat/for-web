import { Trans } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { Dialog, DialogProps } from "@revolt/ui";

import { useClient } from "@revolt/client";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to sign out of all sessions
 */
export function SignOutSessionsModal(
  props: DialogProps & Modals & { type: "sign_out_sessions" },
) {
  const { showError, mfaFlow } = useModals();
  const client = useClient();

  const signOutSessions = useMutation(() => ({
    mutationFn: async () => {
      const mfa = await client().account.mfa();
      const ticket = await mfaFlow(mfa as never);
      props.client.sessions.deleteAll(ticket!);
    },
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Are you sure you want to clear your sessions?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Accept</Trans>,
          onClick: () => signOutSessions.mutateAsync(),
        },
      ]}
      isDisabled={signOutSessions.isPending}
    >
      <Trans>You cannot undo this action.</Trans>
    </Dialog>
  );
}
