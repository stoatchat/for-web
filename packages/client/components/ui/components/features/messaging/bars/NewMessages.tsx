import { Accessor, Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { decodeTime } from "ulid";

import { useTime } from "@revolt/i18n";
import { Ripple } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils";

import { FloatingIndicator } from "./FloatingIndicator";

interface Props {
  /**
   * The last Id of the message the user read
   */
  lastId: Accessor<string | undefined>;

  /**
   * Jump back to the last message
   */
  jumpBack: () => void;

  /**
   * Dismiss the message
   */
  dismiss: () => void;
}

/**
 * Component indicating to user there were new messages in chat
 */
export function NewMessages(props: Props) {
  // TODO: hook escape button

  const dayjs = useTime();

  /**
   * Remove the message
   */
  function onCancel(e: MouseEvent) {
    e.stopPropagation();
    props.dismiss();
  }

  return (
    <Show when={props.lastId()}>
      <FloatingIndicator position="top" onClick={props.jumpBack}>
        <Ripple />
        <span class={css({ flexGrow: 1 })}>
          <Trans>
            New messages since {dayjs(decodeTime(props.lastId()!)).fromNow()}
          </Trans>
        </span>
        <span>
          <Trans>Jump to the beginning</Trans>
        </span>
        <CancelIcon onClick={onCancel}>
          <Symbol size={16}>close</Symbol>
        </CancelIcon>
      </FloatingIndicator>
    </Show>
  );
}

const CancelIcon = styled("div", {
  base: {
    height: "16px",
  },
});
