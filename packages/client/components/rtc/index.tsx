import {
  Accessor,
  JSX,
  Setter,
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import {
  AudioTrack,
  RoomContext,
  useMaybeRoomContext,
  useTracks,
} from "solid-livekit-components";

import { getTrackReferenceId, isLocal } from "@livekit/components-core";
import { Key } from "@solid-primitives/keyed";
import type { RemoteTrackPublication } from "livekit-client";
import { Room, Track } from "livekit-client";

type State =
  | "READY"
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING";

class Voice {
  roomId: Accessor<string | undefined>;
  #setRoomId: Setter<string | undefined>;

  room: Accessor<Room | undefined>;
  #setRoom: Setter<Room | undefined>;

  state: Accessor<State>;
  #setState: Setter<State>;

  microphone: Accessor<boolean>;
  #setMicrophone: Setter<boolean>;

  video: Accessor<boolean>;
  #setVideo: Setter<boolean>;

  screenshare: Accessor<boolean>;
  #setScreenshare: Setter<boolean>;

  constructor() {
    const [roomId, setRoomId] = createSignal<string>();
    this.roomId = roomId;
    this.#setRoomId = setRoomId;

    const [room, setRoom] = createSignal<Room>();
    this.room = room;
    this.#setRoom = setRoom;

    const [state, setState] = createSignal<State>("READY");
    this.state = state;
    this.#setState = setState;

    const [microphone, setMicrophone] = createSignal(false);
    this.microphone = microphone;
    this.#setMicrophone = setMicrophone;

    const [video, setVideo] = createSignal(false);
    this.video = video;
    this.#setVideo = setVideo;

    const [screenshare, setScreenshare] = createSignal(false);
    this.screenshare = screenshare;
    this.#setScreenshare = setScreenshare;
  }

  async connect(url: string, token: string, roomId: string) {
    if (this.room()) throw "room already exists";

    const room = new Room();
    this.#setRoom(room);
    this.#setRoomId(roomId);
    this.#setState("CONNECTING");
    room.addListener("connected", () => this.#setState("CONNECTED"));
    room.addListener("disconnected", () => this.#setState("DISCONNECTED"));

    await room.connect(url, token);
  }

  disconnect() {
    const room = this.room();
    if (!room) throw "no room";
    room.disconnect();
    room.removeAllListeners();
    this.#setState("READY");
    this.#setRoom(undefined);
    this.#setRoomId(undefined);
  }

  async toggleMute() {
    const room = this.room();
    if (!room) throw "invalid state";
    await room.localParticipant.setMicrophoneEnabled(
      !room.localParticipant.isMicrophoneEnabled,
    );

    this.#setMicrophone(room.localParticipant.isMicrophoneEnabled);
  }

  async toggleCamera() {
    const room = this.room();
    if (!room) throw "invalid state";
    await room.localParticipant.setCameraEnabled(
      !room.localParticipant.isCameraEnabled,
    );

    this.#setVideo(room.localParticipant.isCameraEnabled);
  }

  async toggleScreenshare() {
    const room = this.room();
    if (!room) throw "invalid state";
    await room.localParticipant.setScreenShareEnabled(
      !room.localParticipant.isScreenShareEnabled,
    );

    this.#setScreenshare(room.localParticipant.isScreenShareEnabled);
  }
}

const voiceContext = createContext<Voice>(null as unknown as Voice);

export function RoomAudioManager() {
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
    console.info("filtered tracks", filteredTracks());
    for (const track of filteredTracks()) {
      (track.publication as RemoteTrackPublication).setSubscribed(true);
    }
  });

  return (
    <div style={{ display: "none" }}>
      <Key each={filteredTracks()} by={(item) => getTrackReferenceId(item)}>
        {(track) => <AudioTrack trackRef={track()} volume={1} muted={false} />}
      </Key>
    </div>
  );
}

export function VoiceContext(props: { children: JSX.Element }) {
  const voice = new Voice();

  return (
    <voiceContext.Provider value={voice}>
      <RoomContext.Provider value={voice.room}>
        {props.children}
        <InRoom>
          <RoomAudioManager />
        </InRoom>
      </RoomContext.Provider>
    </voiceContext.Provider>
  );
}

export function InRoom(props: { children: JSX.Element }) {
  const room = useMaybeRoomContext();

  return <Show when={room?.()}>{props.children}</Show>;
}

export const useVoice = () => useContext(voiceContext);
