import { Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import type { Message } from "stoat.js";
import { styled } from "styled-system/jsx";

import { Row } from "@revolt/ui/components/layout";

import { MessageReply } from "../elements";
import { Symbol } from "@revolt/ui/components/utils/Symbol"

interface Props {
  /**
   * Message to display
   */
  message?: Message;

  /**
   * Whether we are mentioning this message
   */
  mention: boolean;

  /**
   * Whether this is our own message and we should hide mention option
   */
  self: boolean;

  /**
   * Toggle the mention
   */
  toggle: () => void;

  /**
   * Dismiss the mention
   */
  dismiss: () => void;
}

/**
 * Left side "replying to" text
 */
const ReplyTo = styled("span", {
  base: {
    flexShrink: 0,
  },
});

/**
 * Mention toggle
 */
const MentionToggle = styled("a", {
  base: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    flexDirection: "row",
    textTransform: "uppercase",
    gap: "var(--gap-sm)",
    cursor: "pointer",
  },
  variants: {
    mention: {
      false: {
        color: "var(--md-sys-color-outline)",
      },
    },
  },
});

/**
 * Dismiss reply button
 */
const Dismiss = styled("a", {
  base: {
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
});

/**
 * Preview container
 */
const Base = styled(Row, {
  base: {
    fontSize: "0.8em",
    userSelect: "none",

    marginBlockEnd: "var(--gap-md)",
    padding: "var(--gap-md) var(--gap-lg)",
    borderRadius: "var(--borderRadius-lg)",

    background: "var(--md-sys-color-primary-container)",
    color: "var(--md-sys-color-on-primary-container)",

    "& a:hover": {
      filter: "brightness(1.2)",
    },
  },
});

/**
 * Preview of message reply
 */
export function MessageReplyPreview(props: Props) {
  return (
    <Base gap="md" align>
      <ReplyTo>
        <Trans>Replying to</Trans>
      </ReplyTo>
      <MessageReply message={props.message} noDecorations />
      <Row gap="lg" align>
        <Show when={!props.self}>
          <MentionToggle mention={props.mention} onClick={props.toggle}>
            <Symbol fontSize="1.25em !important">alternate_email</Symbol>
            <Switch fallback={<Trans>Off</Trans>}>
              <Match when={props.mention}>
                <Trans>On</Trans>
              </Match>
            </Switch>
          </MentionToggle>
        </Show>
        <Dismiss onClick={props.dismiss}>
          <Symbol fontSize="1.25em !important" fill>cancel</Symbol>
        </Dismiss>
      </Row>
    </Base>
  );
}
