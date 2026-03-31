import { createMemo } from "solid-js";
import { useMediaDeviceSelect } from "solid-livekit-components";

import { Trans } from "@lingui-solid/solid/macro";

import { useState } from "@revolt/state";
import { CategoryButton, CatSelOption, Column, Slider, Text } from "@revolt/ui";
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
  // eslint-disable-next-line solid/reactivity
  const kind = props.kind;

  const state = useState();
  const { activeDeviceId, devices, setActiveMediaDevice } =
    useMediaDeviceSelect({ kind });

  const setKey =
    kind === "audioinput"
      ? "preferredAudioInputDevice"
      : "preferredAudioOutputDevice";

  const icon =
    kind === "audioinput" ? <Symbol>mic</Symbol> : <Symbol>speaker</Symbol>;

  const title =
    kind === "audioinput" ? (
      <Trans>Select audio input</Trans>
    ) : (
      <Trans>Select audio output</Trans>
    );

  const activeId = createMemo(() => {
    const active = activeDeviceId();
    return (active === "default" ? state.voice[setKey] : undefined) ?? active;
  });

  const devOpts = createMemo(() => {
    const devs = devices(),
      opts: { [k in string]: CatSelOption } = {};

    //Ensure default is at top
    let d = devs.find((d) => d.deviceId === "default");
    if (d) opts.default = { title: d.label };

    for (d of devs)
      if (d.deviceId !== "default") opts[d.deviceId] = { title: d.label };
    return opts;
  });

  return (
    <CategoryButton.Select
      icon={icon}
      title={title}
      value={activeId()}
      options={devOpts()}
      onUpdate={(id) => {
        const dev = devices().find((d) => d.deviceId === id);
        if (dev) {
          state.voice[setKey] = dev.deviceId;
          setActiveMediaDevice(dev.deviceId);
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
