import { Match, Switch, createSignal } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { styled } from "styled-system/jsx";

import { useInstance } from "@revolt/instance";
import { Dialog, DialogProps } from "@revolt/ui";

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

/**
 * Modal to create a new invite
 */
export function CreateInviteModal(
  props: DialogProps & Modals & { type: "create_invite" },
) {
  const { showError } = useModals();
  const [link, setLink] = createSignal<string>();
  const instance = useInstance();

  const fetchInvite = useMutation(() => ({
    mutationFn: () =>
      props.channel
        .createInvite()
        .then(({ _id }) =>
          setLink(
            instance.isStoat
              ? `https://stt.gg/${_id}`
              : instance.href(`/invite/${_id}`),
          ),
        ),
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
                text: <Trans>Create Invite</Trans>,
                isDisabled: fetchInvite.isPending,
                onClick: () => {
                  fetchInvite.mutate();
                  return false;
                },
              },
            ]
      }
    >
      <Switch
        fallback={
          <Trans>
            Anyone with this link will be able to join. The link is only created
            once you ask for it.
          </Trans>
        }
      >
        <Match when={fetchInvite.isPending}>
          <Trans>Generating invite…</Trans>
        </Match>
        <Match when={link()}>
          <Invite>
            <Trans>
              Here is your new invite code: <code>{link()}</code>
            </Trans>
          </Invite>
        </Match>
      </Switch>
    </Dialog>
  );
}
