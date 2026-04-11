import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
import { createFormControl, createFormGroup } from "solid-forms";

import {
  Column,
  Dialog,
  DialogProps,
  FloatingSelect,
  Form2,
  MenuItem,
} from "@revolt/ui";

import { VideoTrack } from "solid-livekit-components";
import { Modals } from "../types";

export function ScreenShareSettingsModal(
  props: DialogProps & Modals & { type: "screen_share_settings" },
) {
  const group = createFormGroup({
    resolution: createFormControl("low"),
  });

  async function onSubmit() {
    props.callback(group.controls.resolution.value);
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
            value={group.controls.resolution.value}
            onChange={(
              e: Event & { currentTarget: HTMLElement; target: Element },
            ) =>
              group.controls.resolution.setValue(
                e.currentTarget.getAttribute("value") || "medium",
              )
            }
          >
            <MenuItem value="low">
              <Trans>720p 30FPS</Trans>
            </MenuItem>
            {/* TODO: Disable this option if above limits */}
            <MenuItem value="high">
              <Trans>1080p 30FPS</Trans>
            </MenuItem>
            {/* TODO: Cap this option at limit */}
            <MenuItem value="text">
              <Trans>Source 5FPS</Trans>
            </MenuItem>
          </FloatingSelect>
        </Column>
      </form>
    </Dialog>
  );
}
