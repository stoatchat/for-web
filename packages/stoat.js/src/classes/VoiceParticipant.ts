import { Accessor, Setter, createSignal } from "solid-js";

import type { Client } from "../Client.js";
import { UserVoiceState } from "../events/v1.js";

/**
 * The voice status of an entity. Screenshare supersedes video, video supersedes voice, and voice supersedes none.
 */
export type VoiceStatus = "none" | "voice" | "video" | "screenshare";

/**
 * Voice Participant
 */
export class VoiceParticipant {
  protected client: Client;
  readonly userId: string;
  readonly joinedAt: Date;

  readonly isReceiving: Accessor<boolean>;
  readonly isPublishing: Accessor<boolean>;
  readonly isScreensharing: Accessor<boolean>;
  readonly isCamera: Accessor<boolean>;

  #setReceiving: Setter<boolean>;
  #setPublishing: Setter<boolean>;
  #setScreensharing: Setter<boolean>;
  #setCamera: Setter<boolean>;

  /**
   * Construct Server Ban
   * @param client Client
   * @param data Data
   */
  constructor(client: Client, data: UserVoiceState) {
    this.client = client;
    this.userId = data.id;
    this.joinedAt = new Date(data.joined_at);

    const [isReceiving, setReceiving] = createSignal(data.is_receiving);
    this.isReceiving = isReceiving;
    this.#setReceiving = setReceiving;

    const [isPublishing, setPublishing] = createSignal(data.is_publishing);
    this.isPublishing = isPublishing;
    this.#setPublishing = setPublishing;

    const [isScreensharing, setScreensharing] = createSignal(
      data.screensharing,
    );
    this.isScreensharing = isScreensharing;
    this.#setScreensharing = setScreensharing;

    const [isCamera, setCamera] = createSignal(data.camera);
    this.isCamera = isCamera;
    this.#setCamera = setCamera;
  }

  /**
   * Update the state
   * @param data Data
   */
  update(data: Partial<UserVoiceState>) {
    if (typeof data.is_receiving === "boolean") {
      this.#setReceiving(data.is_receiving);
    }

    if (typeof data.is_publishing === "boolean") {
      this.#setPublishing(data.is_publishing);
    }

    if (typeof data.screensharing === "boolean") {
      this.#setScreensharing(data.screensharing);
    }

    if (typeof data.camera === "boolean") {
      this.#setCamera(data.camera);
    }
  }

  /**
   * The voice status of a participant. Screenshare supersedes video, video supersedes voice, and voice supersedes none.
   */
  get voiceStatus(): VoiceStatus {
    if (this.isScreensharing()) {
      return "screenshare";
    }
    if (this.isCamera()) {
      return "video";
    }
    return "voice";
  }
}
