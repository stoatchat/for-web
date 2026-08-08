import { Trans } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { useClient } from "@revolt/client";
import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to delete a bot
 */
export function DeleteBotModal(
  props: DialogProps & Modals & { type: "delete_bot" },
) {
  const client = useClient();
  const { showError, mfaFlow } = useModals();

  const deleteBot = useMutation(() => ({
    mutationFn: async () => {
      const mfa = await client().account.mfa();
      await mfaFlow(mfa as never);
      await props.bot.delete(); // TODO: should use ticket in API
    },
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Delete {props.bot.user!.displayName}?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Delete</Trans>,
          onClick: () => deleteBot.mutateAsync(),
        },
      ]}
      isDisabled={deleteBot.isPending}
    >
      <Trans>Once it's deleted, there's no going back.</Trans>
    </Dialog>
  );
}
