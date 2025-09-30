import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { createSignal } from "solid-js";

import { Avatar, Column, Dialog, DialogProps, Text, InputTimePicker } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Timeout a server member
 */
export function TimeoutMemberModal(
  props: DialogProps & Modals & { type: "timeout_member" },
) {
  const { showError } = useModals();

  const [offset, setOffset] = createSignal(0);

  const timeout = useMutation(() => ({
    mutationFn: () => props.member.edit({
      timeout: (new Date(Date.now() + offset())).toISOString()
    }),
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Timeout Member</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Apply</Trans>,
          onClick: timeout.mutateAsync,
        },
      ]}
      isDisabled={timeout.isPending}
    >
      <Column align>
        <Avatar src={props.member.user?.animatedAvatarURL} size={64} />
        <Text>
          <Trans>You are about to timeout {props.member.user?.username} (You can undo this via the context menu)</Trans>
        </Text>
	<InputTimePicker onChange={setOffset} />
      </Column>
    </Dialog>
  );
}
