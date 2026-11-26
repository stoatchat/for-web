import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui/solid/macro";

import { Column, Dialog, DialogProps, Form2, Row } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function EditEmojiModal(
  props: DialogProps & Modals & { type: "edit_emoji" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    // eslint-disable-next-line solid/reactivity
    emojiName: createFormControl(props.emoji.name, {
      required: true,
    }),
  });

  async function onSubmit() {
    try {
      await props.emoji.edit({
        name: group.controls.emojiName.value,
      });
      props.onClose();
    } catch (err) {
      showError(err);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Rename emoji</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Change</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column>
          <Row align>
            <Form2.TextField
              minlength={1}
              maxlength={32}
              counter
              name="emojiName"
              control={group.controls.emojiName}
              label={t`Emoji Name`}
            />
          </Row>
        </Column>
      </form>
    </Dialog>
  );
}
