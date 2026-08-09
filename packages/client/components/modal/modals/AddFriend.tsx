import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { createMemo, Show } from "solid-js";

import { Dialog, DialogProps, Form2 } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Add a new friend by username
 */
export function AddFriendModal(
  props: DialogProps & Modals & { type: "add_friend" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    username: createFormControl("", { required: true }),
  });

  async function onSubmit() {
    try {
      await props.client.api.post(`/users/friend`, {
        username: group.controls.username.value,
      });

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

  const hasDiscriminator = createMemo(() => {
    const v = group.controls.username.value ?? "";
    return /#\d+$/.test(v);
  });

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Add a new friend</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Send Request</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group) || !hasDiscriminator(),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <div style={{ position: "relative" }}>
          <Form2.TextField
            name="username"
            control={group.controls.username}
            label={t`Username`}
            placeholder={t`username#1234`}
          />

          <Show
            when={
              !hasDiscriminator() &&
              (group.controls.username.value ?? "").length > 0
            }
          >
            <div
              style={{
                position: "absolute",
                left: "0",
                right: "0",
                "margin-top": "4px",
                "pointer-events": "none",
              }}
            >
              <small
                style={{
                  display: "block",
                  color: "var(--md-sys-color-error)",
                  "font-size": "0.75rem",
                }}
              >
                {t`username#1234 required`}
              </small>
            </div>
          </Show>
        </div>
      </form>
    </Dialog>
  );
}
