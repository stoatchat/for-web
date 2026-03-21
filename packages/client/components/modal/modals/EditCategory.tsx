import { Trans } from "@lingui-solid/solid/macro";

import { t } from "@lingui/core/macro";
import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";
import { createFormControl, createFormGroup } from "solid-forms";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to delete a category
 */
export function EditCategoryModal(
  props: DialogProps & Modals & { type: "edit_category" },
) {
  const { showError } = useModals();

  /* eslint-disable solid/reactivity */
  const group = createFormGroup({
    text: createFormControl(props.category.title),
  });
  /* eslint-enable solid/reactivity */

  async function onSubmit() {
    try {
      const text = group.controls.text.value;
      await props.server.edit({
        categories: [...props.server.categories!].map((c) => {
          return {
            ...c,
            title: c.id === props.category.id ? text : c.title,
          };
        }),
      });

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Rename category</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Rename</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
        },
      ]}
      isDisabled={!Form2.canSubmit(group)}
    >
      <form onSubmit={submit}>
        <Column>
          <Form2.TextField
            name="category_name"
            control={group.controls.text}
            label={t`New name`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
