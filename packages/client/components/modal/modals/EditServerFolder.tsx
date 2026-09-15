import { createSignal } from "solid-js";

import { Trans } from "@lingui/solid/macro";

import { t } from "@lingui/core/macro";
import { useState } from "@revolt/state";
import { ColourPicker, Column, Dialog, DialogProps, Form2 } from "@revolt/ui";
import { createFormControl, createFormGroup } from "solid-forms";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to rename a server folder or change its colour
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
  const [colour, setColour] = createSignal(props.folder.colour ?? null);
  /* eslint-enable solid/reactivity */

  async function onSubmit() {
    try {
      state.ordering.editFolder(props.folder.id, {
        name: group.controls.text.value,
        colour: colour() ?? undefined,
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
      title={<Trans>Edit folder</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Save</Trans>,
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
            label={t`Name`}
          />
          <ColourPicker
            label={<Trans>Folder colour</Trans>}
            colour={colour()}
            swatchLabel={(value) => t`Set folder colour to ${value}`}
            onChange={setColour}
          />
        </Column>
      </form>
    </Dialog>
  );
}
