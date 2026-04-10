import { createMemo } from "solid-js";
import { useMediaDeviceSelect } from "solid-livekit-components";

import { Trans } from "@lingui-solid/solid/macro";

import { useState } from "@revolt/state";
import {
  CategoryButton,
  CategorySelectOption,
  Column,
  Slider,
  Text,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * Input options
 */
export function VoiceInputOptions() {
  return (
    <Column>
      <CategoryButton.Group>
        <SelectInput kind="audioinput" />
        <SelectInput kind="audiooutput" />
        {/* <SelectInput kind="videoinput" /> TODO O.o */}
      </CategoryButton.Group>
      <VolumeSliders />
    </Column>
  );
}

/**
 * Select input device w/ type
 */
function SelectInput(props: { kind: MediaDeviceKind }) {
  const state = useState();
  const media = createMemo(() => useMediaDeviceSelect({ kind: props.kind }));

  const setKey = () =>
    props.kind === "audioinput"
      ? "preferredAudioInputDevice"
      : "preferredAudioOutputDevice";

  const icon = () =>
    props.kind === "audioinput" ? (
      <Symbol>mic</Symbol>
    ) : (
      <Symbol>speaker</Symbol>
    );

  const title = () =>
    props.kind === "audioinput" ? (
      <Trans>Select audio input</Trans>
    ) : (
      <Trans>Select audio output</Trans>
    );

  const activeId = createMemo(() => {
    const active = media().activeDeviceId();
    return (active === "default" ? state.voice[setKey()] : undefined) ?? active;
  });

  const devOpts = createMemo(() => {
    const devs = media().devices(),
      opts: { [k in string]: CategorySelectOption } = {};

    //Ensure default is at top
    let d = devs.find((d) => d.deviceId === "default");
    if (d) opts.default = { title: d.label };

    for (d of devs)
      if (d.deviceId !== "default") opts[d.deviceId] = { title: d.label };
    return opts;
  });

  return (
    <CategoryButton.Select
      icon={icon()}
      title={title()}
      value={activeId()}
      options={devOpts()}
      onUpdate={(id) => {
        const mMedia = media(),
          dev = mMedia.devices().find((d) => d.deviceId === id);
        if (dev) {
          state.voice[setKey()] = dev.deviceId;
          mMedia.setActiveMediaDevice(dev.deviceId);
        }
      }}
    />
  );
}

/**
 * Select volume
 */
function VolumeSliders() {
  const state = useState();

  return (
    <Column>
      <Text class="label">
        <Trans>Output Volume</Trans>
      </Text>
      <Slider
        min={0}
        max={3}
        step={0.1}
        value={state.voice.outputVolume}
        onInput={(event) =>
          (state.voice.outputVolume = event.currentTarget.value)
        }
        labelFormatter={(label) => (label * 100).toFixed(0) + "%"}
      />
    </Column>
  );
}
