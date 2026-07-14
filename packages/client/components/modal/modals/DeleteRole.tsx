import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to delete a role
 */
export function DeleteRoleModal(
  props: DialogProps & Modals & { type: "delete_role" },
) {
  const { showError } = useModals();

  const deleteRole = useMutation(() => ({
    mutationFn: () => props.role.delete(),
    onError: showError,
    onSuccess: () => props.cb(),
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Delete {props.role.name}?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Delete</Trans>,
          onClick: () => deleteRole.mutateAsync(),
        },
      ]}
      isDisabled={deleteRole.isPending}
    >
      <Trans>Once it's deleted, there's no going back.</Trans>
    </Dialog>
  );
}
