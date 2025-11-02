import { For, Show } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useUsers } from "@revolt/markdown/users";
import { useVoice } from "@revolt/rtc";
import { Avatar, Ripple, Text } from "@revolt/ui/components/design";
import { Row } from "@revolt/ui/components/layout";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Call card (preview)
 */
export function VoiceCallCardPreview(props: { channel: Channel }) {
  const voice = useVoice();
  const { t } = useLingui();

  const ids = () => [...props.channel.voiceParticipants.keys()];
  const users = useUsers(ids);

  function subtext() {
    const names = users()
      .map((user) => user?.username)
      .filter((x) => x);

    return names.length ? t`With ${names.join(", ")}` : t`Start the call`;
  }

  return (
    <Preview onClick={() => voice.connect(props.channel)}>
      <Ripple />
      <Row>
        <For each={users()} fallback={<Symbol size={24}>voice_chat</Symbol>}>
          {(user) => (
            <Avatar size={24} src={user?.avatar} fallback={user?.username} />
          )}
        </For>
      </Row>
      <Text class="title" size="large">
        <Show
          when={voice.state() === "READY"}
          fallback={<Trans>Switch to this voice channel</Trans>}
        >
          <Trans>Join the voice channel</Trans>
        </Show>
      </Text>
      <Text class="body">{subtext()}</Text>
    </Preview>
  );
}

const Preview = styled("div", {
  base: {
    position: "relative", // <Ripple />
    borderRadius: "var(--borderRadius-lg)",

    height: "100%",
    justifyContent: "center",

    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    padding: "var(--gap-lg)",

    color: "var(--md-sys-color-on-surface)",
  },
});
