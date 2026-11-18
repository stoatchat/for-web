import { Plural } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Symbol } from "@revolt/ui/components/utils";

import { Ripple } from "../../../design";

/**
 * Base styles
 */
const Base = styled("div", {
  base: {
    position: "relative",

    display: "flex",
    alignItems: "center",

    gap: "var(--gap-s)",
    marginTop: "var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",
    padding: "var(--gap-sm) var(--gap-xxl)",

    fontSize: "0.8em" /* TODO should be in typography */,
    color: "var(--md-sys-color-outline)",
    fill: "var(--md-sys-color-outline)",
  },
});

interface Props {
  /**
   * Number of blocked messages
   */
  count: number;
}

/**
 * Generic message divider
 */
export function BlockedMessage(props: Props) {
  return (
    <Base>
      <Ripple />
      <Symbol size={16}>close</Symbol>{" "}
      <Plural
        value={props.count}
        one="# blocked message"
        other="# blocked messages"
      />
    </Base>
  );
}
