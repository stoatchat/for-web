import { splitProps } from "solid-js";

import { typography } from "../../design/Text";
import { ColouredText } from "../../utils/ColouredText";
import { useState } from "@revolt/state";
type Props = {
  /**
   * Username
   */
  username?: string;
  /**
   * User ID
   */
  userId?: string;
  /**
   * Text colour
   */
  colour?: string;
};

/**
 * Username
 *
 */
export function Username(props: Props) {
  const [local, remote] = splitProps(props, ["username", "colour", "userId"]);
  const state = useState();

  return (
    <span
      {...remote}
      class={typography({ class: "label", size: "large" })}
      style={{ cursor: "pointer", "user-select": "none" }}
      on:pointerdown={(e) => {
        if (e.shiftKey) {
          e.stopPropagation();
        }
      }}
      on:click={(e) => {
        if (e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();

          if (local.userId) {
            const mentionText = `<@${local.userId}> `;

            if (typeof state.draft._appendMention === "function") {
              state.draft._appendMention(mentionText);
            }
          }
        }
      }}
    >
      <ColouredText colour={local.colour!}>{local.username}</ColouredText>
    </span>
  );
}
