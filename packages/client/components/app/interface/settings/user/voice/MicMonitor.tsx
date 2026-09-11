import { createSignal, onCleanup, onMount } from "solid-js";
import { styled } from "styled-system/jsx";

import { Track } from "livekit-client";

import { Trans } from "@lingui/solid/macro";

import { useModals } from "@revolt/modal";
import { VoiceProcessor } from "@revolt/rtc/VoiceProcessor";
import { useState } from "@revolt/state";
import {
  MIC_SENSITIVITY_MAX_DB,
  MIC_SENSITIVITY_MIN_DB,
} from "@revolt/state/stores/Voice";
import { CategoryButton, Column, Slider, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

const METER_FLOOR_DB = MIC_SENSITIVITY_MIN_DB;

/** Maps a dBFS value onto a 0-100% position for the meter/threshold marker. */
function levelToPercent(db: number) {
  const clamped = Math.min(0, Math.max(METER_FLOOR_DB, db));
  return ((clamped - METER_FLOOR_DB) / (0 - METER_FLOOR_DB)) * 100;
}

const MeterTrack = styled("div", {
  base: {
    position: "relative",
    height: "8px",
    borderRadius: "var(--borderRadius-circle)",
    background: "var(--md-sys-color-surface-container-highest)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    overflow: "hidden",
    marginBlock: "var(--gap-sm)",
  },
});

const Fill = styled("div", {
  base: {
    position: "absolute",
    inset: "0 auto 0 0",
    borderRadius: "inherit",
    transition: "width 0.05s linear, background-color 0.1s ease",
  },
});

const ThresholdMarker = styled("div", {
  base: {
    position: "absolute",
    top: "-2px",
    bottom: "-2px",
    width: "2px",
    background: "var(--md-sys-color-on-surface)",
  },
});

/**
 * Live input level meter + voice-activity sensitivity slider, plus a toggle
 * to hear the processed mic played back - all sharing one open microphone,
 * matching Discord's Voice & Video settings behaviour.
 */
export function MicMonitor() {
  const { voice } = useState();
  const modals = useModals();

  const [level, setLevel] = createSignal(METER_FLOOR_DB);
  const [gateOpen, setGateOpen] = createSignal(false);
  const [ready, setReady] = createSignal(false);
  const [playingBack, setPlayingBack] = createSignal(false);

  let stream: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let processor: VoiceProcessor | undefined;
  let audioEl: HTMLAudioElement | undefined;
  let pollId: ReturnType<typeof setInterval> | undefined;

  const stopPlayback = () => {
    setPlayingBack(false);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
    }
  };

  const startPlayback = async () => {
    if (!processor?.processedTrack || !audioEl) return;

    audioEl.srcObject = new MediaStream([processor.processedTrack]);

    const sinkId = voice.preferredAudioOutputDevice;
    if (sinkId && "setSinkId" in audioEl) {
      await (
        audioEl as HTMLAudioElement & {
          setSinkId(id: string): Promise<void>;
        }
      ).setSinkId(sinkId);
    }

    await audioEl.play();
    setPlayingBack(true);
  };

  const stopMonitor = async () => {
    clearInterval(pollId);
    pollId = undefined;

    stopPlayback();

    const proc = processor;
    processor = undefined;
    await proc?.destroy();

    stream?.getTracks().forEach((t) => t.stop());
    stream = undefined;

    const ctx = audioContext;
    audioContext = undefined;
    await ctx?.close();

    setReady(false);
  };

  const startMonitor = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: voice.preferredAudioInputDevice,
          echoCancellation: voice.echoCancellation,
          noiseSuppression: voice.noiseSupression === "browser",
          autoGainControl: voice.autoGainControl,
        },
      });

      audioContext = new AudioContext();
      processor = new VoiceProcessor(voice);

      await processor.init({
        kind: Track.Kind.Audio,
        track: stream.getAudioTracks()[0],
        audioContext,
      });

      if (!audioEl) {
        audioEl = new Audio();
      }

      pollId = setInterval(() => {
        setLevel(processor?.getCurrentLevelDb() ?? METER_FLOOR_DB);
        setGateOpen(processor?.isGateOpen() ?? false);
      }, 50);

      setReady(true);
    } catch (err) {
      await stopMonitor();
      if ((err as Error).name !== "NotAllowedError") {
        modals.openModal({ type: "error2", error: err });
      }
    }
  };

  onMount(() => {
    startMonitor();
  });

  onCleanup(() => {
    stopMonitor();
  });

  return (
    <Column>
      <Text class="label">
        <Trans>Eingabeempfindlichkeit</Trans>
      </Text>
      <MeterTrack>
        <Fill
          style={{
            width: `${levelToPercent(level())}%`,
            "background-color": gateOpen()
              ? "var(--md-sys-color-primary)"
              : "var(--md-sys-color-outline)",
          }}
        />
        <ThresholdMarker
          style={{ left: `${levelToPercent(voice.micSensitivity)}%` }}
        />
      </MeterTrack>
      <Slider
        min={MIC_SENSITIVITY_MIN_DB}
        max={MIC_SENSITIVITY_MAX_DB}
        step={1}
        value={voice.micSensitivity}
        onInput={(event) => (voice.micSensitivity = event.currentTarget.value)}
        labelFormatter={(value) => `${value.toFixed(0)} dB`}
      />
      <CategoryButton.Group>
        <CategoryButton
          icon="blank"
          disabled={!ready()}
          description={
            <Trans>
              Spielt dein bearbeitetes Mikrofonsignal direkt über deine
              Lautsprecher ab, so wie andere dich in einem Call hören würden. Am
              besten mit Kopfhörern nutzen, sonst gibt es Rückkopplungen.
            </Trans>
          }
          action={
            <Symbol>{playingBack() ? "stop_circle" : "play_circle"}</Symbol>
          }
          onClick={() => (playingBack() ? stopPlayback() : startPlayback())}
        >
          <Trans>Mich selbst hören</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
