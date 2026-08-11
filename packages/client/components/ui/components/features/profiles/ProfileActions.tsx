import { Show, createResource } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { useNavigate } from "@solidjs/router";
import { PublicBot, ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";

import MdCancel from "@material-design-icons/svg/filled/cancel.svg?component-solid";
import MdEdit from "@material-design-icons/svg/filled/edit.svg?component-solid";
import MdMoreVert from "@material-design-icons/svg/filled/more_vert.svg?component-solid";

import { Button, IconButton } from "../../design";
import { iconSize } from "../../utils";

/**
 * Actions shown on profile cards
 */
export function ProfileActions(props: {
  width: 2 | 3;

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
        : { type: "settings", config: "user" },
    );
    if (!props.member) props.onClose();
  }

  return (
    <Actions width={props.width}>
      <Show when={props.user.relationship === "None" && !props.user.bot}>
        <Button onPress={() => props.user.addFriend()}>Add Friend</Button>
      </Show>
      <Show when={props.user.relationship === "Incoming"}>
        <Button onPress={() => props.user.addFriend()}>
          Accept friend request
        </Button>
        <IconButton onPress={() => props.user.removeFriend()}>
          <MdCancel />
        </IconButton>
      </Show>
      <Show when={props.user.relationship === "Outgoing"}>
        <Button onPress={() => props.user.removeFriend()}>
          Cancel friend request
        </Button>
      </Show>
      <Show when={props.user.relationship === "Friend"}>
        <Button onPress={openDm}>Message</Button>
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
  },
});
