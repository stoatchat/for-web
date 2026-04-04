import { createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import { Checkbox, Dialog, DialogProps } from "@revolt/ui";

import MdWarning from "@material-design-icons/svg/outlined/warning.svg?component-solid";

import { Modals } from "../types";

export function EnableDevtoolsModal(
  props: DialogProps & Modals & { type: "enable_devtools" },
) {
  const [confirm, setConfirm] = createSignal(false);

  return (
    <Dialog
      icon={<MdWarning fill="var(--md-sys-color-error)" />}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Temporarily Enable Devtools</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Enable</Trans>,
          isDisabled: !confirm(),
          onClick() {
            props.enableDevtools(Date.now() + 24 * 60 * 60 * 1000);
          },
        },
      ]}
    >
      <Trans>
        Click on the items below to learn more about different changes!
      </Trans>
      <Checkbox
        checked={confirm()}
        onChange={() => setConfirm((checked) => !checked)}
      >
        I understand the dangers and accept the risk.
      </Checkbox>
    </Dialog>
  );
}
