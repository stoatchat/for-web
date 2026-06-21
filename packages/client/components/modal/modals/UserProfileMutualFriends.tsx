import { For } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import { Avatar, Dialog, DialogProps, List, OverflowingText } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function UserProfileMutualFriendsModal(
  props: DialogProps & Modals & { type: "user_profile_mutual_friends" },
) {
  const { openModal } = useModals();

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Mutual Friends</Trans>}
      actions={[{ text: <Trans>Close</Trans> }]}
    >
      <List>
        <For each={props.users}>
          {(user) => (
            <List.Item
              onClick={() =>
                openModal({
                  type: "user_profile",
                  user,
                  member: props.server?.getMember(user.id),
                })
              }
            >
              <Avatar
                slot="icon"
                size={36}
                src={user.animatedAvatarURL}
                fallback={user.displayName}
              />
              <OverflowingText>{user.username}</OverflowingText>
            </List.Item>
          )}
        </For>
      </List>
    </Dialog>
  );
}
