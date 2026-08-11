import { Plural } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { iconSize } from "@revolt/ui/components/utils";

import MdClose from "@material-design-icons/svg/filled/close.svg?component-solid";

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
      <MdClose {...iconSize(16)} />{" "}
      <Plural
        value={props.count}
        one="# blocked message"
        other="# blocked messages"
      />
    </Base>
  );
}
