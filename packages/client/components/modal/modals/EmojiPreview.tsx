import { Trans } from "@lingui/solid/macro";

import { Avatar, Dialog, DialogProps } from "@revolt/ui";

import { Modals } from "../types";

export function EmojiPreviewModal(
  props: DialogProps & Modals & { type: "emoji_preview" },
) {
  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={`:${props.emoji.name}:`}
      actions={[{ text: <Trans>Close</Trans> }]}
    >
      <Avatar src={props.emoji.url} shape="rounded-square" />
    </Dialog>
  );
}
