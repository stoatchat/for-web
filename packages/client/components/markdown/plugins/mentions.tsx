import { Match, Switch } from "solid-js";

import { Handler } from "mdast-util-to-hast";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useSmartParams } from "@revolt/routing";
import { Avatar, ColouredText, iconSize } from "@revolt/ui";

import MdAt from "@material-design-icons/svg/filled/alternate_email.svg?component-solid";

import { useUser } from "../users";

export function RenderMention(props: {
  mentions?: string;
  disabled?: boolean;
}) {
  return (
    <Switch fallback={<span>Invalid Mention Element</span>}>
      <Match when={props.mentions?.startsWith("user:")}>
        <UserMention
          userId={props.mentions!.substring(5)}
          disabled={props.disabled}
        />
      </Match>
      <Match when={props.mentions === "everyone"}>
        <span class={mention()}>
          <MdAt {...iconSize(16)} />
          everyone
        </span>
      </Match>
      <Match when={props.mentions === "online"}>
        <span class={mention()}>
          <MdAt {...iconSize(16)} />
          online
        </span>
      </Match>
      <Match when={props.mentions?.startsWith("role:")}>
        <RoleMention roleId={props.mentions!.substring(5)} />
      </Match>
    </Switch>
  );
}

export function UserMention(props: { userId: string; disabled?: boolean }) {
  const user = useUser(props.userId);
  const floatingProps = props.disabled
    ? undefined
    : {
        userCard: user().user
          ? {
              user: user().user!,
              member: user().member,
            }
          : undefined,
        contextMenu: () => (
          <UserContextMenu user={user().user!} member={user().member} />
        ),
      };
  return (
    <Switch
      fallback={<span class={mention({ valid: false })}>Unknown User</span>}
    >
      <Match when={user().user}>
        <div class={mention({ isLink: true })} use:floating={floatingProps}>
          <Avatar size={16} src={user().avatar} fallback={user().username} />
          <ColouredText colour={user().colour!}>{user().username}</ColouredText>
        </div>
      </Match>
    </Switch>
  );
}

export function RoleMention(props: { roleId: string }) {
  // some jank involved...
  const client = useClient();
  const params = useSmartParams();
  const role = () =>
    client().servers.get(params().serverId!)?.roles.get(props.roleId);

  return (
    <Switch
      fallback={<span class={mention({ valid: false })}>Unknown Role</span>}
    >
      <Match when={role()}>
        <div class={mention()}>
          <RoleIcon
            style={{
              background:
                role()!.colour ?? "var(--md-sys-color-outline-variant)",
            }}
          />
          <ColouredText colour={role()!.colour!}>{role()!.name}</ColouredText>
        </div>
      </Match>
    </Switch>
  );
}

const RoleIcon = styled("div", {
  base: {
    margin: "1px",
    width: "14px",
    height: "14px",
    aspectRatio: "1/1",
    borderRadius: "100%",
  },
});

const RE_MENTION =
  /(<@[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}>|@everyone|@online|<%[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}>)/;

export const remarkMentions: Plugin = () => (tree) => {
  visit(
    tree,
    "text",
    (
      node: { type: "text"; value: string },
      idx,
      parent: { children: any[] },
    ) => {
      const elements = node.value.split(RE_MENTION);
      if (elements.length === 1) return; // no matches

      const newNodes = elements.map((value, index) =>
        index % 2
          ? value.startsWith("<@")
            ? {
                type: "mention",
                mentions: "user:" + value.substring(2, value.length - 1),
              }
            : value === "@everyone"
              ? {
                  type: "mention",
                  mentions: "everyone",
                }
              : value === "@online"
                ? {
                    type: "mention",
                    mentions: "online",
                  }
                : {
                    type: "mention",
                    mentions: "role:" + value.substring(2, value.length - 1),
                  }
          : {
              type: "text",
              value,
            },
      );

      parent.children.splice(idx, 1, ...newNodes);
      return idx + newNodes.length;
    },
  );
};

export const mentionHandler: Handler = (h, node) => {
  return {
    type: "element" as const,
    tagName: "mention",
    children: [],
    properties: {
      mentions: node.mentions,
    },
  };
};

export const mention = cva({
  base: {
    verticalAlign: "bottom",

    gap: "4px",
    paddingLeft: "2px",
    paddingRight: "6px",
    alignItems: "center",
    display: "inline-flex",

    fontWeight: 600,
    borderRadius: "var(--borderRadius-lg)",

    color: "var(--md-sys-color-on-primary-container)",
    background: "var(--md-sys-color-primary-container)",
  },
  variants: {
    isLink: {
      true: {
        cursor: "pointer",
      },
    },
    valid: {
      false: {
        paddingLeft: "6px",
        cursor: "not-allowed",
      },
    },
    inEditor: {
      true: {
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",

        "& img": {
          width: "16px",
          height: "16px",
          objectFit: "cover",
          borderRadius: "var(--borderRadius-full)",
        },
      },
    },
  },
});
