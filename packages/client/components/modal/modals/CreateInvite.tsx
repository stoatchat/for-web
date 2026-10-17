import { createFormControl, createFormGroup } from "solid-forms";
import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { styled } from "styled-system/jsx";

import { useDurationFormat } from "@revolt/i18n/durations";
import { useInstance } from "@revolt/instance";
import Instance from "@revolt/instance/Instance";
import { Column, Dialog, DialogProps, Form2, MenuItem } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Code block which displays invite
 */
const Invite = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",

    "& code": {
      padding: "1em",
      userSelect: "all",
      fontSize: "1.4em",
      textAlign: "center",
      fontFamily: "var(--fonts-monospace)",
    },
  },
});

/** Get absolute link from invite id */
export const getInviteLink = (id: string, inst: Instance) =>
  inst.isStoat ? `https://stt.gg/${id}` : inst.href(`/invite/${id}`);

const EXPIRY_SECONDS = ["0", "3600", "86400", "604800", "2592000"] as const;
const MAX_USES = ["0", "1", "5", "10", "25", "50", "100"] as const;

/**
 * Modal to create a new invite
 */
export function CreateInviteModal(
  props: DialogProps & Modals & { type: "create_invite" },
) {
  const { t } = useLingui();
  const { showError } = useModals();
  const [link, setLink] = createSignal<string>();
  const instance = useInstance();
  const duration = useDurationFormat();

  const expiryLabels: Record<(typeof EXPIRY_SECONDS)[number], string> = {
    "0": t`Never`,
    "3600": duration({ hours: 1 }),
    "86400": duration({ days: 1 }),
    "604800": duration({ weeks: 1 }),
    "2592000": duration({ days: 30 }),
  };

  const form = createFormGroup({
    expiry: createFormControl<string>("0"),
    maxUses: createFormControl<string>("0"),
  });

  const fetchInvite = useMutation(() => ({
    mutationFn: () => {
      const expirySeconds = Number(form.controls.expiry.value);
      const maxUses = Number(form.controls.maxUses.value);

      return props.channel
        .createInvite({
          expires: expirySeconds
            ? new Date(Date.now() + expirySeconds * 1000).toISOString()
            : undefined,
          max_uses: maxUses || undefined,
        })
        .then(({ _id }) => setLink(getInviteLink(_id, instance)));
    },
    onError: showError,
  }));

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create Invite</Trans>}
      actions={
        link()
          ? [
              { text: <Trans>OK</Trans> },
              {
                text: <Trans>Copy Link</Trans>,
                onClick: () => {
                  navigator.clipboard.writeText(link()!);
                  return false;
                },
              },
            ]
          : [
              { text: <Trans>Cancel</Trans> },
              {
                text: <Trans>Create</Trans>,
                onClick: () => {
                  fetchInvite.mutate();
                  return false;
                },
                isDisabled: fetchInvite.isPending,
              },
            ]
      }
      isDisabled={fetchInvite.isPending}
    >
      <Show
        when={link()}
        fallback={
          <Column gap="s">
            <Form2.Select
              label={t`Expire After`}
              control={form.controls.expiry}
            >
              <For each={EXPIRY_SECONDS}>
                {(value) => (
                  <MenuItem value={value}>{expiryLabels[value]}</MenuItem>
                )}
              </For>
            </Form2.Select>
            <Form2.Select label={t`Max Uses`} control={form.controls.maxUses}>
              <For each={MAX_USES}>
                {(value) => (
                  <MenuItem value={value}>
                    {value === "0" ? <Trans>No limit</Trans> : value}
                  </MenuItem>
                )}
              </For>
            </Form2.Select>
          </Column>
        }
      >
        <Invite>
          <Trans>
            Here is your new invite code: <code>{link()}</code>
          </Trans>
        </Invite>
      </Show>
    </Dialog>
  );
}
