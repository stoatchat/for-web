import { createEffect, onCleanup, onMount } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";
import {
  ChannelEditSystemMessage,
  ChannelOwnershipChangeSystemMessage,
  ChannelRenamedSystemMessage,
  Message,
  MessagePinnedSystemMessage,
  TextSystemMessage,
  UserModeratedSystemMessage,
  UserSystemMessage,
} from "stoat.js";

import { useNavigate, useSmartParams } from "@revolt/routing";
import { useState } from "@revolt/state";

import { useClient } from ".";

/**
 * Process and display desktop notifications
 */
export function NotificationsWorker() {
  const state = useState();
  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();
  const params = useSmartParams();

  /**
   * Handle incoming messages
   * @param message Message
   */
  function onMessage(message: Message) {
    const us = client().user!;

    // Ignore if we are currently looking at the channel
    if (params().channelId === message.channelId && document.hasFocus()) return;

    // Ignore our own messages
    if (message.author?.self) return;

    // Ignore blocked users
    if (message.author?.relationship === "Blocked") return;

    // Ignore muted channels
    if (state.notifications.isMuted(message.channel)) return;

    // Check channel notification settings
    switch (state.notifications.computeForChannel(message.channel!)) {
      case "none":
        return; // ignore if muted/none
      case "mention":
        if (!message.mentioned) return; // ignore if not mentioned
    }

    // Ignore if we're busy or focused
    if (
      us.status?.presence === "Busy" ||
      (us.status?.presence === "Focus" && !message.mentioned)
    )
      return;

    // Generate the title
    let title;
    switch (message.channel!.type) {
      case "SavedMessages":
        return;
      case "DirectMessage":
        title = `@${message.username}`;
        break;
      case "Group":
        if (message.author?.id === "00000000000000000000000000") {
          title = message.channel?.name;
        } else {
          title = `@${message.username} - ${message.channel?.name}`;
        }
        break;
      case "TextChannel":
        title = `@${message.username} (#${message.channel?.name}, ${message.channel?.server?.name})`;
        break;
    }

    // Find image if applicable
    const image = message.attachments?.find(
      (x) => x.metadata.type === "Image",
    )?.previewUrl;

    // Find body/icon
    let body, icon;
    if (message.content) {
      body = message.contentPlain;
      icon = message.avatarURL;
    } else if (message.systemMessage) {
      switch (message.systemMessage.type) {
        case "text":
          body = (message.systemMessage as TextSystemMessage).content;
          break;
        case "user_added":
          body = t`${(message.systemMessage as UserModeratedSystemMessage).user?.username} was added by ${(message.systemMessage as UserModeratedSystemMessage).by?.username}`;
          icon = (message.systemMessage as UserModeratedSystemMessage).user
            ?.avatarURL;
          break;
        case "user_remove":
          body = t`${(message.systemMessage as UserModeratedSystemMessage).user?.username} was removed by ${(message.systemMessage as UserModeratedSystemMessage).by?.username}`;
          icon = (message.systemMessage as UserModeratedSystemMessage).user
            ?.avatarURL;
          break;
        case "user_joined":
          body = t`${(message.systemMessage as UserSystemMessage).user?.username} joined`;
          icon = (message.systemMessage as UserSystemMessage).user?.avatarURL;
          break;
        case "user_left":
          body = t`${(message.systemMessage as UserSystemMessage).user?.username} left`;
          icon = (message.systemMessage as UserSystemMessage).user?.avatarURL;
          break;
        case "user_kicked":
          body = t`${(message.systemMessage as UserSystemMessage).user?.username} was kicked`;
          icon = (message.systemMessage as UserSystemMessage).user?.avatarURL;
          break;
        case "user_banned":
          body = t`${(message.systemMessage as UserSystemMessage).user?.username} was banned`;
          icon = (message.systemMessage as UserSystemMessage).user?.avatarURL;
          break;
        case "channel_renamed":
          body = t`${(message.systemMessage as ChannelRenamedSystemMessage).by?.username} renamed the channel`;
          icon = (message.systemMessage as ChannelRenamedSystemMessage).by
            ?.avatarURL;
          break;
        case "channel_description_changed":
          body = t`${(message.systemMessage as ChannelEditSystemMessage).by?.username} changed the channel description`;
          icon = (message.systemMessage as ChannelEditSystemMessage).by
            ?.avatarURL;
          break;
        case "channel_icon_changed":
          body = t`${(message.systemMessage as ChannelEditSystemMessage).by?.username} changed the channel icon`;
          icon = (message.systemMessage as ChannelEditSystemMessage).by
            ?.avatarURL;
          break;
        case "channel_ownership_changed":
          body = t`${(message.systemMessage as ChannelOwnershipChangeSystemMessage).from?.username} made ${(message.systemMessage as ChannelOwnershipChangeSystemMessage).to?.username} the new group owner`;
          icon = (message.systemMessage as ChannelOwnershipChangeSystemMessage)
            .from?.avatarURL;
          break;
        case "message_pinned":
          body = t`${(message.systemMessage as MessagePinnedSystemMessage).by?.username} pinned a message`;
          icon = (message.systemMessage as MessagePinnedSystemMessage).by
            ?.avatarURL;
          break;
        case "message_unpinned":
          body = t`${(message.systemMessage as MessagePinnedSystemMessage).by?.username} unpinned a message`;
          icon = (message.systemMessage as MessagePinnedSystemMessage).by
            ?.avatarURL;
          break;
      }
    } else if (message.attachments?.length) {
      body = t`Sent ${message.attachments!.length} attachments`;
    }

    // todo: play sound

    // Don't continue if we don't have notification permissions
    if (Notification.permission !== "granted") return;

    console.info(`[notification] ${title} ${icon} ${body}`);

    const notification = new Notification(title!, {
      icon,
      // @ts-expect-error this does exist on some platforms
      image,
      body,
      timestamp: message.createdAt,
      tag: message.channelId,
      badge: "/assets/web/android-chrome-512x512.png",
      silent: true,
    });

    notification.addEventListener("click", () => {
      window.focus();
      navigate(message.path);
    });
  }

  createEffect(() => {
    client().addListener("messageCreate", onMessage);
    onCleanup(() => client().removeListener("messageCreate", onMessage));
  });

  /**
   * Handle page click to request notifications
   */
  function tryRequest() {
    document.removeEventListener("click", tryRequest);

    if (!localStorage.getItem("denied-notifications")) {
      Notification.requestPermission().then(
        (permission) =>
          permission === "denied" &&
          localStorage.setItem("denied-notifications", "1"),
      );
    }
  }

  onMount(() => {
    // don't bother mounting if denied before
    if (!localStorage.getItem("denied-notifications")) {
      document.addEventListener("click", tryRequest);
    }
  });

  onCleanup(() => document.removeEventListener("click", tryRequest));

  return null;
}
