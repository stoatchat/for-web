import { createFormControl, createFormGroup } from "solid-forms";

import { Trans } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to leave a server
 */
export function LeaveServerModal(
  props: DialogProps & Modals & { type: "leave_server" },
) {
  const { showError } = useModals();

  const group = createFormGroup({
    silent: createFormControl(false),
  });

  const leaveServer = useMutation(() => ({
    mutationFn: () => props.server.delete(group.controls.silent.value),
    onError: showError,
    onSuccess: () => props.onClose(),
  }));

  async function onSubmit() {
    await leaveServer.mutateAsync();
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Leave {props.server.name}?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Leave</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
        },
      ]}
      isDisabled={leaveServer.isPending}
    >
      <form onSubmit={submit}>
        <Column>
          <Text>
            <Trans>
              You won't be able to rejoin unless you are re-invited.
            </Trans>
          </Text>
          <Form2.Checkbox name="silent" control={group.controls.silent}>
            <Trans>Don't notify others that you've left</Trans>
          </Form2.Checkbox>
        </Column>
      </form>
    </Dialog>
  );
}
