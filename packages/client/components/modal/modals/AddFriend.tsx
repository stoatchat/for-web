import { createFormControl, createFormGroup } from "solid-forms";
import { Match, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Dialog, DialogProps, Form2, Symbol } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Add a new friend by username and discriminator
 */
export function AddFriendModal(
  props: DialogProps & Modals & { type: "add_friend" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    username: createFormControl("", { required: true }),
    discriminator: createFormControl("", { required: true }),
  });

  const usernameInvalid = () =>
    group.controls.username.isDirty && !group.controls.username.isValid;
  const discriminatorInvalid = () =>
    group.controls.discriminator.isDirty &&
    !group.controls.discriminator.isValid;

  async function onSubmit() {
    try {
      await props.client.api.post(`/users/friend`, {
        username: `${group.controls.username.value}#${group.controls.discriminator.value}`,
      });

      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  const submit = Form2.useSubmitHandler(group, onSubmit);

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
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={submit}>
        <Row>
          <Username>
            <Form2.TextField
              name="username"
              control={group.controls.username}
              label={t`Username`}
              placeholder={t`username`}
              maxlength={32}
            />
          </Username>

          <Separator>
            <Symbol>grid_3x3</Symbol>
          </Separator>

          <Discriminator>
            <Form2.TextField
              name="discriminator"
              control={group.controls.discriminator}
              label={t`Tag`}
              placeholder={t`1234`}
              type="text"
              inputmode="numeric"
              pattern="[0-9]{4}"
              maxlength={4}
            />
          </Discriminator>
        </Row>

        <Supporting invalid={usernameInvalid() || discriminatorInvalid()}>
          <Switch>
            <Match when={usernameInvalid() && discriminatorInvalid()}>
              <Trans>Please enter a username and a 4-digit tag.</Trans>
            </Match>
            <Match when={usernameInvalid()}>
              <Trans>Please enter a username.</Trans>
            </Match>
            <Match when={discriminatorInvalid()}>
              <Trans>The tag must be exactly 4 digits.</Trans>
            </Match>
          </Switch>
        </Supporting>
      </form>
    </Dialog>
  );
}

const Row = styled("div", {
  base: {
    display: "flex",
    alignItems: "flex-start",
    gap: "var(--gap-md)",

    // TODO: remove once we switch away from mdui (errors are shown in <Supporting>)
    "& mdui-text-field::part(error-icon), & mdui-text-field::part(supporting)":
      {
        display: "none",
      },
  },
});

const Supporting = styled("div", {
  base: {
    paddingInline: "16px",
    paddingTop: "var(--gap-xs)",
    fontSize: "12px",
    lineHeight: "16px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
  variants: {
    invalid: {
      true: {
        color: "var(--md-sys-color-error)",
      },
    },
  },
});

const Username = styled("div", {
  base: {
    flexGrow: 1,
    minWidth: 0,
  },
});

const Discriminator = styled("div", {
  base: {
    flexGrow: 1,
    width: "110px",
    minWidth: 0,
  },
});

const Separator = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    color: "var(--md-sys-color-on-surface-variant)",
    marginTop: "16px",
  },
});
