import { Trans } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";

import { Dialog, DialogProps } from "@revolt/ui";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to delete a category
 */
export function DeleteCategoryModal(
  props: DialogProps & Modals & { type: "delete_category" },
) {
  const { showError } = useModals();

  const deleteCategory = useMutation(() => ({
    mutationFn: () => props.server.edit({
        categories: (props.server.categories ?? []).filter(
          (c) => c.id !== props.categoryId,
        ),
      }),
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Delete category</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Delete</Trans>,
          onClick: deleteCategory.mutateAsync,
        },
      ]}
      isDisabled={deleteCategory.isPending}
    >
      <Trans>Once it's deleted, there's no going back.</Trans>
    </Dialog>
  );
}
