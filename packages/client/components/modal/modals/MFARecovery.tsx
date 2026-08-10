import { For, createSignal } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Dialog, DialogProps, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * List of recovery codes
 */
const List = styled("div", {
  base: {
    display: "grid",
    textAlign: "center",
    gridTemplateColumns: "1fr 1fr",
    fontFamily: "var(--monospace-font), monospace",
    "& span": {
      userSelect: "text",
    },
    "& i": {
      opacity: 0,
      position: "absolute",
    },
  },
});

/**
 * Modal to display a list of recovery codes
 */
export function MFARecoveryModal(
  props: DialogProps & Modals & { type: "mfa_recovery" },
) {
  const { mfaFlow, showError } = useModals();

  // Keep track of changes to recovery codes
  // eslint-disable-next-line solid/reactivity
  const [known, setCodes] = createSignal(props.codes);

  /**
   * Reset recovery codes
   */
  async function reset() {
    try {
      const ticket = await mfaFlow(props.mfa);
      if (ticket) {
        const codes = await ticket.generateRecoveryCodes();
        setCodes(codes);
      }
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Your recovery codes</Trans>}
      actions={[
        {
          text: <Trans>Reset</Trans>,
          onClick: () => {
            reset();
            return false;
          },
        },
        {
          text: <Trans>Done</Trans>,
          onClick: () => true,
        },
      ]}
    >
      <Text>
        <Trans>Please save these to a safe location.</Trans>
      </Text>
      <List>
        <For each={known()}>
          {(code, index) => (
            <span>
              {code} {index() !== known().length - 1 && <i>{","}</i>}
            </span>
          )}
        </For>
      </List>
    </Dialog>
  );
}
