import { For } from "solid-js";

import { useState } from "@revolt/state";
import {
  AVAILABLE_EXPERIMENTS,
  EXPERIMENTS,
} from "@revolt/state/stores/Experiments";
import { CategoryButton, Checkbox, Column } from "@revolt/ui";

/**
 * Advanced settings
 */
export default function AdvancedSettings() {
  const state = useState();

  return (
    <Column gap="xl">
      <Column>
        <Checkbox
          checked={state.settings.getValue("appearance:compact_mode")}
          onChange={(e) =>
            state.settings.setValue(
              "appearance:compact_mode",
              e.currentTarget.checked,
            )
          }
        >
          Compact mode
        </Checkbox>
        <Checkbox
          checked={state.settings.getValue("advanced:copy_id")}
          onChange={(e) =>
            state.settings.setValue("advanced:copy_id", e.currentTarget.checked)
          }
        >
          Show 'copy ID' in context menus
        </Checkbox>
        <Checkbox
          checked={state.settings.getValue("advanced:admin_panel")}
          onChange={(e) =>
            state.settings.setValue(
              "advanced:admin_panel",
              e.currentTarget.checked,
            )
          }
        >
          Show admin panel shortcuts in context menus
        </Checkbox>
      </Column>
      <CategoryButton.Group>
        <For each={AVAILABLE_EXPERIMENTS}>
          {(key) => (
            <CategoryButton
              action={
                <Checkbox
                  checked={state.experiments.isEnabled(key)}
                  onChange={(event) =>
                    state.experiments.setEnabled(
                      key,
                      event.currentTarget.checked,
                    )
                  }
                />
              }
              description={EXPERIMENTS[key].description}
              onClick={() => void 0}
            >
              {EXPERIMENTS[key].title}
            </CategoryButton>
          )}
        </For>
      </CategoryButton.Group>
    </Column>
  );
}
