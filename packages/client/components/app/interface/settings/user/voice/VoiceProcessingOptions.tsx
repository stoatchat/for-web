import { Trans } from "@lingui/solid/macro";
import { Show } from "solid-js";

import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column, Text } from "@revolt/ui";

/**
 * Voice processing options
 */
export function VoiceProcessingOptions() {
  const { voice } = useState();

  return (
    <Column>
      <Text class="title">
        <Trans>Voice Processing</Trans>
      </Text>
      <CategoryButton.Group>
        <CategoryButton.Select
          icon={"blank"}
          title={<Trans>Select noise suppression</Trans>}
          options={{
            disabled: { title: <Trans>Disabled</Trans> },
            browser: { title: <Trans>Browser</Trans> },
            enhanced: {
              title: <Trans>Enhanced</Trans>,
              description: <Trans>Powered by RNNoise</Trans>,
              shortDesc: <Trans>Enhanced (RNNoise)</Trans>,
            },
          }}
          value={voice.noiseSupression}
          onUpdate={(ns) => (voice.noiseSupression = ns)}
        />
        <Show when={voice.noiseSupression === "enhanced"}>
          <CategoryButton.Select
            icon={"blank"}
            title={<Trans>RNNoise intensity</Trans>}
            options={{
              low: {
                title: <Trans>Low</Trans>,
                description: <Trans>Preserves more background sound</Trans>,
              },
              medium: {
                title: <Trans>Balanced</Trans>,
                description: (
                  <Trans>Balances voice clarity and noise reduction</Trans>
                ),
              },
              high: {
                title: <Trans>Aggressive</Trans>,
                description: (
                  <Trans>Reduces the most residual background noise</Trans>
                ),
              },
            }}
            value={voice.noiseSuppressionLevel}
            onUpdate={(level) => (voice.noiseSuppressionLevel = level)}
          />
        </Show>
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={voice.echoCancellation} />}
          onClick={() => (voice.echoCancellation = !voice.echoCancellation)}
        >
          <Trans>Browser Echo Cancellation</Trans>
        </CategoryButton>
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={voice.autoGainControl} />}
          onClick={() => (voice.autoGainControl = !voice.autoGainControl)}
        >
          <Trans>Automatic Gain Control</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
