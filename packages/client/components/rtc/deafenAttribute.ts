import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";

import { Participant, ParticipantEvent } from "livekit-client";

/**
 * LiveKit participant attribute used to tell others we are deafened.
 *
 * Mute is already visible via the microphone track (`useIsMuted`). Deafen only
 * mutes inbound audio, so it must be published separately.
 */
export const LIVEKIT_DEAFEN_ATTRIBUTE = "deafen";

export function deafenAttributePayload(
  deafened: boolean,
): Record<string, string> {
  return { [LIVEKIT_DEAFEN_ATTRIBUTE]: deafened ? "true" : "" };
}

export function participantIsDeafened(participant: Participant): boolean {
  return participant.attributes[LIVEKIT_DEAFEN_ATTRIBUTE] === "true";
}

/**
 * Reactive deafen flag from LiveKit participant attributes.
 */
export function useIsDeafened(participant: Participant): Accessor<boolean> {
  const [deafened, setDeafened] = createSignal(
    participantIsDeafened(participant),
  );

  createEffect(() => {
    const p = participant;
    const update = () => setDeafened(participantIsDeafened(p));
    update();
    p.on(ParticipantEvent.AttributesChanged, update);
    onCleanup(() => p.off(ParticipantEvent.AttributesChanged, update));
  });

  return deafened;
}
