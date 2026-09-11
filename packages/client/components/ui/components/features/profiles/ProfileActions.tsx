import { Show, createResource } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { useNavigate } from "@solidjs/router";
import { PublicBot, ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";

import MdCancel from "@material-design-icons/svg/filled/cancel.svg?component-solid";
import MdChat from "@material-design-icons/svg/filled/chat.svg?component-solid";
import MdCheck from "@material-design-icons/svg/filled/check.svg?component-solid";
import MdEdit from "@material-design-icons/svg/filled/edit.svg?component-solid";
import MdMoreVert from "@material-design-icons/svg/filled/more_vert.svg?component-solid";
import MdPersonAdd from "@material-design-icons/svg/filled/person_add.svg?component-solid";

import { Button, IconButton } from "../../design";
import { iconSize } from "../../utils";

/**
 * Actions shown on profile cards
 */
export function ProfileActions(props: {
  width: 2 | 3;

  /**
   * Render friend/message actions as compact icon-only buttons
   * instead of full text buttons (used in the floating user card).
   */
  compact?: boolean;

  user: User;
  member?: ServerMember;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const client = useClient();
  const { openModal } = useModals();

  const [publicBot] = createResource(
    () => props.user.bot && props.user.id,
    (id) =>
      client()
        .bots.fetchPublic(id)
        .then((b) => (b instanceof PublicBot ? b : new PublicBot(client(), b)))
        .catch(() => {}),
  );

  /**
   * Open direct message channel
   */
  function openDm() {
    props.user.openDM().then((channel) => navigate(channel.path));
    props.onClose();
  }

  /**
   * Open edit menu
   */
  function openEdit() {
    openModal(
      props.member
        ? { type: "server_identity", member: props.member }
        : {
            type: "settings",
            config: "user",
            context: { page: "profile" },
          },
    );
    if (!props.member) props.onClose();
  }

  return (
    <Actions width={props.width} compact={props.compact}>
      <Show when={props.user.relationship === "None" && !props.user.bot}>
        <Show
          when={props.compact}
          fallback={
            <Button onPress={() => props.user.addFriend()}>
              Add Friend
            </Button>
          }
        >
          <IconButton onPress={() => props.user.addFriend()}>
            <MdPersonAdd {...iconSize(16)} />
          </IconButton>
        </Show>
      </Show>
      <Show when={props.user.relationship === "Incoming"}>
        <Show
          when={props.compact}
          fallback={
            <Button onPress={() => props.user.addFriend()}>
              Accept friend request
            </Button>
          }
        >
          <IconButton onPress={() => props.user.addFriend()}>
            <MdCheck {...iconSize(16)} />
          </IconButton>
        </Show>
        <IconButton onPress={() => props.user.removeFriend()}>
          <MdCancel {...(props.compact ? iconSize(16) : {})} />
        </IconButton>
      </Show>
      <Show when={props.user.relationship === "Outgoing"}>
        <Show
          when={props.compact}
          fallback={
            <Button onPress={() => props.user.removeFriend()}>
              Cancel friend request
            </Button>
          }
        >
          <IconButton onPress={() => props.user.removeFriend()}>
            <MdCancel {...iconSize(16)} />
          </IconButton>
        </Show>
      </Show>
      <Show when={props.user.relationship === "Friend"}>
        <Show when={props.compact} fallback={<Button onPress={openDm}>Message</Button>}>
          <IconButton onPress={openDm}>
            <MdChat {...iconSize(16)} />
          </IconButton>
        </Show>
      </Show>
      <Show when={publicBot()}>
        <Button
          onPress={() =>
            openModal({
              type: "add_bot",
              invite: publicBot()!,
            })
          }
        >
          <Trans>Add Bot</Trans>
        </Button>
      </Show>

      <Show
        when={
          props.member
            ? props.user.self
              ? props.member.server!.havePermission("ChangeNickname") ||
                props.member.server!.havePermission("ChangeAvatar")
              : (props.member.server!.havePermission("ManageNicknames") ||
                  props.member.server!.havePermission("RemoveAvatars")) &&
                props.member.inferiorTo(props.member!.server!.member!)
            : props.user.self
        }
      >
        <IconButton onPress={openEdit}>
          <MdEdit {...iconSize(16)} />
        </IconButton>
      </Show>

      <IconButton
        use:floating={{
          contextMenu: () => (
            <UserContextMenu
              user={props.user}
              member={props.member}
              onClose={props.onClose}
            />
          ),
          contextMenuHandler: "click",
        }}
      >
        <MdMoreVert />
      </IconButton>
    </Actions>
  );
}

const Actions = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    justifyContent: "flex-end",
  },
  variants: {
    width: {
      3: {
        gridColumn: "1 / 4",
      },
      2: {
        gridColumn: "1 / 3",
      },
    },
    compact: {
      true: {
        gap: "var(--gap-xs)",
      },
    },
  },
});
