import { Trans } from "@lingui-solid/solid/macro";
import { useState } from "@revolt/state";
import { Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";
import { createFormControl, createFormGroup } from "solid-forms";
import { styled } from "styled-system/jsx";
import { Modals } from "../types";

export function AvatarRadiusModal(
  props: DialogProps & Modals & { type: "avatar_radius" },
) {
  const state = useState();

  const group = createFormGroup({
    roundness: createFormControl(state.theme.avatarRadius, { required: true }),
  });

  function onSubmit() {
    state.theme.avatarRadius = group.controls.roundness.value;
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Choose radius</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Use</Trans>,
          onClick: () => {
            onSubmit();
            return true;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Column align>
          <Shape
            style={{ "border-radius": `${group.controls.roundness.value}%` }}
          />
          <Text>{group.controls.roundness.value}</Text>
        </Column>

        <Form2.Slider control={group.controls.roundness} max={50} min={0} />
      </form>
    </Dialog>
  );
}

const Shape = styled("div", {
  base: {
    overflow: "hidden",
    width: "48px",
    height: "48px",
    background: "var(--md-sys-color-primary)",
  },
});
