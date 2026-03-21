import { Trans } from "@lingui-solid/solid/macro";

import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column, Text } from "@revolt/ui";
import { CategoryCollapse } from "@revolt/ui/components/design/CategoryButton";

/**
 * Voice processing options
 */
export function VoiceProcessingOptions() {
  const state = useState();

  return (
    <Column>
      <Text class="title">
        <Trans>Voice Processing</Trans>
      </Text>
      <CategoryButton.Group>
        <NoiseSuppression />
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={state.voice.echoCancellation} />}
          onClick={() =>
            (state.voice.echoCancellation = !state.voice.echoCancellation)
          }
        >
          <Trans>Browser Echo Cancellation</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}

function NoiseSuppression() {
  const state = useState();

  const description = () => {
    if (state.voice.noiseSupression === "disabled") {
      return <Trans>Disabled</Trans>;
    }
    if (state.voice.noiseSupression === "browser") {
      return <Trans>Browser</Trans>;
    }
    if (state.voice.noiseSupression === "enhanced") {
      return <Trans>Enhanced (RNNoise)</Trans>;
    }
  };

  return (
    <CategoryCollapse
      icon={"blank"}
      title={<Trans>Select noise suppression</Trans>}
      description={description()}
    >
      <CategoryButton
        icon={"blank"}
        onClick={() => (state.voice.noiseSupression = "disabled")}
        action={
          <Checkbox checked={state.voice.noiseSupression === "disabled"} />
        }
      >
        <Trans>Disabled</Trans>
      </CategoryButton>
      <CategoryButton
        icon={"blank"}
        onClick={() => (state.voice.noiseSupression = "browser")}
        action={
          <Checkbox checked={state.voice.noiseSupression === "browser"} />
        }
      >
        <Trans>Browser</Trans>
      </CategoryButton>
      <CategoryButton
        icon={"blank"}
        onClick={() => (state.voice.noiseSupression = "enhanced")}
        action={
          <Checkbox checked={state.voice.noiseSupression === "enhanced"} />
        }
        description={<Trans>Powered by RNNoise</Trans>}
      >
        <Trans>Enhanced</Trans>
      </CategoryButton>
    </CategoryCollapse>
  );
}
