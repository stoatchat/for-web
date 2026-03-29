import { mergeProps, splitProps } from "solid-js";

import { CONFIGURATION } from "@revolt/common";

import { type ActiveModal } from ".";
import { AddBotModal } from "./modals/AddBot";
import { AddFriendModal } from "./modals/AddFriend";
import { AddMembersToGroupModal } from "./modals/AddMembersToGroup";
import { BanMemberModal } from "./modals/BanMember";
import { BanNonMemberModal } from "./modals/BanNonMember";
import { ChangelogModal } from "./modals/Changelog";
import { ChannelInfoModal } from "./modals/ChannelInfo";
import { ChannelToggleMatureModal } from "./modals/ChannelToggleMature";
import { CreateBotModal } from "./modals/CreateBot";
import { CreateCategoryModal } from "./modals/CreateCategory";
import { CreateChannelModal } from "./modals/CreateChannel";
import { CreateGroupModal } from "./modals/CreateGroup";
import { CreateGroupOrServer } from "./modals/CreateGroupOrServer";
import { CreateInviteModal } from "./modals/CreateInvite";
import { CreateOrJoinServerModal } from "./modals/CreateOrJoinServer";
import { CreateRoleModal } from "./modals/CreateRole";
import { CreateServerModal } from "./modals/CreateServer";
import { CreateWebhookModal } from "./modals/CreateWebhook";
import { CustomStatusModal } from "./modals/CustomStatus";
import { DeleteBotModal } from "./modals/DeleteBot";
import { DeleteCategoryModal } from "./modals/DeleteCategory";
import { DeleteChannelModal } from "./modals/DeleteChannel";
import { DeleteMessageModal } from "./modals/DeleteMessage";
import { DeleteRoleModal } from "./modals/DeleteRole";
import { DeleteServerModal } from "./modals/DeleteServer";
import { EditCategoryModal } from "./modals/EditCategory";
import { EditEmailModal } from "./modals/EditEmail";
import { EditPasswordModal } from "./modals/EditPassword";
import { EditUsernameModal } from "./modals/EditUsername";
import { EmojiPreviewModal } from "./modals/EmojiPreview";
import { Error2Modal } from "./modals/Error2";
import { ImageViewerModal } from "./modals/ImageViewer";
import { InviteModal } from "./modals/Invite";
import { JoinServerModal } from "./modals/JoinServer";
import { KickMemberModal } from "./modals/KickMember";
import { LeaveServerModal } from "./modals/LeaveServer";
import { LinkWarningModal } from "./modals/LinkWarning";
import { MFAEnableTOTPModal } from "./modals/MFAEnableTOTP";
import { MFAFlowModal } from "./modals/MFAFlow";
import { MFARecoveryModal } from "./modals/MFARecovery";
import { OnboardingModal } from "./modals/Onboarding";
import { PolicyChangeModal } from "./modals/PolicyChange";
import { RenameSessionModal } from "./modals/RenameSession";
import { ReportContentModal } from "./modals/ReportContent";
import { ResetBotTokenModal } from "./modals/ResetBotToken";
import { ServerIdentityModal } from "./modals/ServerIdentity";
import { ServerInfoModal } from "./modals/ServerInfo";
import { SettingsModal } from "./modals/Settings";
import { SignOutSessionsModal } from "./modals/SignOutSessions";
import { SignedOutModal } from "./modals/SignedOut";
import { UserProfileModal } from "./modals/UserProfile";
import { UserProfileMutualFriendsModal } from "./modals/UserProfileMutualFriends";
import { UserProfileMutualGroupsModal } from "./modals/UserProfileMutualGroups";
import { UserProfileRolesModal } from "./modals/UserProfileRoles";

/**
 * Render the modal
 */
/* eslint-disable solid/reactivity */
/* eslint-disable solid/components-return-once */
export function RenderModal(props: ActiveModal & { onClose: () => void }) {
  if (CONFIGURATION.DEBUG) {
    console.info(
      "components/modal — modal renderer created for type:",
      props.props.type,
    );
  }

  const [modal2Props] = splitProps(props, ["show", "onClose"]);
  const modalProps = mergeProps(props.props, modal2Props);

  switch (modalProps.type) {
    case "add_bot":
      return <AddBotModal {...modalProps} />;
    case "add_friend":
      return <AddFriendModal {...modalProps} />;
    case "ban_member":
      return <BanMemberModal {...modalProps} />;
    case "ban_non_member":
      return <BanNonMemberModal {...modalProps} />;
    case "changelog":
      return <ChangelogModal {...modalProps} />;
    case "add_members_to_group":
      return <AddMembersToGroupModal {...modalProps} />;
    case "channel_info":
      return <ChannelInfoModal {...modalProps} />;
    case "channel_toggle_mature":
      return <ChannelToggleMatureModal {...modalProps} />;
    case "create_bot":
      return <CreateBotModal {...modalProps} />;
    case "create_category":
      return <CreateCategoryModal {...modalProps} />;
    case "create_channel":
      return <CreateChannelModal {...modalProps} />;
    case "create_group":
      return <CreateGroupModal {...modalProps} />;
    case "create_invite":
      return <CreateInviteModal {...modalProps} />;
    case "create_or_join_server":
      return <CreateOrJoinServerModal {...modalProps} />;
    case "create_group_or_server":
      return <CreateGroupOrServer {...modalProps} />;
    case "create_role":
      return <CreateRoleModal {...modalProps} />;
    case "create_server":
      return <CreateServerModal {...modalProps} />;
    case "create_webhook":
      return <CreateWebhookModal {...modalProps} />;
    case "custom_status":
      return <CustomStatusModal {...modalProps} />;
    case "delete_bot":
      return <DeleteBotModal {...modalProps} />;
    case "delete_channel":
      return <DeleteChannelModal {...modalProps} />;
    case "delete_category":
      return <DeleteCategoryModal {...modalProps} />;
    case "delete_message":
      return <DeleteMessageModal {...modalProps} />;
    case "delete_role":
      return <DeleteRoleModal {...modalProps} />;
    case "delete_server":
      return <DeleteServerModal {...modalProps} />;
    case "edit_email":
      return <EditEmailModal {...modalProps} />;
    case "edit_password":
      return <EditPasswordModal {...modalProps} />;
    case "edit_username":
      return <EditUsernameModal {...modalProps} />;
    case "emoji_preview":
      return <EmojiPreviewModal {...modalProps} />;
    case "error2":
      return <Error2Modal {...modalProps} />;
    case "image_viewer":
      return <ImageViewerModal {...modalProps} />;
    case "invite":
      return <InviteModal {...modalProps} />;
    case "join_server":
      return <JoinServerModal {...modalProps} />;
    case "kick_member":
      return <KickMemberModal {...modalProps} />;
    case "leave_server":
      return <LeaveServerModal {...modalProps} />;
    case "link_warning":
      return <LinkWarningModal {...modalProps} />;
    case "mfa_enable_totp":
      return <MFAEnableTOTPModal {...modalProps} />;
    case "mfa_flow":
      return <MFAFlowModal {...modalProps} />;
    case "mfa_recovery":
      return <MFARecoveryModal {...modalProps} />;
    case "onboarding":
      return <OnboardingModal {...modalProps} />;
    case "policy_change":
      return <PolicyChangeModal {...modalProps} />;
    case "rename_session":
      return <RenameSessionModal {...modalProps} />;
    case "report_content":
      return <ReportContentModal {...modalProps} />;
    case "server_identity":
      return <ServerIdentityModal {...modalProps} />;
    case "server_info":
      return <ServerInfoModal {...modalProps} />;
    case "settings":
      return <SettingsModal {...modalProps} />;
    case "signed_out":
      return <SignedOutModal {...modalProps} />;
    case "sign_out_sessions":
      return <SignOutSessionsModal {...modalProps} />;
    case "user_profile":
      return <UserProfileModal {...modalProps} />;
    case "user_profile_roles":
      return <UserProfileRolesModal {...modalProps} />;
    case "user_profile_mutual_friends":
      return <UserProfileMutualFriendsModal {...modalProps} />;
    case "user_profile_mutual_groups":
      return <UserProfileMutualGroupsModal {...modalProps} />;
    case "reset_bot_token":
      return <ResetBotTokenModal {...modalProps} />;
    case "edit_category":
      return <EditCategoryModal {...modalProps} />;

    default:
      console.error(
        "Failed to create modal for",
        props.props.type,
        "as it is not registered.",
      );
  }
}
