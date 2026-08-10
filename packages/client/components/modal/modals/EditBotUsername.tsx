import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui/solid/macro";

import { Column, Dialog, DialogProps, Form2, Row, Text } from "@revolt/ui";

import { css } from "styled-system/css";
import { useModals } from "..";
import { Modals } from "../types";

/**
 * Change bot username
 */
export function EditBotUsernameModal(
  props: DialogProps & Modals & { type: "edit_bot_username" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    // `username` won't change until after editing it
    // eslint-disable-next-line solid/reactivity
    username: createFormControl(props.bot.user!.username, {
      required: true,
    }),
  });

  async function onSubmit() {
    try {
      await props.bot.edit({
        name: group.controls.username.value,
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
      title={<Trans>Change bot username</Trans>}
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
              name="username"
              control={group.controls.username}
              label={t`Username`}
            />
            <div class={css({ flexShrink: 0 })}>
              <Text class="label">#{props.bot.user!.discriminator}</Text>
            </div>
          </Row>
        </Column>
      </form>
    </Dialog>
  );
}
