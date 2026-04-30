import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { createFormControl, createFormGroup } from "solid-forms";

import { useState } from "@revolt/state";
import { ScreenShareQualityName } from "@revolt/state/stores/Voice";
import { Avatar, Column, Dialog, DialogProps, Form2, Ripple } from "@revolt/ui";

import { createMemo } from "solid-js";
import { styled } from "styled-system/jsx";
import { Modals } from "../types";

export function ScreenSharePickerModal(
  props: DialogProps & Modals & { type: "screen_share_picker" },
) {
  const { voice } = useState();
  const { t } = useLingui();

  const group = createFormGroup({
    qualityName: createFormControl<ScreenShareQualityName>(
      voice.screenShareQuality || "low",
    ),
    idx: createFormControl([0], { required: true }),
  });

  async function onSubmit() {
    props.callback(
      group.controls.idx.value[0],
      group.controls.qualityName.value,
    );
    props.onClose();
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  const sources = createMemo(() =>
    props.sources.map((source) => {
      return { item: source, value: source.idx };
    }),
  );

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={() => {
        props.onCancel();
        props.onClose();
      }}
      title={t`Pick a Screen to Share`}
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
      <form onSubmit={submit}>
        <Column>
          <Form2.VirtualSelect
            control={group.controls.idx}
            items={sources()}
            selectHeight="max(30vh, 200px)"
            isMaxHeight={true}
            itemHeight={60}
          >
            {(val, selected) => (
              <Item selected={selected}>
                <Ripple />
                <Avatar
                  src={val.image}
                  fallback={val.name}
                  size={36}
                  shape="rounded-square"
                />
                <span>{val.name}</span>
              </Item>
            )}
          </Form2.VirtualSelect>
          <Form2.ButtonGroup
            control={group.controls.qualityName}
            buttonDefinitions={props.qualities.map((quality) => {
              return {
                children: quality.fullName,
                value: quality.name,
              };
            })}
          />
        </Column>
      </form>
    </Dialog>
  );
}

const Item = styled("div", {
  base: {
    height: "60px",
    display: "flex",
    position: "relative",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-sm)",
  },
  variants: {
    selected: {
      true: {
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",
      },
    },
  },
});
