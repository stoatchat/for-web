import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useNavigate } from "@revolt/routing";
import { Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Modal to create a new server
 */
export function CreateServerModal(
  props: DialogProps & Modals & { type: "create_server" },
) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { showError } = useModals();

  const group = createFormGroup({
    name: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      const server = await props.client.servers.createServer({
        name: group.controls.name.value,
      });

      setTimeout(() => navigate(`/server/${server.id}`));
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create server</Trans>}
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
              By creating this server, you agree to the{" "}
              <a href="https://stoat.chat/aup" target="_blank" rel="noreferrer">
                <Trans>Acceptable Use Policy</Trans>
              </a>
              .
            </Trans>
          </Text>
          <Form2.TextField
            name="name"
            control={group.controls.name}
            label={t`Server Name`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
