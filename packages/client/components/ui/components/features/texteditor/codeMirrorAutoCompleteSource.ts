import { Accessor, createMemo } from "solid-js";

import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { User } from "stoat.js";

import { useClient } from "@revolt/client";
import { unicodeEmojiUrl } from "@revolt/markdown/emoji/UnicodeEmoji";
import { useState } from "@revolt/state";

import emojiMapping from "../../../emojiMapping.json";
import { AutoCompleteSearchSpace } from "../../utils/autoComplete";

import { isInCodeBlock } from "./codeMirrorCommon";

const EMOJI_KEYS = Object.keys(emojiMapping).sort();
const MAPPED_EMOJI_KEYS = EMOJI_KEYS.map(
  (id) =>
    ({
      type: "emoji",
      label: `:${id}:`,
      apply: emojiMapping[id as keyof typeof emojiMapping],
    }) as Completion,
);

const RE_match = /(?<!\w)[:@%#]\w*/;
let RE_emojiValidFor = /(?<!\w):\w*/;
let RE_mentionValidFor = /(?<!\w)@\w*/;
let RE_roleValidFor = /(?<!\w)@\w*/;
let RE_channelValidFor = /(?<!\w)#\w*/;

export function codeMirrorAutoCompleteSource(
  searchSpace: Accessor<AutoCompleteSearchSpace>,
) {
  const state = useState();
  const client = useClient();

  const emoji = createMemo(() => {
    return ([] as Completion[]).concat(
      MAPPED_EMOJI_KEYS.map((emoji) => ({
        ...emoji,
        url: unicodeEmojiUrl(
          state.settings.getValue("appearance:unicode_emoji"),
          emoji.apply as string,
        ),
      })),
      client().emojis.map((emoji) => ({
        type: "emoji",
        label: `:${emoji.name}:`,
        apply: `:${emoji.id}: `,
        url: emoji.url,
      })),
    );
  });

  const users = createMemo(() =>
    (
      searchSpace()?.members ??
      searchSpace()?.users ??
      client().users.toList()
    ).map((entry) => {
      // avoiding using `instanceof`, presumed slow
      const user = ((entry as { user: User })?.user ?? entry) as User;

      return {
        type: "user",
        label: "@" + entry.displayName,
        displayLabel: entry.displayName,
        detail:
          entry.displayName !== user.username
            ? `${user.username}#${user.discriminator}`
            : undefined,
        apply: `<@${typeof entry.id === "string" ? entry.id : entry.id.user}> `,
        url: entry.animatedAvatarURL,
      };
    }),
  );

  const roles = createMemo(() => {
    return (
      searchSpace()?.roles?.map(
        (entry) =>
          ({
            type: "role",
            label: "%" + entry.name,
            displayLabel: entry.name,
            apply: `<%${entry.id}> `,
            colour: entry.colour,
          }) as Completion,
      ) ?? []
    );
  });

  const channels = createMemo(() =>
    (searchSpace()?.channels ?? client().channels.toList()).map(
      (entry) =>
        ({
          type: "channel",
          label: "#" + entry.name,
          apply: `<#${entry.id}> `,
        }) as Completion,
    ),
  );

  return (context: CompletionContext) => {
    if (isInCodeBlock(context.state, context.pos, context.pos)) {
      return null;
    }

    const token = context.matchBefore(RE_match);
    switch (token?.text[0]) {
      case ":":
        return {
          from: token.from,
          options: emoji(),
          validFor: RE_emojiValidFor,
        } as CompletionResult;
      case "@":
        return {
          from: token.from,
          options: users(),
          validFor: RE_mentionValidFor,
        } as CompletionResult;
      case "%":
        return {
          from: token.from,
          options: roles(),
          validFor: RE_roleValidFor,
        } as CompletionResult;
      case "#":
        return {
          from: token.from,
          options: channels(),
          validFor: RE_channelValidFor,
        } as CompletionResult;
      default:
        return null;
    }
  };
}
