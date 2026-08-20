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
    console.info("[rtc] filtered tracks", filteredTracks());
    for (const track of tracks) {
      const publication = track.publication as RemoteTrackPublication;
      const stopStreamAudio =
        isScreenShareAudioSource(track.source) &&
        voice.isScreenShareWatchingStopped(track.participant.sid);
      publication.setSubscribed(!stopStreamAudio);
      console.info(track.publication);
    }
  });

  return (
    <div style={{ display: "none" }}>
      <Key each={filteredTracks()} by={(item) => getTrackReferenceId(item)}>
        {(track) => {
          const t = track();
          const streamAudio = isScreenShareAudioSource(t.source);
          const watchingStopped =
            streamAudio &&
            voice.isScreenShareWatchingStopped(t.participant.sid);
          const perTrackMuted = streamAudio
            ? state.voice.getScreenShareMuted(t.participant.identity)
            : state.voice.getUserMuted(t.participant.identity);

          return (
            <AudioTrack
              trackRef={t}
              volume={
                state.voice.outputVolume *
                (streamAudio
                  ? state.voice.getScreenShareVolume(t.participant.identity)
                  : state.voice.getUserVolume(t.participant.identity))
              }
              muted={
                watchingStopped ||
                perTrackMuted ||
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
