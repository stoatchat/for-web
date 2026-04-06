import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

export function VoiceCallCardStatus() {
  const voice = useVoice();

  const symbol = () => {
    switch (voice.state()) {
      case "CONNECTED":
        return "wifi_tethering";
      case "CONNECTING":
        return "wifi_tethering";
      case "DISCONNECTED":
        return "wifi_tethering_error";
      case "RECONNECTING":
        return "wifi_tethering";
      default:
        return "";
    }
  };

  const text = () => {
    switch (voice.state()) {
      case "CONNECTED":
        return <Trans>Connected</Trans>;
      case "CONNECTING":
        return <Trans>Connecting</Trans>;
      case "DISCONNECTED":
        return <Trans>Disconnected</Trans>;
      case "RECONNECTING":
        return <Trans>Reconnecting</Trans>;
      default:
        return null;
    }
  };

  return (
    <Status status={voice.state()}>
      <Symbol>{symbol()}</Symbol>{" "}
      <FadeOut fade={voice.state() === "CONNECTED"}>{text()}</FadeOut>
    </Status>
  );
}

const FadeOut = styled("div", {
  base: {
    paddingLeft: "var(--gap-md)",
  },
  variants: {
    fade: {
      true: {
        opacity: 0,
        fontSize: 0,
        paddingLeft: 0,
        transition:
          "opacity .3s 5s ease, font-size .3s 6s, padding-left .3s 6s",
      },
    },
  },
});

const Status = styled("div", {
  base: {
    flexShrink: 0,

    display: "flex",
    justifyContent: "center",

    _hover: {
      "& div": {
        opacity: 1,
        fontSize: "inherit",
        paddingLeft: "var(--gap-md)",
        transition: "opacity 0s 0s, font-size 0s 0s, padding-left 0s 0s",
      },
    },
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
