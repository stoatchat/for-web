import { State } from "..";

import { AbstractStore } from ".";

export type TypeSounds = {
  /**
   * Play sound on deafen
   */
  deafen: boolean;

  /**
   * Play a sound on message/notification
   */
  message: boolean;

  /**
   * Play sound on mute
   */
  mute: boolean;

  /**
   * Play sound when receiving a DM call
   */
  ringtoneIncoming: boolean;

  /**
   * Play sound when dialing someone in a DM call
   */
  ringtoneOutgoing: boolean;

  /**
   * Play a sound when a stream ends
   */
  streamEnd: boolean;

  /**
   * Play a sound when a stream starts
   */
  streamStart: boolean;

  /**
   * Play a sound when a user starts viewing your stream
   */
  streamViewerJoin: boolean;

  /**
   * Play a sound when a user stops viewing your stream
   */
  streamViewerLeave: boolean;

  /**
   * Play a sound when you undeafen
   */
  undeafen: boolean;

  /**
   * Play a sound when you unmute
   */
  unmute: boolean;

  /**
   * Play a sound when a user joins your voice channel
   */
  userJoinVoice: boolean;

  /**
   * Play a sound when a user leaves your voice channel
   */
  userLeaveVoice: boolean;

  /**
   * Play a sound when a user moves channels
   */
  userMoved: boolean;
};

export class Sounds extends AbstractStore<"sounds", TypeSounds> {
  constructor(state: State) {
    super(state, "sounds");
  }

  hydrate(): void {}

  default(): TypeSounds {
    return {
      deafen: true,
      message: true,
      mute: true,
      ringtoneIncoming: true,
      ringtoneOutgoing: true,
      streamEnd: true,
      streamStart: true,
      streamViewerJoin: true,
      streamViewerLeave: true,
      undeafen: true,
      unmute: true,
      userJoinVoice: true,
      userLeaveVoice: true,
      userMoved: true,
    };
  }

  clean(input: Partial<TypeSounds>): TypeSounds {
    return {
      deafen: typeof input.deafen === "boolean" ? input.deafen : true,
      message: typeof input.message === "boolean" ? input.message : true,
      mute: typeof input.mute === "boolean" ? input.mute : true,
      ringtoneIncoming:
        typeof input.ringtoneIncoming === "boolean"
          ? input.ringtoneIncoming
          : true,
      ringtoneOutgoing:
        typeof input.ringtoneOutgoing === "boolean"
          ? input.ringtoneOutgoing
          : true,
      streamEnd: typeof input.streamEnd === "boolean" ? input.streamEnd : true,
      streamStart:
        typeof input.streamStart === "boolean" ? input.streamStart : true,
      streamViewerJoin:
        typeof input.streamViewerJoin === "boolean"
          ? input.streamViewerJoin
          : true,
      streamViewerLeave:
        typeof input.streamViewerLeave === "boolean"
          ? input.streamViewerLeave
          : true,
      undeafen: typeof input.undeafen === "boolean" ? input.undeafen : true,
      unmute: typeof input.unmute === "boolean" ? input.unmute : true,
      userJoinVoice:
        typeof input.userJoinVoice === "boolean" ? input.userJoinVoice : true,
      userLeaveVoice:
        typeof input.userLeaveVoice === "boolean" ? input.userLeaveVoice : true,
      userMoved: typeof input.userMoved === "boolean" ? input.userMoved : true,
    };
  }

  enabled(t: keyof TypeSounds): boolean {
    return this.get()[t];
  }

  toggle(t: keyof TypeSounds) {
    return this.set(t, !this.enabled(t));
  }
}
