import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { createSignal } from "solid-js";

import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Text,
  InputTimePicker,
  toOffset,
  Row,
  Chip
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
    [0,30,0,0], // 30 Minutes
    [0,0,1,0],  // 1 Hour 
    [0,0,12,0], // 12 Hours
    [0,0,0,1],  // 1 Day
    [0,0,0,7],  // 7 Days (week)
  ];

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
      title={<Column align>
	       <Trans>Timeout Member</Trans>
	     </Column>}
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
	<Column align>
	  <Row>
	    <For each={presets}>
	      {(preset) => {
		const amount = toOffset(preset);
		
		return (<Chip variant="assist" value={amount}>TODO!{preset.join(",")}</Chip>);
	      }}
	    </For>
	  </Row>
	  <InputTimePicker includeDays onChange={setOffset} />
	</Column>
      </Column>
    </Dialog>
  );
}
