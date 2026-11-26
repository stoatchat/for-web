import { Trans } from "@lingui/solid/macro";

import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column, Text } from "@revolt/ui";

/**
 * Voice channel behaviour options
 */
export function VoiceChannelOptions() {
  const { voice } = useState();

  return (
    <Column>
      <Text class="title">
        <Trans>Voice Channels</Trans>
      </Text>
      <CategoryButton.Group>
        <CategoryButton
          icon="blank"
          action={<Checkbox checked={voice.joinOnDoubleClick} />}
          onClick={() => (voice.joinOnDoubleClick = !voice.joinOnDoubleClick)}
          description={
            <Trans>
              Double-click a voice channel in the channel list to join it
              straight away.
            </Trans>
          }
        >
          <Trans>Join voice channels with a double click</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
