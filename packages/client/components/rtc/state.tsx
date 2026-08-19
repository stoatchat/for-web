import {
  Accessor,
  batch,
  createContext,
  createEffect,
  createSignal,
  JSX,
  Setter,
  useContext,
} from "solid-js";
import {
  isTrackReference,
  RoomContext,
  TrackReferenceOrPlaceholder,
  useTracks,
} from "solid-livekit-components";

import {
  LocalTrackPublication,
  RemoteTrackPublication,
  Room,
  ScreenSharePresets,
  Track,
} from "livekit-client";
import { Channel } from "stoat.js";

import { SoundController, useSound } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { ModalController, useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import {
  NoiseSuppresionState,
  ScreenShareQualityName,
  Voice as VoiceSettings,
} from "@revolt/state/stores/Voice";
import { VoiceCallCardContext } from "@revolt/ui/components/features/voice/callCard/VoiceCallCard";

import { Device, useDevice } from "@revolt/common";
import { InRoom } from "./components/InRoom";
import { RoomAudioManager } from "./components/RoomAudioManager";
import {
  SCREEN_SHARE_PRESET_GAMING,
  SCREEN_SHARE_PRESET_HIGH,
  ScreenShareProfile,
  screenSharePublishOptions,
  ScreenShareQuality,
} from "./screenShareProfile";
import { VoiceProcessor } from "./VoiceProcessor";

type State =
  | "READY"
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING";

class Voice {
  #settings: VoiceSettings;

  channel: Accessor<Channel | undefined>;
  #setChannel: Setter<Channel | undefined>;

  room: Accessor<Room | undefined>;
  #setRoom: Setter<Room | undefined>;

  vidTracks: Accessor<TrackReferenceOrPlaceholder[]>;

  state: Accessor<State>;
  #setState: Setter<State>;

  deafen: Accessor<boolean>;
  microphone: Accessor<boolean>;

  video: Accessor<boolean>;
  #setVideo: Setter<boolean>;

  screenshare: Accessor<boolean>;
  #setScreenshare: Setter<boolean>;

  fullscreen: Accessor<boolean>;
  #setFullscreen: Setter<boolean>;

  focusId: Accessor<string | undefined>;
  #setFocus: Setter<string | undefined>;

  showBar: Accessor<boolean>;
  #setShowBar: Setter<boolean>;

  videoOnlyFilter: Accessor<boolean>;
  #setVideoOnlyFilter: Setter<boolean>;

  private sound: SoundController;
  private device: Device;

  private openModal;
  private config;
  private limits;
  private screenShareTracks: Set<string>;
  private stoppedWatching: Set<string>;
  #stoppedWatchingEpoch: Accessor<number>;
  #setStoppedWatchingEpoch: Setter<number>;
  private voiceProcessor?: VoiceProcessor;

  constructor(
    voiceSettings: VoiceSettings,
    modals: ModalController,
    sound: SoundController,
    device: Device,
  ) {
    this.#settings = voiceSettings;
    this.sound = sound;
    this.device = device;

    const [channel, setChannel] = createSignal<Channel>();
    this.channel = channel;
    this.#setChannel = setChannel;

    const [room, setRoom] = createSignal<Room>();
    this.room = room;
    this.#setRoom = setRoom;

    this.vidTracks = () => [];

    const [state, setState] = createSignal<State>("READY");
    this.state = state;
    this.#setState = setState;

    this.deafen = () => voiceSettings.deafen;
    this.microphone = () => voiceSettings.micOn && !voiceSettings.deafen;

    const [video, setVideo] = createSignal(false);
    this.video = video;
    this.#setVideo = setVideo;

    const [screenshare, setScreenshare] = createSignal(false);
    this.screenshare = screenshare;
    this.#setScreenshare = setScreenshare;

    const [fullscreen, setFullscreen] = createSignal(false);
    this.fullscreen = fullscreen;
    this.#setFullscreen = setFullscreen;

    const [focus, setFocus] = createSignal<string>();
    this.focusId = focus;
    this.#setFocus = setFocus;

    const [showBar, setShowBar] = createSignal(true);
    this.showBar = showBar;
    this.#setShowBar = setShowBar;

    const [videoOnlyFilter, setVideoOnlyFilter] = createSignal(false);
    this.videoOnlyFilter = videoOnlyFilter;
    this.#setVideoOnlyFilter = setVideoOnlyFilter;

    const inst = useInstance();
    this.config = inst.config;
    this.limits = inst.limits;
    this.openModal = modals.openModal;

    this.screenShareTracks = new Set();
    this.stoppedWatching = new Set();
    const [stoppedWatchingEpoch, setStoppedWatchingEpoch] = createSignal(0);
    this.#stoppedWatchingEpoch = stoppedWatchingEpoch;
    this.#setStoppedWatchingEpoch = setStoppedWatchingEpoch;

    // Setup settings listeners
    this.settingsListeners();
  }

  // Dynamically set echo cancellation and gain control when the settings are changed
  // These functions are needed to maintain reactivity. Don't ask me why but if you make them not functions it breaks.
  private settingsListeners() {
    const getSettings = () => this.#settings;

    const setEchoCancellation = (echoCancellation: boolean) => {
      const track = this.getMicrophoneTrack()?.audioTrack;
      if (track) {
        track.constraints.echoCancellation = echoCancellation;
      }
    };

    const setAutoGainControl = (autoGainControl: boolean) => {
      const track = this.getMicrophoneTrack()?.audioTrack;
      if (track) {
        track.constraints.autoGainControl = autoGainControl;
      }
    };

    const setNoiseSuppression = (noiseSuppression: NoiseSuppresionState) => {
      const track = this.getMicrophoneTrack()?.audioTrack;
      if (track) {
        if (noiseSuppression === "browser") {
          track.constraints.noiseSuppression = true;
          //@ts-expect-error voiceIsolation is not yet standard, but it supported by livekit and most chromium based browsers, including electron.
          track.constraints.voiceIsolation = true;
        } else {
          track.constraints.noiseSuppression = false;
          //@ts-expect-error voiceIsolation is not yet standard, but it supported by livekit and most chromium based browsers, including electron.
          track.constraints.voiceIsolation = false;
        }
      }
    };

    const restartTrack = () => {
      const track = this.getMicrophoneTrack()?.audioTrack;
      if (track) {
        track.restartTrack();
      }
    };

    createEffect(() => {
      setEchoCancellation(getSettings().echoCancellation ?? true);
      setAutoGainControl(getSettings().autoGainControl ?? true);
      setNoiseSuppression(getSettings().noiseSupression ?? "browser");
      restartTrack();
    });
  }

  async connect(channel: Channel, auth?: { url: string; token: string }) {
    this.disconnect();

    this.device.setWakeLocked();

    const room = new Room({
      audioCaptureDefaults: {
        deviceId: this.#settings.preferredAudioInputDevice,
        echoCancellation: this.#settings.echoCancellation,
        noiseSuppression: this.#settings.noiseSupression === "browser",
        autoGainControl: this.#settings.autoGainControl,
        voiceIsolation: this.#settings.noiseSupression === "browser",
      },
      audioOutput: {
        deviceId: this.#settings.preferredAudioOutputDevice,
      },
      videoCaptureDefaults: {
        resolution: {
          width: 1280,
          height: 720,
          frameRate: 30,
        },
        deviceId: this.#settings.preferredVideoDevice,
      },
      publishDefaults: {
        screenShareSimulcastLayers: [],
        degradationPreference: "maintain-framerate",
      },
    });

    this.vidTracks = useTracks(
      [
        { source: Track.Source.Camera, withPlaceholder: true },
        { source: Track.Source.ScreenShare, withPlaceholder: false },
      ],
      { room, onlySubscribed: false },
    );

    batch(() => {
      this.#setRoom(room);
      this.#setChannel(channel);
      this.#setState("CONNECTING");
      this.#setVideo(false);
      this.#setScreenshare(false);
    });

    room.addListener("connected", () => {
      this.#setState("CONNECTED");
      if (this.speakingPermission)
        room.localParticipant
          .setMicrophoneEnabled(this.#settings.micOn)
          .then((track) => {
            this.#settings.micOn = track != null;
          });
      for (const p of room.remoteParticipants.values()) {
        const screenShareTrack = p.getTrackPublication(
          Track.Source.ScreenShare,
        );
        if (screenShareTrack) {
          this.screenShareTracks.add(screenShareTrack.trackSid);
        }
      }
      this.sound.playSound("userJoinVoice");
    });

    room.addListener("disconnected", () => this.#setState("DISCONNECTED"));

    room.addListener("localTrackPublished", (pub) => {
      if (pub.audioTrack && pub.audioTrack.source === Track.Source.Microphone) {
        if (!pub.audioTrack.getProcessor()) {
          pub.audioTrack?.setProcessor(
            (this.voiceProcessor = new VoiceProcessor(this.#settings)),
          );
        }
      }
    });

    room.addListener("participantConnected", () => {
      this.sound.playSound("userJoinVoice");
    });

    room.addListener("participantDisconnected", () => {
      this.sound.playSound("userLeaveVoice");
    });

    room.addListener("trackPublished", (pub) => {
      if (pub.source === Track.Source.ScreenShare) {
        pub.once("subscribed", (track) => {
          // Play the sound once playback starts, which might be quite a bit after subscription
          // as it starts paused for the screen share settings modal.
          track.once("videoPlaybackStarted", () => {
            this.sound.playSound("streamStart");
            if (track.sid) {
              this.screenShareTracks.add(track.sid);
            }
          });
        });
      }
    });

    room.addListener("trackUnpublished", (unpub) => {
      if (this.screenShareTracks.has(unpub.trackSid)) {
        this.sound.playSound("streamEnd");
        this.screenShareTracks.delete(unpub.trackSid);
      }
      if (unpub.source === Track.Source.ScreenShare) {
        this.stoppedWatching.delete(
          `${Track.Source.ScreenShare}_${unpub.participantSid}`,
        );
        this.#touchStoppedWatching();
      }
    });

    // Gather latency
    const selected = await Promise.any(
      this.config.features.livekit.nodes.map(async (node) => {
        return fetch(node.public_url.replace("wss", "https")).then(() => {
          return node.name;
        });
      }),
    );

    if (!auth) {
      auth = await channel.joinCall(selected);
    }

    await room.connect(auth.url, auth.token, {
      autoSubscribe: false,
    });
  }

  disconnect() {
    this.device.releaseWakeLock();
    try {
      const room = this.room();
      if (!room) return;

      room.removeAllListeners();
      room.disconnect();

      batch(() => {
        this.#setState("READY");
        this.#setRoom();
        this.#setChannel();
        this.#setFullscreen(false);
        this.#setVideoOnlyFilter(false);
        this.vidTracks = () => [];
      });

      this.screenShareTracks = new Set();
      this.stoppedWatching = new Set();
      this.#touchStoppedWatching();

      this.sound.playSound("userLeaveVoice");
    } catch (e) {
      this.onErr(e);
    }
  }

  async toggleDeafen(fromMute?: boolean) {
    try {
      const room = this.room();
      if (!room) throw "invalid state";
      await room.localParticipant.setMicrophoneEnabled(
        (this.#settings.micOn || !!fromMute) &&
          !room.localParticipant.isMicrophoneEnabled,
      );

      this.#settings.deafen = !this.#settings.deafen;
      if (fromMute) {
        this.#settings.micOn = room.localParticipant.isMicrophoneEnabled;
      }
      if (this.#settings.deafen) {
        this.sound.playSound("deafen");
      } else {
        this.sound.playSound("undeafen");
      }
    } catch (e) {
      this.onErr(e);
    }
  }

  async toggleMute() {
    if (this.#settings.deafen) {
      this.toggleDeafen(true);
      return;
    }
    try {
      const room = this.room();
      if (!room) throw "invalid state";
      await room.localParticipant.setMicrophoneEnabled(
        !room.localParticipant.isMicrophoneEnabled,
      );

      this.#settings.micOn = room.localParticipant.isMicrophoneEnabled;

      if (this.#settings.micOn) {
        this.sound.playSound("unmute");
      } else {
        this.sound.playSound("mute");
      }
    } catch (e) {
      this.onErr(e);
    }
  }

  async toggleCamera() {
    try {
      const room = this.room();
      if (!room) throw "invalid state";
      await room.localParticipant.setCameraEnabled(
        !room.localParticipant.isCameraEnabled,
      );

      this.#setVideo(room.localParticipant.isCameraEnabled);
    } catch (e) {
      this.onErr(e);
    }
  }

  /**
   * Get the enabled screen share qualities. "low" will always be enabled.
   * Each screen share quality is checked against the limit if the limit is available on the client.
   *
   * TODO: Translate the fullNames here, I can't figure out how to do it.
   *
   * @param name The name of the screen share quality to get
   * @returns A partial record of ScreenShareQualityName to ScreenShareQuality. Will always contain "low" quality.
   */
  getEnabledScreenShareQualities(): Partial<
    Record<ScreenShareQualityName, ScreenShareQuality>
  > {
    // Always enable low
    const qualities: Partial<
      Record<ScreenShareQualityName, ScreenShareQuality>
    > = {
      low: {
        name: "low",
        resolution: ScreenSharePresets.h720fps30.resolution,
        fullName: `720p 30FPS`,
        contentHint: "motion",
      },
    };

    const limit = this.limits().video_resolution;

    // TODO: Add more resolutions to stream from if they're enabled. May tie into premium users in the future?
    if (
      (limit[0] === 0 || limit[0] >= 1920) &&
      (limit[1] === 0 || limit[1] >= 1080)
    ) {
      qualities.high = {
        name: "high",
        resolution: SCREEN_SHARE_PRESET_HIGH.resolution,
        fullName: "1080p 60FPS",
        contentHint: "motion",
        encoding: SCREEN_SHARE_PRESET_HIGH.encoding,
      };
      qualities.gaming = {
        name: "gaming",
        resolution: SCREEN_SHARE_PRESET_GAMING.resolution,
        fullName: "1080p 60FPS Gaming",
        contentHint: "motion",
        encoding: SCREEN_SHARE_PRESET_GAMING.encoding,
      };
      const originalResolution = ScreenSharePresets.original.resolution;
      originalResolution.frameRate = 5;
      originalResolution.aspectRatio = 0;

      const limit = this.limits().video_resolution;
      originalResolution.width = limit[0];
      originalResolution.height = limit[1];
      // If both resolutions are limited, set aspect ratio
      if (originalResolution.height !== 0 && originalResolution.width !== 0) {
        originalResolution.aspectRatio =
          originalResolution.width / originalResolution.height;
      }

      qualities.text = {
        name: "text",
        resolution: originalResolution,
        fullName: `Source 5FPS`,
        contentHint: "text",
      };
    }

    return qualities;
  }

  #pickDesktopScreenShareProfile(
    qualities: Partial<Record<ScreenShareQualityName, ScreenShareQuality>>,
  ): Promise<ScreenShareProfile | null> {
    return new Promise((resolve) => {
      if (!window.native?.onceScreenPicker) {
        resolve(null);
        return;
      }

      window.native.onceScreenPicker((sources) => {
        this.openModal({
          type: "screen_share_picker",
          onCancel: () => {
            window.native.screenPickerCallback(-1, false);
            resolve(null);
          },
          callback: (
            idx: number,
            qualityName: ScreenShareQualityName,
            audio: boolean,
          ) => {
            if (idx < 0) {
              window.native.screenPickerCallback(-1, false);
              resolve(null);
              return;
            }

            const quality = qualities[qualityName] ?? qualities.low!;
            window.native.screenPickerCallback(idx, audio);
            resolve({
              quality: qualityName,
              resolution: quality.resolution,
              contentHint: quality.contentHint,
              encoding: quality.encoding,
              audio,
              sourceIdx: idx,
            });
          },
          sources,
          qualities: Object.keys(qualities).map((k) => {
            const v = qualities[k as ScreenShareQualityName]!;
            return { name: k, fullName: v.fullName };
          }),
        });
      });
    });
  }

  #screenShareAudioOptions() {
    return {
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false,
      voiceIsolation: false,
      restrictOwnAudio: true,
    };
  }

  async #applyScreenShareTrackQuality(
    quality: ScreenShareQuality,
    audio: boolean,
    screenAudioTrack: LocalTrackPublication | undefined,
  ) {
    const room = this.room();
    if (!room) return;

    const publication = room.localParticipant.getTrackPublication(
      Track.Source.ScreenShare,
    );
    const videoTrack = publication?.videoTrack;
    if (!videoTrack) return;

    await videoTrack.mediaStreamTrack.applyConstraints({
      frameRate: { max: quality.resolution.frameRate },
      width:
        quality.resolution.width === 0
          ? undefined
          : {
              ideal: quality.resolution.width,
              max: quality.resolution.width,
            },
      height:
        quality.resolution.height === 0
          ? undefined
          : {
              ideal: quality.resolution.height,
              max: quality.resolution.height,
            },
    });
    videoTrack.mediaStreamTrack.contentHint = quality.contentHint;
    if (!audio && screenAudioTrack?.track) {
      room.localParticipant.unpublishTrack(screenAudioTrack.track);
    }
    this.sound.playSound("streamStart");
  }

  async toggleScreenshare() {
    const room = this.room();
    if (!room) throw "invalid state";

    if (this.screenshare()) {
      await room.localParticipant.setScreenShareEnabled(false);

      this.#setScreenshare(room.localParticipant.isScreenShareEnabled);

      this.sound.playSound("streamEnd");
    } else {
      const qualities = this.getEnabledScreenShareQualities();
      const isDesktop = !!window.native?.onceScreenPicker;

      try {
        let captureQuality =
          qualities[this.#settings.screenShareQuality || "low"] ??
          qualities.low!;

        if (isDesktop) {
          const profilePromise = this.#pickDesktopScreenShareProfile(qualities);
          captureQuality = qualities.gaming ?? qualities.high ?? qualities.low!;

          const [pickedProfile, localTrack] = await Promise.all([
            profilePromise,
            room.localParticipant.setScreenShareEnabled(
              true,
              {
                resolution: captureQuality.resolution,
                contentHint: captureQuality.contentHint,
                audio: this.#screenShareAudioOptions(),
              },
              screenSharePublishOptions(captureQuality.encoding),
            ),
          ]);

          const profile = pickedProfile;
          if (!profile) {
            await room.localParticipant.setScreenShareEnabled(false);
            this.#setScreenshare(room.localParticipant.isScreenShareEnabled);
            return;
          }

          const selectedQuality = qualities[profile.quality] ?? qualities.low!;
          this.#setScreenshare(room.localParticipant.isScreenShareEnabled);

          if (localTrack) {
            localTrack.on("ended", () => {
              this.toggleScreenshare();
              const oldAudioTrack = room.localParticipant.getTrackPublication(
                Track.Source.ScreenShareAudio,
              );
              if (oldAudioTrack?.track) {
                room.localParticipant.unpublishTrack(oldAudioTrack.track);
              }
            });

            const screenAudioTrack = room.localParticipant.getTrackPublication(
              Track.Source.ScreenShareAudio,
            );

            if (profile.quality !== captureQuality.name) {
              await this.#applyScreenShareTrackQuality(
                selectedQuality,
                profile.audio,
                screenAudioTrack,
              );
            } else if (localTrack.videoTrack) {
              localTrack.videoTrack.mediaStreamTrack.contentHint =
                selectedQuality.contentHint;
              if (!profile.audio && screenAudioTrack?.track) {
                room.localParticipant.unpublishTrack(screenAudioTrack.track);
              }
              this.sound.playSound("streamStart");
            }
          }
          return;
        }

        const localTrack = await room.localParticipant.setScreenShareEnabled(
          true,
          {
            resolution: captureQuality.resolution,
            contentHint: captureQuality.contentHint,
            audio: this.#screenShareAudioOptions(),
          },
          screenSharePublishOptions(captureQuality.encoding),
        );

        const screenAudioTrack = room.localParticipant.getTrackPublication(
          Track.Source.ScreenShareAudio,
        );

        this.#setScreenshare(room.localParticipant.isScreenShareEnabled);

        if (localTrack) {
          localTrack.on("ended", () => {
            this.toggleScreenshare();
            const oldAudioTrack = room.localParticipant.getTrackPublication(
              Track.Source.ScreenShareAudio,
            );
            if (oldAudioTrack?.track) {
              room.localParticipant.unpublishTrack(oldAudioTrack.track);
            }
          });

          const callback = async (
            qualityName: ScreenShareQualityName,
            audio: boolean,
          ) => {
            const quality = qualities[qualityName] || qualities.low!;
            await this.#applyScreenShareTrackQuality(
              quality,
              audio,
              screenAudioTrack,
            );
          };

          if (this.#settings.screenShareQualityAsk) {
            if (Object.keys(qualities).length > 1) {
              localTrack.pauseUpstream();
              screenAudioTrack?.pauseUpstream();
              this.openModal({
                onCancel: async () => {
                  await room.localParticipant.setScreenShareEnabled(false);
                  this.#setScreenshare(
                    room.localParticipant.isScreenShareEnabled,
                  );
                },
                type: "screen_share_settings",
                trackReference: {
                  participant: room.localParticipant,
                  publication: localTrack,
                  source: Track.Source.ScreenShare,
                },
                qualities: Object.keys(qualities).map((k) => {
                  const v = qualities[k as ScreenShareQualityName]!;
                  return { name: k, fullName: v.fullName };
                }),
                audio: !!screenAudioTrack,
                callback: async (qualityName, audio) => {
                  await callback(qualityName, audio);
                  localTrack.resumeUpstream();
                  if (audio) {
                    screenAudioTrack?.resumeUpstream();
                  }
                },
              });
            } else {
              await callback(
                this.#settings.screenShareQuality || "low",
                this.#settings.screenShareAudio,
              );
            }
          }
        }
      } catch (e) {
        this.onErr(e);
      }
    }
  }

  toggleFullscreen(fullscreen: boolean = !this.fullscreen()) {
    this.#setFullscreen(fullscreen);
  }

  trackId(t: TrackReferenceOrPlaceholder) {
    return `${t.source}_${t.participant.sid}`;
  }

  toggleFocus(t?: TrackReferenceOrPlaceholder) {
    const id = t ? this.trackId(t) : undefined;
    this.#setFocus(
      this.focusId() === id || this.visibleVidTracks().length < 2
        ? undefined
        : id,
    );
  }

  toggleVideoOnlyFilter() {
    this.#setVideoOnlyFilter((on) => !on);
    const focus = this.focusTrack();
    if (focus && !this.hasActiveVideo(focus)) {
      this.#setFocus(undefined);
    }
  }

  hasActiveVideo(t: TrackReferenceOrPlaceholder) {
    if (!isTrackReference(t)) return false;
    const pub = t.publication;
    return !!pub && !pub.isMuted && pub.kind === "video";
  }

  visibleVidTracks() {
    const tracks = this.vidTracks();
    if (!this.videoOnlyFilter()) return tracks;
    return tracks.filter((t) => this.hasActiveVideo(t));
  }

  isFocus(t: TrackReferenceOrPlaceholder) {
    return this.trackId(t) === this.focusId();
  }

  focusTrack() {
    const id = this.focusId();
    return id
      ? this.vidTracks().find((t) => this.trackId(t) === id)
      : undefined;
  }

  toggleShowBar() {
    this.#setShowBar((s) => !s);
  }

  #touchStoppedWatching() {
    this.#setStoppedWatchingEpoch((n) => n + 1);
  }

  isWatchingStopped(t: TrackReferenceOrPlaceholder) {
    this.#stoppedWatchingEpoch();
    return this.stoppedWatching.has(this.trackId(t));
  }

  stoppedScreenShareTrack() {
    this.#stoppedWatchingEpoch();
    return this.visibleVidTracks().find(
      (t) =>
        t.source === Track.Source.ScreenShare &&
        this.stoppedWatching.has(this.trackId(t)),
    );
  }

  #setScreenShareSubscribed(
    track: TrackReferenceOrPlaceholder,
    subscribed: boolean,
  ) {
    const publication = track.publication;
    if (!(publication instanceof RemoteTrackPublication)) return;

    publication.setSubscribed(subscribed);

    const audioPublication = track.participant.getTrackPublication(
      Track.Source.ScreenShareAudio,
    );
    if (audioPublication instanceof RemoteTrackPublication) {
      audioPublication.setSubscribed(subscribed);
    }
  }

  resumeWatching(t: TrackReferenceOrPlaceholder) {
    if (t.source !== Track.Source.ScreenShare) return;
    this.stoppedWatching.delete(this.trackId(t));
    this.#touchStoppedWatching();
    this.#setScreenShareSubscribed(t, true);
  }

  stopWatchingLive(t?: TrackReferenceOrPlaceholder) {
    const track = t ?? this.focusTrack();
    if (!track || track.source !== Track.Source.ScreenShare) return;

    this.stoppedWatching.add(this.trackId(track));
    this.#touchStoppedWatching();
    this.#setScreenShareSubscribed(track, false);

    if (this.isFocus(track)) {
      this.toggleFocus();
    }
  }

  getConnectedUser(userId: string) {
    return this.room()?.getParticipantByIdentity(userId);
  }

  showCard(channel: Channel) {
    return (
      channel.isVoice &&
      (this.channel()?.id === channel.id ||
        channel.type === "TextChannel" ||
        !!channel.voiceParticipants.size)
    );
  }

  getMicrophoneTrack(): LocalTrackPublication | undefined {
    const track = this.room()?.localParticipant.getTrackPublication(
      Track.Source.Microphone,
    );
    return track;
  }

  get listenPermission() {
    return !!this.channel()?.havePermission("Listen");
  }

  get speakingPermission() {
    return !!this.channel()?.havePermission("Speak");
  }

  private onErr(e: unknown) {
    if ((e as Error).name !== "NotAllowedError")
      this.openModal({ type: "error2", error: e });
  }
}

const voiceContext = createContext<Voice>(null as unknown as Voice);

/**
 * Mount global voice context and room audio manager
 */
export function VoiceContext(props: { children: JSX.Element }) {
  const state = useState();
  const modals = useModals();
  const sound = useSound();
  const device = useDevice();
  const voice = new Voice(state.voice, modals, sound, device);

  return (
    <voiceContext.Provider value={voice}>
      <RoomContext.Provider value={voice.room}>
        <VoiceCallCardContext>{props.children}</VoiceCallCardContext>
        <InRoom>
          <RoomAudioManager />
        </InRoom>
      </RoomContext.Provider>
    </voiceContext.Provider>
  );
}

export const useVoice = () => useContext(voiceContext);
