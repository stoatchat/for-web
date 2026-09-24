import { plural } from "@lingui/core/macro";
import { useLingui } from "@lingui/solid/macro";
import { useClient } from "@revolt/client";
import { useUser } from "@revolt/markdown/users";
import { useState } from "@revolt/state";
import {
  Avatar,
  CircularProgress,
  Column,
  List,
  Row,
  Symbol,
  Time,
  typography,
} from "@revolt/ui";
import { Match, Show, Suspense, Switch } from "solid-js";
import { API, Server } from "stoat.js";
import { decodeTime } from "ulid";
import { EditViewer } from "./Diff";

type EntryProps = {
  entry: API.AuditLogEntry;
  server: Server;
};

export function EntryRenderer(props: EntryProps) {
  return (
    <Show
      fallback={
        <List.Item nonclickable>
          <Icon slot="icon" type={props.entry.action.type} />
          <Title entry={props.entry} />
        </List.Item>
      }
      when={(
        [
          "ChannelEdit",
          "ChannelRolePermissionsEdit",
          "ServerEdit",
          "RoleEdit",
          "MemberEdit",
          "RolesReorder",
        ] as API.AuditLogEntryAction["type"][]
      ).includes(props.entry.action.type)}
    >
      <List.Collapse
        id={props.entry._id}
        header={
          <>
            <Icon slot="icon" type={props.entry.action.type} />
            <Title entry={props.entry} />
          </>
        }
      >
        <EditViewer action={props.entry.action} server={props.server} />
      </List.Collapse>
    </Show>
  );
}

function Title(props: { entry: API.AuditLogEntry }) {
  const title = useActionTranslation();

  const userID = () => props.entry.user;
  const user = useUser(userID);

  const { datePerSecond } = useState();

  return (
    <Row align>
      <Suspense fallback={<CircularProgress />}>
        <Avatar
          size={24}
          src={user()?.user?.animatedAvatarURL}
          fallback={user()?.username ?? "Unknown"}
        />
      </Suspense>
      <Column gap="none">
        <span class={typography({ class: "title", size: "small" })}>
          {title(props.entry)}
        </span>
        <span class={typography({ class: "label" })}>
          <Show when={props.entry.reason}>
            <span>{props.entry.reason} - </span>
          </Show>
          <Time
            format="relative"
            value={decodeTime(props.entry._id)}
            referenceTime={datePerSecond()}
          />
        </span>
      </Column>
    </Row>
  );
}

function useActionTranslation() {
  const { t } = useLingui();
  const client = useClient();

  return (entry: API.AuditLogEntry) => {
    const user = client().users.get(entry.user);
    // This server will always be in cache unless it's deleted, then everything is fucked
    const thisServer = client().servers.get(entry.server)!;
    const action = entry.action;
    switch (action.type) {
      case "MessageDelete": {
        const channel = client().channels.get(action.channel);
        const author = client().users.get(action.author);
        return t`@${user?.username} deleted a message from @${author?.username} in #${channel?.name}`;
      }
      case "MessageBulkDelete": {
        const channel = client().channels.get(action.channel);
        return plural(action.count, {
          one: `@${user?.username ?? "unknown"} deleted 1 message in '#'${channel?.name}`,
          other: `@${user?.username ?? "unknown"} deleted ${action.count} messages in '#'${channel?.name}`,
        });
      }
      case "MessagePin": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username ?? "unknown"} pinned a message in #${channel?.name}`;
      }
      case "MessageUnpin": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username ?? "unknown"} unpinned a message in #${channel?.name}`;
      }
      case "BanCreate": {
        const bannedUser = client().users.get(action.user);
        return t`@${user?.username} banned @${bannedUser?.username}`;
      }
      case "BanDelete": {
        const bannedUser = client().users.get(action.user);
        return t`@${user?.username} pardoned @${bannedUser?.username}`;
      }
      case "ChannelCreate":
        return t`@${user?.username} created #${action.name}`;
      case "ChannelDelete":
        return t`@${user?.username} deleted #${action.name}`;
      case "ChannelEdit": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} edited #${channel?.name}`;
      }
      case "ChannelRolePermissionsEdit": {
        const role = thisServer.roles.get(action.role);
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} edited permissions for "${role?.name}" in #${channel?.name}`;
      }
      case "EmojiCreate":
        return t`@${user?.username} created a new emoji`;
      case "EmojiDelete":
        return t`@${user?.username} removed the :${action.name}: emoji`;
      case "EmojiUpdate":
        return t`@${user?.username} renamed :${action.before.name}: to :${action.after.name}:`;
      case "MemberEdit": {
        const member = client().users.get(action.user);
        if (entry.user === action.user) {
          return t`@${user?.username} changed their server identity`;
        }

        return t`@${user?.username} edited @${member?.username}`;
      }
      case "MemberKick": {
        const kickedUser = client().users.get(action.user);
        return t`@${user?.username} kicked ${kickedUser?.username}`;
      }
      case "ServerEdit":
        return t`@${user?.username} edited this server`;
      case "RoleEdit": {
        const role = thisServer.roles.get(action.role);
        return t`@${user?.username} edited the "${role?.name}" role`;
      }
      case "RoleCreate": {
        return t`@${user?.username} created the "${(entry.action as { type: "RoleCreate" } & API.AuditLogEntryAction).name}" role`;
      }
      case "RoleDelete": {
        const role = thisServer.roles.get(action.role);
        return t`@${user?.username} deleted the "${role?.name}" role`;
      }
      case "RolesReorder":
        return t`@${user?.username} changed the position of roles`;
      case "InviteCreate":
        return t`@${user?.username} created an invite`;
      case "InviteDelete":
        return t`@${user?.username} revoked an invite`;
      case "WebhookCreate": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} created a webhook in #${channel?.name}`;
      }
      case "WebhookDelete": {
        const channel = client().channels.get(action.channel);
        return t`@${user?.username} deleted a webhook in #${channel?.name}`;
      }
    }
  };
}

type ActionIconProps = {
  slot?: string;
  type: API.AuditLogEntryAction["type"];
};

/**
 * Show the proper icon for the passed action
 */
function Icon(props: ActionIconProps) {
  return (
    <div slot={props.slot}>
      <Switch fallback={<Symbol>question_mark</Symbol>}>
        <Match
          when={
            props.type === "MessageDelete" ||
            props.type === "ChannelDelete" ||
            props.type === "RoleDelete" ||
            props.type === "WebhookDelete" ||
            props.type === "EmojiDelete"
          }
        >
          <Symbol>delete</Symbol>
        </Match>
        <Match when={props.type === "MessageBulkDelete"}>
          <Symbol>delete_sweep</Symbol>
        </Match>
        <Match when={props.type === "MessagePin"}>
          <Symbol>keep</Symbol>
        </Match>
        <Match when={props.type === "MessageUnpin"}>
          <Symbol>keep_off</Symbol>
        </Match>
        <Match when={props.type === "BanCreate"}>
          <Symbol>gavel</Symbol>
        </Match>
        <Match when={props.type === "BanDelete"}>
          <Symbol>person_check</Symbol>
        </Match>
        <Match when={props.type === "ChannelCreate"}>
          <Symbol>tag</Symbol>
        </Match>
        <Match when={props.type === "RoleCreate"}>
          <Symbol>new_label</Symbol>
        </Match>
        <Match
          when={
            props.type === "ChannelEdit" ||
            props.type === "ChannelRolePermissionsEdit" ||
            props.type === "RoleEdit" ||
            props.type === "EmojiUpdate" ||
            props.type === "ServerEdit"
          }
        >
          <Symbol>edit</Symbol>
        </Match>
        <Match when={props.type === "MemberEdit"}>
          <Symbol>person_edit</Symbol>
        </Match>
        <Match when={props.type === "WebhookCreate"}>
          <Symbol>webhook</Symbol>
        </Match>
        <Match when={props.type === "MemberKick"}>
          <Symbol>person_remove</Symbol>
        </Match>
        <Match when={props.type === "RolesReorder"}>
          <Symbol>reorder</Symbol>
        </Match>
        <Match when={props.type === "InviteCreate"}>
          <Symbol>add_link</Symbol>
        </Match>
        <Match when={props.type === "InviteDelete"}>
          <Symbol>link_off</Symbol>
        </Match>
        <Match when={props.type === "EmojiCreate"}>
          <Symbol>add_reaction</Symbol>
        </Match>
      </Switch>
    </div>
  );
}
