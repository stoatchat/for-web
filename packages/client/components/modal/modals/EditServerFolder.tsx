import { Trans } from "@lingui/solid/macro";

import { t } from "@lingui/core/macro";
import { useState } from "@revolt/state";
import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";
import { createFormControl, createFormGroup } from "solid-forms";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to rename a server folder
 */
export function EditServerFolderModal(
  props: DialogProps & Modals & { type: "edit_server_folder" },
) {
  const state = useState();
  const { showError } = useModals();

  /* eslint-disable solid/reactivity */
  const group = createFormGroup({
    text: createFormControl(props.folder.name),
  });
  /* eslint-enable solid/reactivity */

  async function onSubmit() {
    try {
      state.ordering.editFolder(props.folder.id, {
        name: group.controls.text.value,
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
      title={<Trans>Rename folder</Trans>}
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
            name="folder_name"
            control={group.controls.text}
            label={t`New name`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
