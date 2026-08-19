import type { Participant } from "livekit-client";
import { Accessor } from "solid-js";
import { useEnsureParticipant } from "solid-livekit-components";

import { useVoice } from "../state";

/**
 * The `useIsDeafened` hook returns a boolean accessor indicating if the participant is deafened.
 *
 * @example
 * ```tsx
 * const isDeafened = useIsDeafened(participant);
 * ```
 */
export function useIsDeafened(participant?: Participant): Accessor<boolean> {
  const p = useEnsureParticipant(participant);
  const voice = useVoice();

  return () => {
    if (p.isLocal || p.identity === voice.room()?.localParticipant.identity) {
      return voice.deafen();
    }
    const voiceParticipant = voice.channel()?.voiceParticipants.get(p.identity);
    return voiceParticipant ? !voiceParticipant.isReceiving() : false;
  };
}
