import { Trans } from "@lingui/solid/macro";

import { Markdown } from "@revolt/markdown";
import { Dialog, DialogProps } from "@revolt/ui";

import { css } from "styled-system/css";
import { Modals } from "../types";

export function ChannelInfoModal(
  props: DialogProps & Modals & { type: "channel_info" },
) {
  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={`#${props.channel.name}`}
      actions={[{ text: <Trans>Close</Trans> }]}
    >
      <div class={css({ userSelect: "text" })}>
        <Markdown content={props.channel.description!} />
      </div>
    </Dialog>
  );
}
