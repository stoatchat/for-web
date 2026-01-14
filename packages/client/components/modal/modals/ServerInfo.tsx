import { Trans } from "@lingui-solid/solid/macro";

import { useClient } from "@revolt/client";
import { Markdown } from "@revolt/markdown";
import { Dialog, DialogProps } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function ServerInfoModal(
  props: DialogProps & Modals & { type: "server_info" },
) {
  const client = useClient();
  const { openModal } = useModals();

  const canOpenSettings = () =>
    props.server.orPermission(
      "ManageServer",
      "ManageCustomisation",
      "ManageRole",
      "ManagePermissions",
    );

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={props.server.name}
      actions={[
        ...(canOpenSettings()
          ? [
              {
                text: <Trans>Settings</Trans>,
                onClick() {
                  openModal({
                    type: "settings",
                    config: "server",
                    context: props.server,
                  });
                },
              },
            ]
          : []),
        {
          text: <Trans>Edit Identity</Trans>,
          onClick() {
            openModal({
              type: "server_identity",
              member: props.server.member!,
            });
          },
        },
        {
          text: <Trans>Report</Trans>,
          onClick() {
            openModal({
              type: "report_content",
              client: client(),
              target: props.server,
            });
          },
        },
        { text: <Trans>Close</Trans> },
      ]}
    >
      <Markdown content={props.server.description!} />
    </Dialog>
  );
}
