import { Trans } from "@lingui-solid/solid/macro";

import { Dialog, DialogProps } from "@revolt/ui";

import { useMutation } from "@tanstack/solid-query";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to ask the user if they really want to reset this bot's token
 */
export function ResetBotTokenModal(
  props: DialogProps & Modals & { type: "reset_bot_token" },
) {
  const { showError } = useModals();
  const resetToken = useMutation(() => ({
    mutationFn: () => props.bot.edit({ remove: ["Token"] }),
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Reset {props.bot.user!.username}'s token?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Reset</Trans>,
          onClick: () => resetToken.mutateAsync(),
        },
      ]}
    >
      <Trans>
        This will invalidate the current token and stop any existing instances
        of the bot from running.
      </Trans>
    </Dialog>
  );
}
