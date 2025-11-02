import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { Channel, ServerMember, ServerRole, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { RE_UNICODE_EMOJI, unicodeEmojiUrl } from "@revolt/markdown/emoji/UnicodeEmoji";
import { userInformation } from "@revolt/markdown/users";
import { useSmartParams } from "@revolt/routing";

import { isInCodeBlock } from "./codeMirrorCommon";
import { parseUnicodeEmoji } from "@revolt/markdown/plugins/unicodeEmoji";

export function codeMirrorWidgets() {
  const getClient = useClient();
  const params = useSmartParams();

  const widgetMatcher = new MatchDecorator({
    regexp: new RegExp(
      RE_UNICODE_EMOJI.source +
      "|" +
      /:([0-7][0-9A-HJKMNP-TV-Z]{25}):|<@([0-7][0-9A-HJKMNP-TV-Z]{25})>|<#([0-7][0-9A-HJKMNP-TV-Z]{25})>|<%([0-7][0-9A-HJKMNP-TV-Z]{25})>/
        .source,
      "g",
    ),
    decoration: ([str, unicodeEmoji, emojiId, userId, channelId, roleId], view, pos) => {
      if (isInCodeBlock(view.state, pos, pos + str[0].length)) {
        return null;
      }

      const client = getClient();
      const { serverId } = params();

      let widget: WidgetType = null!;

      if (unicodeEmoji) {
        const { str, pack } = parseUnicodeEmoji(unicodeEmoji);

        widget = new EmojiWidget(
          unicodeEmojiUrl(pack, str),
        );
      } else if (emojiId) {
        widget = new EmojiWidget(
          `${client?.configuration?.features.autumn.url}/emojis/${emojiId}`,
        );
      } else if (userId) {
        const member = serverId
          ? getClient().serverMembers.getByKey({
            server: serverId,
            user: userId,
          })
          : undefined;

        const user = getClient().users.get(userId);

        widget = new UserMentionWidget(user, member);
      } else if (channelId) {
        const channel = getClient().channels.get(channelId);

        if (channel) {
          widget = new ChannelMentionWidget(channel);
        }
      } else if (roleId) {
        const role = getClient().servers.get(serverId!)?.roles.get(roleId);

        if (role) {
          widget = new RoleMentionWidget(role);
        }
      }

      return Decoration.replace({
        widget,
      });
    },
  });

  const widgetsPlugin = ViewPlugin.fromClass(
    class {
      placeholders: DecorationSet;
      constructor(view: EditorView) {
        this.placeholders = widgetMatcher.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.placeholders = widgetMatcher.updateDeco(update, this.placeholders);
      }
    },
    {
      decorations: (instance) => instance.placeholders,
      provide: (plugin) =>
        EditorView.atomicRanges.of((view) => {
          return view.plugin(plugin)?.placeholders || Decoration.none;
        }),
    },
  );

  return [widgetsPlugin, widgetsTheme];
}

const widgetsTheme = EditorView.theme({
  ".cm-emoji-widget span": {
    display: "inline-block",
    width: "auto",
    height: "1lh",
    "vertical-align": "bottom",
  },
  ".cm-emoji-widget img": {
    display: "inline-block",
    width: "1.375em",
    height: "1.375em",
    "vertical-align": "baseline",
    "margin-bottom": "-0.375em",
    "object-fit": "contain",
  },

  ".cm-mention-widget": {
    "vertical-align": "bottom",

    "gap": "4px",
    "padding-left": "2px",
    "padding-right": "6px",
    "align-items": "center",
    "display": "inline-flex",

    height: '1.4em', // same as line-height

    "font-weight": 600,
    "border-radius": "var(--borderRadius-lg)",

    color: "var(--md-sys-color-on-primary-container)",
    background: "var(--md-sys-color-primary-container)",
  },

  ".cm-mention-widget img": {
    width: "16px",
    height: "16px",
    objectFit: "cover",
    borderRadius: "var(--borderRadius-full)",
  }
});

class EmojiWidget extends WidgetType {
  private readonly url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  eq(other: EmojiWidget): boolean {
    return this.url === other.url;
  }

  toDOM() {
    const outer = document.createElement("span");
    const inner = document.createElement("span");
    const img = document.createElement("img");
    outer.classList.add("cm-emoji-widget");
    img.src = this.url;
    inner.appendChild(img);
    outer.appendChild(inner);
    return outer;
  }
}

class UserMentionWidget extends WidgetType {
  private readonly user: User | undefined;
  private readonly member: ServerMember | undefined;

  constructor(user?: User, member?: ServerMember) {
    super();
    this.user = user;
    this.member = member;
  }

  eq(other: UserMentionWidget): boolean {
    return this.user === other.user && this.member === other.member;
  }

  toDOM() {
    const mention = document.createElement("span");
    mention.classList.add("cm-mention-widget");
    mention.contentEditable = "false";

    const { username, avatar } = userInformation(this.user, this.member);

    if (avatar) {
      const image = document.createElement('img');
      image.src = avatar;
      mention.appendChild(image);
    } else {
      const icon = document.createElement('span');
      icon.innerText = "at";
      icon.classList.add('material-symbols-outlined');
      mention.appendChild(icon);
    }

    const name = document.createElement('span');
    name.textContent = username;
    mention.appendChild(name);

    return mention;
  }
}

class ChannelMentionWidget extends WidgetType {
  private readonly channel: Channel;

  constructor(channel: Channel) {
    super();
    this.channel = channel;
  }

  eq(other: ChannelMentionWidget): boolean {
    return this.channel === other.channel;
  }

  toDOM() {
    const mention = document.createElement("span");
    mention.classList.add("cm-mention-widget");
    mention.contentEditable = "false";

    const icon = document.createElement('span');
    icon.innerText = "tag";
    icon.classList.add('material-symbols-outlined');
    mention.appendChild(icon);

    const name = document.createElement('span');
    name.textContent = this.channel.name;
    mention.appendChild(name);

    return mention;
  }
}

class RoleMentionWidget extends WidgetType {
  private readonly role: ServerRole;

  constructor(role: ServerRole) {
    super();
    this.role = role;
  }

  eq(other: RoleMentionWidget): boolean {
    return this.role === other.role;
  }

  toDOM() {
    const span = document.createElement("span");
    span.classList.add("cm-mention-widget");
    span.contentEditable = "false";
    span.textContent = this.role.name;
    return span;
  }
}
