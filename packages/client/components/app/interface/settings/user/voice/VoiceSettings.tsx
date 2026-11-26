import { Show } from "solid-js";

import { useDevice } from "@revolt/common";
import { useInstance } from "@revolt/instance";
import { isDoubleClickJoinAvailable } from "@revolt/rtc";
import { Column } from "@revolt/ui";

import { ScreenShareOptions } from "./ScreenShareOptions";
import { VoiceChannelOptions } from "./VoiceChannelOptions";
import { VoiceInputOptions } from "./VoiceInputOptions";
import { VoiceProcessingOptions } from "./VoiceProcessingOptions";

/**
 * Configure voice options
 */
export function VoiceSettings() {
  const { limits } = useInstance();
  const device = useDevice();

  return (
    <Column gap="lg">
      <VoiceInputOptions />
      <VoiceProcessingOptions />
      <Show when={isDoubleClickJoinAvailable(device)}>
        <VoiceChannelOptions />
      </Show>
      <Show when={limits().video}>
        <ScreenShareOptions />
      </Show>
    </Column>
  );
}
