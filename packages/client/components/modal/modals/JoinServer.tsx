import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useNavigate } from "@revolt/routing";
import { Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

const RE_INVITE_URL = /(?:invite|stt.gg)\/([a-z0-9]+)/gi;

/**
 * Modal to join a server
 */
export function JoinServerModal(
  props: DialogProps & Modals & { type: "join_server" },
) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { showError } = useModals();

  const group = createFormGroup({
    link: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      let code = group.controls.link.value;
      const match = RE_INVITE_URL.exec(code);
      if (match) code = match[1];

      // fetch invite and display
      // const invite = await props.client.api.get(`/invites/${code}`);

      // TODO: replace
      const acceptedInvite = await props.client.api.post(`/invites/${code}`);
      if (acceptedInvite.type === "Server") {
        navigate(`/server/${acceptedInvite.server._id}`);
      } else {
        // TODO: group
        // navigate(`/channel/${result.channels}`);
      }
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Join a server</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Join</Trans>,
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
            <Trans>Use a code or invite link</Trans>
          </Text>
          <Form2.TextField
            name="link"
            control={group.controls.link}
            label={t`Code`}
            placeholder="stt.gg/wVEJDGVs"
          />
        </Column>
      </form>
    </Dialog>
  );
}
