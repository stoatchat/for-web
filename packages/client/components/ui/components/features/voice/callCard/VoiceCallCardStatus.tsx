import { Match, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

export function VoiceCallCardStatus() {
  const voice = useVoice();

  return (
    <Status status={voice.state()}>
      <Switch>
        <Match when={voice.state() === "CONNECTED"}>
          <Symbol>wifi_tethering</Symbol> <Trans>Connected</Trans>
        </Match>
        <Match when={voice.state() === "CONNECTING"}>
          <Symbol>wifi_tethering</Symbol> <Trans>Connecting</Trans>
        </Match>
        <Match when={voice.state() === "DISCONNECTED"}>
          <Symbol>wifi_tethering_error</Symbol> <Trans>Disconnected</Trans>
        </Match>
        <Match when={voice.state() === "RECONNECTING"}>
          <Symbol>wifi_tethering</Symbol> <Trans>Reconnecting</Trans>
        </Match>
      </Switch>
    </Status>
  );
}
const Status = styled("div", {
  base: {
    flexShrink: 0,
    gap: "var(--gap-md)",

    display: "flex",
    justifyContent: "center",
  },
  variants: {
    status: {
      READY: {},
      CONNECTED: {
        color: "var(--md-sys-color-primary)",
      },
      CONNECTING: {
        color: "var(--md-sys-color-outline)",
      },
      DISCONNECTED: {
        color: "var(--md-sys-color-outline)",
      },
      RECONNECTING: {
        color: "var(--md-sys-color-outline)",
      },
    },
  },
});
