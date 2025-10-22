import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Create a new bot
 */
export function CreateBotModal(
  props: DialogProps & Modals & { type: "create_bot" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    username: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      const bot = await props.client.bots.createBot(
        group.controls.username.value,
      );

      props.onCreate(bot);
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create a new bot</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Create</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={Form2.submitHandler(group, onSubmit)}>
        <Column>
          <Text>
            <Trans>
              By creating this bot, you agree to the{" "}
              <a href="https://stoat.chat/aup" target="_blank" rel="noreferrer">
                <Trans>Acceptable Use Policy</Trans>
              </a>
              .
            </Trans>
          </Text>
          <Form2.TextField
            name="username"
            control={group.controls.username}
            label={t`Username`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
