import { For, createSignal } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Emoji } from "@revolt/markdown/emoji";
import { useUsers } from "@revolt/markdown/users";
import {
  Avatar,
  Button,
  ColouredText,
  Column,
  Dialog,
  DialogProps,
  List,
  OverflowingText,
  Row,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * View reactions modal
 */
export function ViewReactionsModal(
  props: DialogProps & Modals & { type: "view_reactions" },
) {
  const { openModal } = useModals();

  const [picked, setPicked] = createSignal<string>();

  const emojis = () => [...props.message.reactions.keys()];

  const showing = () => {
    const available = emojis();
    const current = picked();
    return current && available.includes(current) ? current : available[0];
  };

  // Only use cached users to avoid mass fetching on large reaction sets
  const users = useUsers(
    () => {
      const emoji = showing();
      return emoji ? [...(props.message.reactions.get(emoji) ?? [])] : [];
    },
    false,
    true,
  );

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Reactions</Trans>}
      actions={[{ text: <Trans>Close</Trans> }]}
    >
      <Column gap="lg">
        <Row wrap gap="sm">
          <For each={emojis()}>
            {(emoji) => (
              <Button
                size="xs"
                group="standard"
                groupActive={showing() === emoji}
                aria-pressed={showing() === emoji}
                onPress={() => setPicked(emoji)}
              >
                <Row align gap="sm">
                  <Emoji emoji={emoji} />
                  {props.message.reactions.get(emoji)?.size}
                </Row>
              </Button>
            )}
          </For>
        </Row>
        <ReactionUserList>
          <List>
            <For each={users()}>
              {(user) => (
                <List.Item
                  disabled={!user?.user}
                  onClick={() => {
                    if (user?.user) {
                      openModal({
                        type: "user_profile",
                        user: user.user,
                        member: user.member,
                      });
                    }
                  }}
                >
                  <Avatar
                    slot="icon"
                    size={36}
                    src={user?.avatar}
                    fallback={user?.username}
                  />
                  <OverflowingText>
                    <ColouredText colour={user?.colour ?? undefined}>
                      {user?.username}
                    </ColouredText>
                  </OverflowingText>
                </List.Item>
              )}
            </For>
          </List>
        </ReactionUserList>
      </Column>
    </Dialog>
  );
}

/**
 * Scrollable container for the list of users who reacted
 */
const ReactionUserList = styled("div", {
  base: {
    maxHeight: "320px",
    overflowY: "auto",
    scrollbarColor: "var(--md-sys-color-primary) transparent",
  },
});
