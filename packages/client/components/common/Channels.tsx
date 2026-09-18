import { Match, Show, Switch } from "solid-js";

import type { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useVoice } from "@revolt/rtc";
import { Avatar, UserStatus } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

const TEXT_SIDEBAR = "grid_3x3",
  TEXT_MENTION = "tag",
  VOICE = "headset_mic";

/**
 * Returns the icon for a given channel
 * @param context - defaults to sidebar, use "mention" for mention icon
 */
export const getChannelIcon = (
  channel?: Channel,
  context?: "sidebar" | "mention",
) =>
  channel?.isVoice
    ? VOICE
    : context === "mention"
      ? TEXT_MENTION
      : TEXT_SIDEBAR;

/**
 * Create an icon /w status for Channel, Group, or DM
 */
export function ChannelIcon(props: { channel: Channel }) {
  const voice = useVoice();
  const inCall = () => props.channel.id === voice.channel()?.id;

  return (
    <Switch
      fallback={
        <>
          <Icon
            channel={props.channel}
            symbol={getChannelIcon(props.channel)}
            special={props.channel.mature ? "warning" : undefined}
            color={inCall() ? "var(--md-sys-color-primary)" : undefined}
          />
          <Show when={props.channel.icon}>
            <CustomIcon
              src={props.channel.iconURL}
              css={{ marginEnd: ".2em" }}
            />
          </Show>
        </>
      }
    >
      <Match when={props.channel.type === "Group"}>
        <Avatar
          size={32}
          shape="rounded-square"
          fallback={props.channel.name}
          src={props.channel.iconURL}
          primaryContrast
        />
      </Match>
      <Match when={props.channel.type === "DirectMessage"}>
        <Avatar
          size={32}
          src={props.channel.iconURL}
          holepunch="bottom-right"
          overlay={
            <UserStatus.Graphic status={props.channel?.recipient?.presence} />
          }
        />
      </Match>
    </Switch>
  );
}

function Icon(props: {
  channel: Channel;
  symbol: string;
  special?: string;
  color?: string;
}) {
  const maskId = "_m" + Date.now();
  return (
    <Show
      when={props.special}
      fallback={<Symbol color={props.color}>{props.symbol}</Symbol>}
    >
      <svg viewBox="0 0 24 24" width="24" height="24">
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="#fff" />
          <text {...warnProps} stroke="#000" stroke-width="3" color="#000">
            {props.special}
          </text>
        </mask>
        <text
          class={"material-symbols-outlined"}
          style={{
            "font-variation-settings": '"FILL" 0, "wght" 400, "GRAD" 0',
            color: props.color,
          }}
          x="0"
          y="24"
          mask={`url(#${maskId})`}
        >
          {props.symbol}
        </text>
        <text {...warnProps} color={props.color}>
          {props.special}
        </text>
      </svg>
    </Show>
  );
}

const warnProps = {
  class: "material-symbols-rounded",
  style: {
    "font-variation-settings": '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
    "font-size": "10px",
  },
  x: 13,
  y: 10,
};

const CustomIcon = styled("img", {
  base: {
    width: "16px",
    height: "16px",
    objectFit: "contain",
  },
});
