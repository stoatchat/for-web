import { Show, createSignal } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Text } from "../design";

interface Props {
  contentType?: "Image" | "Video";
}

const Base = styled("div", {
  base: {
    zIndex: 1,

    cursor: "pointer",
    backdropFilter: "brightness(0.2) contrast(0.8) blur(24px)",

    display: "grid",
    placeItems: "center",

    "& span": {
      padding: "0.6em",
      fontWeight: 600,
      userSelect: "none",
      boxShadow: "0 0 8px #00000044",
      borderRadius: "var(--borderRadius-lg)",

      color: "var(--md-sys-color-inverse-on-surface)",
      background: "var(--md-sys-color-inverse-surface)",
    },
  },
});

/**
 * Spoiler Element
 */
export function Spoiler(props: Props) {
  const [shown, setShown] = createSignal(true);

  return (
    <Show when={shown()}>
      <Base
        class={`Spoiler ${props.contentType}`}
        onClick={() => setShown(false)}
      >
        <Text>
          <Trans>Click to show spoiler</Trans>
        </Text>
      </Base>
    </Show>
  );
}
