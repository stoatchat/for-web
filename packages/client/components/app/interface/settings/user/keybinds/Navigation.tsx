import { Trans } from "@lingui-solid/solid/macro";
import { CategoryButton, Column, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { SequencePills } from "./shared";

import { KeybindAction } from "@revolt/keybinds";
import { getSequences } from "@revolt/keybinds/keybindSequences";

export function NavigationKeybinds() {
  return (
    <Column gap="lg">
      <Text class="title" size="small">
        <Trans>Navigation Keybinds </Trans>
      </Text>
      <CategoryButton.Group>
        <CategoryButton
          icon={<Symbol>keyboard_arrow_up</Symbol>}
          action={
            <SequencePills
              seq={getSequences(KeybindAction.NAVIGATION_CHANNEL_UP)}
            />
          }
          description={
            <Trans>
              Navigate to the channel above the currently selected one.
            </Trans>
          }
        >
          <Trans>Channel Up</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<Symbol>keyboard_arrow_down</Symbol>}
          action={
            <SequencePills
              seq={getSequences(KeybindAction.NAVIGATION_CHANNEL_DOWN)}
            />
          }
          description={
            <Trans>
              Navigate to the channel below the currently selected one.
            </Trans>
          }
        >
          <Trans>Channel Down</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<Symbol>arrow_upward</Symbol>}
          action={
            <SequencePills
              seq={getSequences(KeybindAction.NAVIGATION_SERVER_UP)}
            />
          }
          description={
            <Trans>
              Navigate to the server above the currently selected one.
            </Trans>
          }
        >
          <Trans>Server Up</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<Symbol>arrow_downward</Symbol>}
          action={
            <SequencePills
              seq={getSequences(KeybindAction.NAVIGATION_SERVER_DOWN)}
            />
          }
          description={
            <Trans>
              Navigate to the server below the currently selected one.
            </Trans>
          }
        >
          <Trans>Server Down</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
