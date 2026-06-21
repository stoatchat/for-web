import { Trans } from "@lingui-solid/solid/macro";

import { useState } from "@revolt/state";

import { CategoryButton, Checkbox, Column, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

/**
 * All accessibility options for the client
 */
export default function Accessibility() {
  const state = useState();

  return (
    <Column gap="lg">
      <Column>
        <Text class="title" size="small">
          <Trans>Chat Input</Trans>
        </Text>

        <CategoryButton
          action={
            <Checkbox
              checked={state.settings.getValue(
                "accessibility:show_send_button",
              )}
            />
          }
          onClick={() =>
            state.settings.setValue(
              "accessibility:show_send_button",
              !state.settings.getValue("accessibility:show_send_button"),
            )
          }
          icon={<Symbol>send</Symbol>}
          description={
            <Trans>
              If disabled, the Send Message button will only appear on mobile
            </Trans>
          }
        >
          <Trans>Always show Send Message button</Trans>
        </CategoryButton>

        <Column>
          <Text class="title" size="small">
            <Trans>Notifications</Trans>
          </Text>

          <CategoryButton
            action={
              <Checkbox
                checked={state.settings.getValue(
                  "accessibility:show_unread_conversations",
                )}
              />
            }
            onClick={() =>
              state.settings.setValue(
                "accessibility:show_unread_conversations",
                !state.settings.getValue(
                  "accessibility:show_unread_conversations",
                ),
              )
            }
            icon={<Symbol>chat_bubble</Symbol>}
          >
            <Trans>Show unread conversations in server list</Trans>
          </CategoryButton>
        </Column>
      </Column>
      {/* <CategoryButtonGroup>
        <FormGroup>
          <CategoryButton
            action={<Checkbox value onChange={(value) => void value} />}
            onClick={() => void 0}
            icon={<MdAnimation {...iconSize(22)} />}
            description={
              <Trans>
                If this is enabled, animations and motion effects won't play or
                will be less intense.
              </Trans>
            }
          >
            <Trans>Reduced Motion</Trans>
          </CategoryButton>
        </FormGroup>
      </CategoryButtonGroup> */}
    </Column>
  );
}
