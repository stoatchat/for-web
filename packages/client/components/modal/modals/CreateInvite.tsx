import { Show, createSignal, onMount } from "solid-js";

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
  const [link, setLink] = createSignal("...");
  const instance = useInstance();

  const setId = (id: string) =>
    setLink(
      instance.isStoat
        ? `https://stt.gg/${id}`
        : instance.href(`/invite/${id}`),
    );

  const fetchInvite = useMutation(() => ({
    mutationFn: () =>
      props.channel.createInvite().then(({ _id }) => setId(_id)),
    onError: showError,
  }));

  onMount(() => {
    if (props.id) setId(props.id);
    else fetchInvite.mutate();
  });

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={
        <Show when={props.id} fallback={<Trans>Create Invite</Trans>}>
          <Trans>View Invite</Trans>
        </Show>
      }
      actions={[
        { text: <Trans>OK</Trans> },
        {
          text: <Trans>Copy Link</Trans>,
          onClick: () => {
            navigator.clipboard.writeText(link());
            return false;
          },
        },
      ]}
    >
      <Show
        when={!fetchInvite.isPending}
        fallback={<Trans>Generating invite…</Trans>}
      >
        <Invite>
          <Trans>Here is your invite code:</Trans>
          <code>{link()}</code>
        </Invite>
      </Show>
    </Dialog>
  );
}
