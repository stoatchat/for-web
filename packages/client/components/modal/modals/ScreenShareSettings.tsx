import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
import { createFormControl, createFormGroup } from "solid-forms";

import { useClient } from "@revolt/client";
import {
  getEnabledScreenShareQualities,
  getScreenShareQuality,
} from "@revolt/rtc/ScreenShareQualities";
import { useState } from "@revolt/state";
import { ScreenShareQualityName } from "@revolt/state/stores/Voice";
import {
  Checkbox,
  Column,
  Dialog,
  DialogProps,
  FloatingSelect,
  Form2,
  MenuItem,
} from "@revolt/ui";
import { VideoTrack } from "solid-livekit-components";

import { For } from "solid-js";
import { Modals } from "../types";

export function ScreenShareSettingsModal(
  props: DialogProps & Modals & { type: "screen_share_settings" },
) {
  const { voice } = useState();
  const getClient = useClient();

  const group = createFormGroup({
    qualityName: createFormControl<ScreenShareQualityName>(
      voice.screenShareQuality || "low",
    ),
    dontAsk: createFormControl(false),
  });

  async function onSubmit() {
    if (group.controls.dontAsk.value) {
      voice.screenShareQuality = group.controls.qualityName.value;
      voice.screenShareQualityAsk = false;
    }

    props.callback(group.controls.qualityName.value);
    props.onClose();
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={() => {
        props.onCancel();
        props.onClose();
      }}
      title="Screen Share Settings"
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Go</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
        },
      ]}
    >
      <VideoTrack
        trackRef={props.trackReference}
        style={{
          padding: "var(--gap-md)",
          "border-radius": "var(--borderRadius-lg)",
          "max-height": "400px",
          "justify-self": "center",
        }}
      />
      <form onSubmit={submit}>
        <Column>
          <FloatingSelect
            label={t`Stream Resolution`}
            required
            value={group.controls.qualityName.value}
            onChange={(
              e: Event & { currentTarget: HTMLElement; target: Element },
            ) =>
              group.controls.qualityName.setValue(
                (e.currentTarget.getAttribute(
                  "value",
                ) as ScreenShareQualityName) || "low",
              )
            }
          >
            <For each={getEnabledScreenShareQualities(getClient())}>
              {(item) => (
                <MenuItem value={item}>
                  {getScreenShareQuality(item, getClient()).fullName}
                </MenuItem>
              )}
            </For>
          </FloatingSelect>

          <Checkbox
            checked={group.controls.dontAsk.value}
            onChange={() =>
              group.controls.dontAsk.setValue(!group.controls.dontAsk.value)
            }
          >
            <Trans>Don't ask me again</Trans>
          </Checkbox>
        </Column>
      </form>
    </Dialog>
  );
}
