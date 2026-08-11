import { For } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { useNavigate } from "@solidjs/router";

import { Avatar, Dialog, DialogProps, List, OverflowingText } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

export function UserProfileMutualGroupsModal(
  props: DialogProps & Modals & { type: "user_profile_mutual_groups" },
) {
  const navigate = useNavigate();
  const { closeAll } = useModals();

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Mutual Groups</Trans>}
      actions={[{ text: <Trans>Close</Trans> }]}
    >
      <List>
        <For each={props.groups}>
          {(group) => (
            <List.Item
              onClick={() => {
                navigate(group.path);
                closeAll();
              }}
            >
              <Avatar
                slot="icon"
                size={36}
                src={group.animatedIconURL}
                fallback={group.name}
              />
              <OverflowingText>{group.name}</OverflowingText>
            </List.Item>
          )}
        </For>
      </List>
    </Dialog>
  );
}
