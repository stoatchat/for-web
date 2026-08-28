import { Trans } from "@lingui/solid/macro";
import { css } from "styled-system/css";

import { iconSize } from "@revolt/ui";

import MdArrowForward from "@material-design-icons/svg/filled/arrow_forward.svg?component-solid";

import { Ripple } from "../../../../components/design";
import { FloatingIndicator } from "./FloatingIndicator";

interface Props {
  /**
   * Jump back to present messages
   */
  onClick: () => void;
}

const indStyle = css({ marginBottom: "var(--gap-md)" });

/**
 * Component indicating user can jump back to present messages
 */
export function JumpToBottom(props: Props) {
  return (
    <FloatingIndicator
      position="bottom"
      class={indStyle}
      onClick={props.onClick}
    >
      <Ripple />
      <span style={{ "flex-grow": 1 }}>
        <Trans>Viewing older messages</Trans>
      </span>
      <span>
        <Trans>Jump to present</Trans>
      </span>
      <MdArrowForward {...iconSize(16)} />
    </FloatingIndicator>
  );
}
