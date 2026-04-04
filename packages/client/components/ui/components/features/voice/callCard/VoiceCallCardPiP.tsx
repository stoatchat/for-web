import { Show } from "solid-js";
import {
  TrackLoop,
  useEnsureParticipant,
  useIsMuted,
  useIsSpeaking,
  useTracks,
} from "solid-livekit-components";

import { Track } from "livekit-client";
import { styled } from "styled-system/jsx";

import { useUser } from "@revolt/markdown/users";
import { Avatar } from "@revolt/ui/components/design";
import { Row } from "@revolt/ui/components/layout";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { VoiceCallCardActions } from "./VoiceCallCardActions";
import { VoiceCallCardStatus } from "./VoiceCallCardStatus";

export function VoiceCallCardPiP() {
  const audTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  return (
    <MiniCard>
      <VoiceCallCardStatus pip />
      <Row align justify grow wrap>
        <TrackLoop tracks={audTracks}>{() => <ConnectedUser />}</TrackLoop>
      </Row>
      <VoiceCallCardActions size="xs" />
    </MiniCard>
  );
}

function ConnectedUser() {
  const participant = useEnsureParticipant();

  const isMuted = useIsMuted({
    participant,
    source: Track.Source.Microphone,
  });

  const isSpeaking = useIsSpeaking(participant);
  const user = useUser(participant.identity);

  return (
    <UserIcon speaking={isSpeaking()}>
      <Avatar size={24} src={user().avatar} fallback={user().username} />
      <Show when={isMuted()}>
        <Symbol>mic_off</Symbol>
      </Show>
    </UserIcon>
  );
}

const UserIcon = styled("div", {
  base: {
    display: "grid",
    width: "24px",
    height: "24px",
    color: "#fffb",

    "& *": {
      gridArea: "1/1",
    },
  },
  variants: {
    speaking: {
      true: {
        "& svg": {
          outlineOffset: "1px",
          outline: "2px solid var(--md-sys-color-primary)",
          borderRadius: "var(--borderRadius-circle)",
        },
      },
    },
  },
});

const MiniCard = styled("div", {
  base: {
    userSelect: "none",

    pointerEvents: "all",
    width: "100%",
    height: "100%",

    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "end",

    gap: "var(--gap-md)",
    padding: "var(--gap-md)",

    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-secondary-container)",
  },
});
