import { AudioProcessorOptions, Track, TrackProcessor } from "livekit-client";
import { RNNoiseNode } from "livekit-rnnoise-processor";
import { createEffect, createRoot, on } from "solid-js";

import { CONFIGURATION } from "@revolt/common";
import { Voice } from "@revolt/state/stores/Voice";

export class VoiceProcessor implements TrackProcessor<
  Track.Kind.Audio,
  AudioProcessorOptions
> {
  readonly name = "stoat-voice-processor";
  processedTrack?: MediaStreamTrack;

  // Voice gate: keeps the mic silent until speech is actually detected, so
  // background noise between words isn't sent. The open threshold is the
  // user's "micSensitivity" setting (dBFS, defaults to -35dBov to match the
  // self-hosted LiveKit server's own "active_level" speaking detection, so
  // this lines up with when the "speaking" indicator lights up by default).
  // The close threshold sits a fixed amount below the open threshold
  // (hysteresis) to avoid rapid chatter right at the boundary; a slow
  // release gives a brief hangover after speech ends instead of cutting off
  // mid-word.
  private static readonly GATE_HYSTERESIS_DB = 7;
  private static readonly GATE_ATTACK_SECONDS = 0.03;
  private static readonly GATE_RELEASE_SECONDS = 0.15;
  private static readonly GATE_POLL_MS = 20;
  private static readonly GATE_FFT_SIZE = 512;
  private static readonly GATE_MIN_DB = -100;

  private audioContext?: AudioContext;
  private settings: Voice;

  private noiseSuppressionNode?: RNNoiseNode;
  private sourceNode?: MediaStreamAudioSourceNode;
  private highpassNode?: BiquadFilterNode;
  private compressorNode?: DynamicsCompressorNode;
  private gainNode?: GainNode;
  private destinationNode?: MediaStreamAudioDestinationNode;

  private preGateOutput?: AudioNode;
  private gateAnalyserNode?: AnalyserNode;
  private gateGainNode?: GainNode;
  private gateDataBuffer?: Float32Array<ArrayBuffer>;
  private gateOpen = false;
  private gateLastLevelDb = VoiceProcessor.GATE_MIN_DB;
  private gateIntervalId?: ReturnType<typeof setInterval>;

  private disposeSolidjsContext: () => void = () => {};

  constructor(voiceSettings: Voice) {
    this.settings = voiceSettings;

    // Create a solid root to track changes to the settings
    createRoot((dispose) => {
      // On input volume setting change, set the gain
      createEffect(() => {
        this.setGain(this.getSettings().inputVolume);
      });

      // On noise suppression setting change, toggle noise suppression
      createEffect(
        on(
          () => this.getSettings().noiseSupression,
          (newNoiseSuppresion, oldNoiseSuppression) => {
            // Only rebuild if noise supression has changed from enhanced to something else or vice versa
            if (
              oldNoiseSuppression &&
              oldNoiseSuppression !== newNoiseSuppresion &&
              (newNoiseSuppresion === "enhanced" ||
                oldNoiseSuppression === "enhanced")
            ) {
              this.rebuild();
            }
          },
        ),
      );

      // This is needed to destroy the solid context on unload
      this.disposeSolidjsContext = dispose;
    });
  }

  private getSettings(): Voice {
    return this.settings;
  }

  private setGain(newGain: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = newGain;
    }
  }

  private rebuild() {
    this.updateNoiseSuppression(this.audioContext!);
  }

  async init(opts: AudioProcessorOptions): Promise<void> {
    await RNNoiseNode.loadModule(
      opts.audioContext,
      CONFIGURATION.RNNOISE_WORKLET_CDN_URL,
    );
    return this.build(opts);
  }

  async restart(opts: AudioProcessorOptions): Promise<void> {
    return this.build(opts);
  }

  async destroy(): Promise<void> {
    // Destroy the solid context on processor destruction
    this.disposeSolidjsContext();
    this.audioContext = undefined;
    return this.teardown();
  }

  private updateNoiseSuppression(context: AudioContext) {
    if (this.noiseSuppressionNode) {
      this.compressorNode?.disconnect();
      this.noiseSuppressionNode.disconnect();
      this.highpassNode?.disconnect();
      this.sourceNode?.disconnect();
    }

    if (this.settings.noiseSupression === "enhanced") {
      // Create a new highpass filter
      this.highpassNode = context.createBiquadFilter();
      this.highpassNode.type = "highpass";
      this.highpassNode.frequency.value = 50;
      this.highpassNode.Q.value = Math.SQRT1_2;

      this.noiseSuppressionNode = new RNNoiseNode(this.audioContext!);
      this.highpassNode.connect(this.noiseSuppressionNode);

      // Create a new dynamics compressor
      this.compressorNode = context.createDynamicsCompressor();
      this.compressorNode.threshold.value = -3;
      this.compressorNode.knee.value = 0;
      this.compressorNode.ratio.value = 20;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.05;
      this.noiseSuppressionNode.connect(this.compressorNode);

      // Connect the compressor to the voice gate
      this.compressorNode.connect(this.gateGainNode!);
      // Lastly, connect the source to the highpass node to complete loop
      this.sourceNode!.connect(this.highpassNode);
      this.preGateOutput = this.compressorNode;
    } else {
      // Bypass noise suppression and remove all unused nodes
      this.compressorNode = undefined;
      this.noiseSuppressionNode = undefined;
      this.highpassNode = undefined;
      this.sourceNode!.connect(this.gateGainNode!);
      this.preGateOutput = this.sourceNode;
    }

    this.gateAnalyserNode?.disconnect();
    this.preGateOutput!.connect(this.gateAnalyserNode!);
  }

  private async build(opts: AudioProcessorOptions): Promise<void> {
    await this.teardown();
    // If context was passed, store it for restarts
    // If no context was passed, this was a restart so use the old context
    let context = opts.audioContext;
    if (!context) {
      context = this.audioContext!;
    } else {
      this.audioContext = context;
    }
    if (!context) {
      return;
    }
    this.sourceNode = context.createMediaStreamSource(
      new MediaStream([opts.track]),
    );

    // Create the target gain node for input volume
    this.gainNode = context.createGain();
    this.gainNode.gain.value = this.settings.inputVolume;

    // Voice gate: starts closed (muted) until speech is detected
    this.gateGainNode = context.createGain();
    this.gateGainNode.gain.value = 0;
    this.gateOpen = false;

    this.gateAnalyserNode = context.createAnalyser();
    this.gateAnalyserNode.fftSize = VoiceProcessor.GATE_FFT_SIZE;
    this.gateDataBuffer = new Float32Array(this.gateAnalyserNode.fftSize);

    this.updateNoiseSuppression(context);

    // Create the destination node, connect the gain node and send it off to livekit
    this.destinationNode = context.createMediaStreamDestination();
    this.gateGainNode.connect(this.gainNode);
    this.gainNode.connect(this.destinationNode);
    this.processedTrack = this.destinationNode.stream.getAudioTracks()[0];

    this.startGate();
  }

  /** Poll the pre-gate signal level and open/close the voice gate accordingly. */
  private startGate() {
    clearInterval(this.gateIntervalId);
    this.gateIntervalId = setInterval(() => {
      if (!this.gateAnalyserNode || !this.gateGainNode || !this.audioContext) {
        return;
      }

      this.gateAnalyserNode.getFloatTimeDomainData(this.gateDataBuffer!);
      let sumSquares = 0;
      for (const sample of this.gateDataBuffer!) {
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / this.gateDataBuffer!.length);
      this.gateLastLevelDb = Math.max(
        VoiceProcessor.GATE_MIN_DB,
        20 * Math.log10(rms || 10 ** (VoiceProcessor.GATE_MIN_DB / 20)),
      );

      const openDb = this.settings.micSensitivity;
      const closeDb = openDb - VoiceProcessor.GATE_HYSTERESIS_DB;

      if (this.gateLastLevelDb >= openDb) {
        this.gateOpen = true;
      } else if (this.gateLastLevelDb < closeDb) {
        this.gateOpen = false;
      }
      // otherwise: inside the hysteresis band, keep the current state

      this.gateGainNode.gain.setTargetAtTime(
        this.gateOpen ? 1 : 0,
        this.audioContext.currentTime,
        this.gateOpen
          ? VoiceProcessor.GATE_ATTACK_SECONDS
          : VoiceProcessor.GATE_RELEASE_SECONDS,
      );
    }, VoiceProcessor.GATE_POLL_MS);
  }

  /** Latest smoothed input level in dBFS, for driving a live level meter. */
  getCurrentLevelDb(): number {
    return this.gateLastLevelDb;
  }

  /** Whether the voice gate currently considers the input "speech". */
  isGateOpen(): boolean {
    return this.gateOpen;
  }

  private async teardown() {
    clearInterval(this.gateIntervalId);
    this.gateIntervalId = undefined;

    this.sourceNode?.disconnect();
    this.highpassNode?.disconnect();
    this.noiseSuppressionNode?.disconnect();
    this.compressorNode?.disconnect();
    this.gateAnalyserNode?.disconnect();
    this.gateGainNode?.disconnect();
    this.gainNode?.disconnect();
    this.destinationNode?.disconnect();
    this.sourceNode = undefined;
    this.highpassNode = undefined;
    this.noiseSuppressionNode = undefined;
    this.compressorNode = undefined;
    this.preGateOutput = undefined;
    this.gateAnalyserNode = undefined;
    this.gateGainNode = undefined;
    this.gateDataBuffer = undefined;
    this.gainNode = undefined;
    this.destinationNode = undefined;
  }
}
