import { For, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
import { useMutation } from "@tanstack/solid-query";

import {
  Avatar,
  Chip,
  Column,
  Dialog,
  DialogProps,
  InputTimePicker,
  Row,
  Text,
  toOffset,
} from "@revolt/ui";

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

  const presets = [
    // Translations are not handled within the InputTimePicker component due to limitations in how useTime() is implemented
    { label: t`30 Minutes`, value: 1800 * 1000 },
    { label: t`1 Hour`, value: 3600 * 1000 },
    { label: t`12 Hours`, value: 43200 * 1000 },
    { label: t`1 Day`, value: 86400 * 1000 },
    { label: t`1 Week`, value: 604800 * 1000 },
  ];

  const timeout = useMutation(() => ({
    mutationFn: () =>
      props.member.edit({
        timeout: new Date(Date.now() + offset()).toISOString(),
      }),
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={
        <Column align>
          <Trans>Timeout Member</Trans>
        </Column>
      }
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
          <Trans>
            You are about to timeout {props.member.user?.username} (You can undo
            this via the context menu)
          </Trans>
        </Text>
        <Column align>
          <InputTimePicker
            assistChips={presets}
            includeDays
            onChange={setOffset}
          />
        </Column>
      </Column>
    </Dialog>
  );
}
