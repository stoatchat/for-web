import { createEffect, createMemo } from "solid-js";
import { AudioTrack, useTracks } from "solid-livekit-components";

import { getTrackReferenceId, isLocal } from "@livekit/components-core";
import { Key } from "@solid-primitives/keyed";
import { RemoteTrackPublication, Track } from "livekit-client";

import { useState } from "@revolt/state";

import { useVoice } from "../state";

function isScreenShareAudioSource(source: Track.Source) {
  return source === Track.Source.ScreenShareAudio;
}

export function RoomAudioManager() {
  const voice = useVoice();
  const state = useState();

  const tracks = useTracks(
    [
      Track.Source.Microphone,
      Track.Source.ScreenShareAudio,
      Track.Source.Unknown,
    ],
    {
      updateOnlyOn: [],
      onlySubscribed: false,
    },
  );

  const filteredTracks = createMemo(() =>
    tracks().filter(
      (track) =>
        !isLocal(track.participant) &&
        track.publication.kind === Track.Kind.Audio,
    ),
  );

  createEffect(() => {
    const tracks = filteredTracks();
    for (const track of tracks) {
      const publication = track.publication as RemoteTrackPublication;
      if (isScreenShareAudioSource(track.source)) {
        const shouldSubscribe = !voice.isScreenShareWatchingStopped(
          track.participant.sid,
        );
        if (publication.isSubscribed !== shouldSubscribe) {
          publication.setSubscribed(shouldSubscribe);
        }
      } else if (!publication.isSubscribed) {
        publication.setSubscribed(true);
      }
    }
  });

  return (
    <div style={{ display: "none" }}>
      <Key each={filteredTracks()} by={(item) => getTrackReferenceId(item)}>
        {(track) => {
          // Solid components run once — keep mute/volume reads inside JSX so
          // store + stop-watching updates reach AudioTrack (setEnabled / setVolume).
          const t = track();
          const streamAudio = isScreenShareAudioSource(t.source);
          const identity = t.participant.identity;
          const participantSid = t.participant.sid;

          return (
            <AudioTrack
              trackRef={t}
              volume={
                state.voice.outputVolume *
                (streamAudio
                  ? state.voice.getScreenShareVolume(identity)
                  : state.voice.getUserVolume(identity))
              }
              muted={
                (streamAudio &&
                  voice.isScreenShareWatchingStopped(participantSid)) ||
                (streamAudio
                  ? state.voice.getScreenShareMuted(identity)
                  : state.voice.getUserMuted(identity)) ||
                (!streamAudio && voice.deafen())
              }
              enableBoosting
            />
          );
        }}
      </Key>
    </div>
  );
}
