import { Trans } from "@lingui-solid/solid/macro";
import { Avatar, Column, Dialog, DialogProps, Text } from "@revolt/ui";

import { useVoice } from "../../rtc/state";
import { Modals } from "../types";

/**
 * Incoming call ringing modal
 */
export function RingingModal(
  props: DialogProps & Modals & { type: "ringing" },
) {
  const voice = useVoice();

  async function onAccept() {
    try {
      await voice.connect(props.channel);
      props.onClose();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Dialog
      minWidth={320}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Incoming Call</Trans>}
      actions={[
        {
          text: <Trans>Decline</Trans>,
          onClick: () => {
            props.onClose();
            return false;
          },
        },
        {
          text: <Trans>Accept</Trans>,
          color: "success",
          onClick: () => {
            onAccept();
            return false;
          },
        },
      ]}
    >
      <Column align="center" gap="normal">
        <Avatar
          src={props.user.animatedAvatarURL}
          fallback={props.user.displayName}
          size={64}
        />
        <Column align="center" gap="none">
          <Text variant="bold">{props.user.displayName}</Text>
          <Text>
            <Trans>is calling you...</Trans>
          </Text>
        </Column>
      </Column>
    </Dialog>
  );
}
