import { Show } from "solid-js";

import { useNavigate } from "@solidjs/router";
import { ServerMember, User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useModals } from "@revolt/modal";

import MdCancel from "@material-design-icons/svg/filled/cancel.svg?component-solid";
import MdEdit from "@material-design-icons/svg/filled/edit.svg?component-solid";
import MdHistoryToggleOff from "@material-design-icons/svg/outlined/history_toggle_off.svg?component-solid";
import MdMoreVert from "@material-design-icons/svg/filled/more_vert.svg?component-solid";
import MdSchedule from "@material-design-icons/svg/outlined/schedule.svg?component-solid";

import { Button, IconButton } from "../../design";
import { dismissFloatingElements } from "../../floating";
import { iconSize } from "../../utils";

/**
 * Actions shown on profile cards
 */
export function ProfileActions(props: {
  width: 2 | 3 | 4;

  user: User;
  member?: ServerMember;
}) {
  const navigate = useNavigate();
  const { openModal } = useModals();

  /**
   * Open direct message channel
   */
  function openDm() {
    props.user.openDM().then((channel) => navigate(channel.url));
  }

  /**
   * Open edit menu
   */
  function openEdit() {
    if (props.member) {
      openModal({ type: "server_identity", member: props.member });
    } else {
      openModal({ type: "settings", config: "user" });
    }

    dismissFloatingElements();
  }

  /**
   * Timeout the user
   */
  function timeoutMember() {
    openModal({
      type: "timeout_member",
      member: props.member!,
    });

    dismissFloatingElements();
  }

  /**
   * Remove timeout for member
   */
  function removeTimeoutForMember() {
    openModal({
      type: "remove_timeout",
      member: props.member!,
    });

    dismissFloatingElements();
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

      <Show
        when={
          !props.user.self &&
          props.member?.server?.havePermission("TimeoutMembers") &&
          props.member.inferiorTo(props.member.server.member!) &&
          !props.member.timeout
        }
      >
        <IconButton onPress={timeoutMember}>
          <MdSchedule {...iconSize(16)} />
        </IconButton>
      </Show>
      <Show
        when={
          !props.user.self &&
          props.member?.server?.havePermission("TimeoutMembers") &&
          props.member.inferiorTo(props.member.server.member!) &&
          props.member.timeout
        }
      >
        <IconButton onPress={removeTimeoutForMember}>
          <MdHistoryToggleOff {...iconSize(16)} />
        </IconButton>
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
            <UserContextMenu user={props.user} member={props.member} />
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
      4: {
        gridColumn: "1 / 5",
      },
      3: {
        gridColumn: "1 / 4",
      },
      2: {
        gridColumn: "1 / 3",
      },
    },
  },
});
