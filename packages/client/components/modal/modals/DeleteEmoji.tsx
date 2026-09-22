import { Trans } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function DeleteEmojiModal(
  props: DialogProps & Modals & { type: "delete_emoji" },
) {
  const { showError } = useModals();

  const deleteEmoji = useMutation(() => ({
    mutationFn: async () => {
      await props.emoji.delete();
    },
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Delete :{props.emoji.name}:?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Delete</Trans>,
          onClick: () => deleteEmoji.mutateAsync(),
        },
      ]}
      isDisabled={deleteEmoji.isPending}
    >
      <Trans>
        Deleting this emoji will disallow future use. All past uses will remain.
      </Trans>
    </Dialog>
  );
}
