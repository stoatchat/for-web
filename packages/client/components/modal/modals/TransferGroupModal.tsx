import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { Avatar, Column, Dialog, DialogProps, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Confirmation modal to transfer ownership
 */
export function TransferOwnershipModal(
  props: DialogProps & Modals & { type: "transfer_ownership" },
) {
  const { showError } = useModals();

  const transferOwnership = useMutation(() => ({
    mutationFn: () => props.channel.edit({ owner: props.user.id }),
    onSuccess: () => props.onClose(),
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Transfer Ownership</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Confirm</Trans>,
          onClick: () => transferOwnership.mutateAsync(),
        },
      ]}
    >
      <Column align>
        <Avatar src={props.user?.avatarURL} size={64} />

        <Text>
          <Trans>
            Are you sure you want to transfer ownership to{" "}
            <strong>{props.user?.username}</strong>?
          </Trans>
        </Text>
      </Column>
    </Dialog>
  );
}
