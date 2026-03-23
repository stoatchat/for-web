import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { Avatar, Column, Dialog, DialogProps, Text } from "@revolt/ui";
import { useTime } from "@revolt/i18n";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to remove a timeout on a member
 */
export function RemoveTimeoutModal(
  props: DialogProps & Modals & { type: "remove_timeout" },
) {
  const dayjs = useTime();
  const { showError } = useModals();

  const removeTimeout = useMutation(() => ({
    mutationFn: () => props.member.edit({ remove: ["Timeout"] }),
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Remove Member Timeout</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Remove Timeout</Trans>,
          onClick: removeTimeout.mutateAsync,
        },
      ]}
      isDisabled={removeTimeout.isPending}
    >
      <Column align>
        <Avatar src={props.member.user?.animatedAvatarURL} size={64} />
        <Text>
          <Trans>
            You are about to remove the timeout on {props.member.user?.username}.
            They are timed out for {dayjs(props.member.timeout).fromNow(true)}.
            (You can timeout them via the context menu)
          </Trans>
        </Text>
      </Column>
    </Dialog>
  );
}
