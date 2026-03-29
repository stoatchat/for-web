import {
  API,
  Bot,
  Channel,
  Client,
  Emoji,
  File,
  ImageEmbed,
  MFA,
  MFATicket,
  Message,
  PublicBot,
  PublicChannelInvite,
  Server,
  ServerMember,
  ServerRole,
  Session,
  User,
  VideoEmbed,
} from "stoat.js";
import { ProtocolV1 } from "stoat.js/lib/events/v1";

import type { SettingsConfigurations } from "@revolt/app";
import { CategoryData } from "@revolt/app/menus/CategoryContextMenu";

export type Modals =
  | {
      type: "add_bot";
      invite: PublicBot;
    }
  | {
      type: "add_friend";
      client: Client;
    }
  | {
      type: "add_members_to_group";
      client: Client;
      group: Channel;
    }
  | {
      type: "ban_member";
      member: ServerMember;
    }
  | {
      type: "ban_non_member";
      user: User;
      server: Server;
    }
  | {
      type: "changelog";
      initial?: number;
    }
  | {
      type: "channel_info";
      channel: Channel;
    }
  | {
      type: "channel_toggle_mature";
      channel: Channel;
    }
  | {
      type: "create_bot";
      client: Client;
      onCreate: (bot: Bot) => void;
    }
  | {
      type: "create_category";
      server: Server;
    }
  | {
      type: "create_channel";
      server: Server;
      cb?: (channel: Channel) => void;
    }
  | {
      type: "create_group";
      client: Client;
    }
  | {
      type: "create_role";
      server: Server;
      callback: (id: string) => void;
    }
  | {
      type: "create_or_join_server";
      client: Client;
    }
  | {
      type: "create_group_or_server";
      client: Client;
    }
  | {
      type: "create_invite";
      channel: Channel;
    }
  | {
      type: "create_server";
      client: Client;
    }
  | {
      type: "create_webhook";
      channel: Channel;
      callback: (id: string) => void;
    }
  | {
      type: "custom_status";
      client: Client;
    }
  | {
      type: "delete_bot";
      bot: Bot;
    }
  | {
      type: "delete_channel";
      channel: Channel;
    }
  | {
      type: "delete_category";
      server: Server;
      categoryId: string;
    }
  | {
      type: "delete_message";
      message: Message;
    }
  | {
      type: "delete_server";
      server: Server;
    }
  | {
      type: "delete_role";
      role: ServerRole;
      cb: () => void;
    }
  | {
      type: "edit_email";
      client: Client;
    }
  | {
      type: "edit_password";
      client: Client;
    }
  | {
      type: "edit_username";
      client: Client;
    }
  | {
      type: "emoji_preview";
      emoji: Emoji;
    }
  | {
      /**
       * @deprecated build proper error handling!
       */
      type: "error";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: any;
    }
  | {
      type: "error2";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: any;
    }
  | {
      type: "image_viewer";
      embed?: ImageEmbed;
      gif?: VideoEmbed;
      file?: File;
    }
  | {
      type: "join_server";
      client: Client;
    }
  | {
      type: "kick_member";
      member: ServerMember;
    }
  | {
      type: "leave_server";
      server: Server;
    }
  | {
      type: "mfa_enable_totp";
      identifier: string;
      secret: string;
      callback: (code?: string) => void;
    }
  | ({
      type: "mfa_flow";
    } & (
      | {
          mfa: MFA;
          state: "known";
          callback: (ticket?: MFATicket) => void;
        }
      | {
          state: "unknown";
          available_methods: API.MFAMethod[];
          callback: (response?: API.MFAResponse) => void;
        }
    ))
  | { type: "mfa_recovery"; codes: string[]; mfa: MFA }
  | {
      type: "onboarding";
      callback: (username: string, loginAfterSuccess?: true) => Promise<void>;
    }
  | {
      type: "policy_change";
      changes: ProtocolV1["types"]["policyChange"][];
      acknowledge: () => Promise<void>;
    }
  | {
      type: "rename_session";
      session: Session;
    }
  | {
      type: "report_content";
      client: Client;
      target: Server | User | Message;
      contextMessage?: Message;
    }
  | {
      type: "server_identity";
      member: ServerMember;
    }
  | {
      type: "server_info";
      server: Server;
    }
  | {
      type: "invite";
      invite: PublicChannelInvite;
    }
  | {
      type: "settings";
      config: keyof typeof SettingsConfigurations;
      // eslint-disable-next-line
      context?: any;
    }
  | {
      type: "signed_out";
    }
  | {
      type: "sign_out_sessions";
      client: Client;
    }
  // unimplemented: (modals.tsx#L58)
  | {
      type: "report_success";
      user?: User;
    }
  | {
      type: "out_of_date";
      version: string;
    }
  | {
      type: "reset_bot_token";
      bot: Bot;
    }
  | {
      type: "link_warning";
      url: URL;
      display: string;
    }
  // | {
  //     type: "pending_friend_requests";
  //     users: User[];
  //   }
  | {
      type: "user_picker";
      omit?: string[];
      callback: (users: string[]) => Promise<void>;
    }
  | {
      type: "user_profile";
      user: User;
      isPlaceholder?: boolean;
      placeholderProfile?: API.UserProfile;
    }
  | {
      type: "user_profile_roles";
      member: ServerMember;
    }
  | {
      type: "user_profile_mutual_friends";
      users: User[];
    }
  | {
      type: "user_profile_mutual_groups";
      groups: (Server | Channel)[];
    }
  | {
      type: "leave_group";
      channel: Channel;
    }
  | {
      type: "close_dm";
      channel: Channel;
    }
  | {
      type: "unfriend_user";
      user: User;
    }
  | {
      type: "block_user";
      user: User;
    }
  | {
      type: "import_theme";
    }
  | {
      type: "edit_category";
      server: Server;
      category: CategoryData;
    };
