import { Trans, useLingui } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { createFormControl, createFormGroup } from "solid-forms";

import { useState } from "@revolt/state";
import { PwdMinLength } from "@revolt/state/stores/Encrypted";
import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function ChannelEncryptModal(
  props: DialogProps & Modals & { type: "channel_e2ee" },
) {
  const state = useState();
  const { showError } = useModals();
  const { t } = useLingui();

  const change = useMutation(() => ({
    mutationFn: (e2e: boolean) => props.channel.edit({ e2e }),
    onError: showError,
  }));
  const group = createFormGroup({
    pwd: createFormControl(),
  });

  async function submit() {
    if (!Form2.canSubmit(group)) return;
    await change.mutateAsync(true);
    state.e2e.setPass(props.channel, group.controls.pwd.value);
    props.onClose();
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Enable encryption?</Trans>}
      actions={[
        { text: <Trans>Nevermind</Trans> },
        {
          text: <Trans>Enable encryption</Trans>,
          onClick: () => {
            submit();
            return false;
          },
          isDisabled: !group.controls.pwd.value || !Form2.canSubmit(group),
        },
      ]}
      isDisabled={change.isPending}
    >
      <Column>
        <b>
          <Trans>Whoa there!</Trans>
        </b>
        <div>
          <Trans>
            This is a permanent action, and any existing messages will be
            cleared. Make sure you <b>write down your password</b>- we can't
            recover it for you!
          </Trans>
        </div>
        <Form2.TextField
          name="pwd"
          control={group.controls.pwd}
          label={t`Password`}
          minlength={PwdMinLength}
        />
      </Column>
    </Dialog>
  );
}
