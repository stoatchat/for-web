import { createContext, JSXElement, useContext } from "solid-js";

import { Sounds, TypeSounds } from "@revolt/state/stores/Sounds";

import { useState } from "@revolt/state";
import deafenSound from "../../assets/sounds/deafen.ogg";
import messageSound from "../../assets/sounds/message_sound.ogg";
import muteSound from "../../assets/sounds/mute.ogg";
import ringtoneIncomingSound from "../../assets/sounds/ringtone_incoming.ogg";
import ringtoneOutgoingSound from "../../assets/sounds/ringtone_outgoing.ogg";
import streamEndSound from "../../assets/sounds/stream_end.ogg";
import streamStartSound from "../../assets/sounds/stream_start.ogg";
import streamViewerJoinSound from "../../assets/sounds/stream_viewer_join.ogg";
import streamViewerLeaveSound from "../../assets/sounds/stream_viewer_leave.ogg";
import undeafenSound from "../../assets/sounds/undeafen.ogg";
import unmuteSound from "../../assets/sounds/unmute.ogg";
import userJoinVoiceSound from "../../assets/sounds/user_join_voice.ogg";
import userLeaveVoiceSound from "../../assets/sounds/user_leave_voice.ogg";
import userMovedSound from "../../assets/sounds/user_moved.ogg";

export class SoundController {
  readonly soundState: Sounds;

  node?: HTMLAudioElement;

  lastPlayedSound?: keyof TypeSounds;

  constructor(soundState: Sounds) {
    this.soundState = soundState;
  }

  canPlay(newSound: keyof TypeSounds): boolean {
    // Never let a sound turned off play
    if (!this.soundState.enabled(newSound)) {
      return false;
    }

    // Always let the sound play if nothing is currently playing
    if (!this.node || this.node.paused) {
      return true;
    }

    // If there are any cases where you don't want sound collisions, put them here.
    // None for now.
    return true;
  }

  playSound(sound: keyof TypeSounds): boolean {
    if (!this.canPlay(sound)) {
      return false;
    }
    switch (sound) {
      case "deafen": {
        this.node = new Audio(deafenSound);
        break;
      }
      case "message": {
        this.node = new Audio(messageSound);
        break;
      }
      case "mute": {
        this.node = new Audio(muteSound);
        break;
      }
      case "ringtoneIncoming": {
        this.node = new Audio(ringtoneIncomingSound);
        break;
      }
      case "ringtoneOutgoing": {
        this.node = new Audio(ringtoneOutgoingSound);
        break;
      }
      case "streamEnd": {
        this.node = new Audio(streamEndSound);
        break;
      }
      case "streamStart": {
        this.node = new Audio(streamStartSound);
        break;
      }
      case "streamViewerJoin": {
        this.node = new Audio(streamViewerJoinSound);
        break;
      }
      case "streamViewerLeave": {
        this.node = new Audio(streamViewerLeaveSound);
        break;
      }
      case "undeafen": {
        this.node = new Audio(undeafenSound);
        break;
      }
      case "unmute": {
        this.node = new Audio(unmuteSound);
        break;
      }
      case "userJoinVoice": {
        this.node = new Audio(userJoinVoiceSound);
        break;
      }
      case "userLeaveVoice": {
        this.node = new Audio(userLeaveVoiceSound);
        break;
      }
      case "userMoved": {
        this.node = new Audio(userMovedSound);
        break;
      }
    }
    this.lastPlayedSound = "deafen";
    this.node.play();
    return true;
  }
}

const soundContext = createContext(null! as SoundController);

export function SoundContext(props: { children: JSXElement }) {
  const { sounds } = useState();

  const controller = new SoundController(sounds);

  return (
    <soundContext.Provider value={controller}>
      {props.children}
    </soundContext.Provider>
  );
}

export function useSound(): SoundController {
  return useContext(soundContext);
}
