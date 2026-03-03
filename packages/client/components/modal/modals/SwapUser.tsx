import { For, Show } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import { useClientLifecycle } from "@revolt/client";
import { useState } from "@revolt/state";
import { Avatar, Dialog, DialogProps, MenuButton } from "@revolt/ui";

import { Modals } from "../types";

export function SwapUserModal(
  props: DialogProps & Modals & { type: "swap_user" },
) {
  const { auth } = useState();
  const { swapAccount } = useClientLifecycle();

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Choose an account</Trans>}
      actions={[{ text: <Trans>Close</Trans> }]}
    >
      <For each={auth.getSaved()}>
        {(ses) => (
          <MenuButton
            noDrawer
            icon={
              <Show when={ses.cachedAvatar}>
                <Avatar src={ses.cachedAvatar} size={32} />
              </Show>
            }
            onClick={() => {
              props.onClose();
              swapAccount(ses.userId);
            }}
          >
            {ses.cachedName || `User ${ses.userId}`}
          </MenuButton>
        )}
      </For>
    </Dialog>
  );
}
