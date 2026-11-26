import { Channel } from "stoat.js";

const CHANNEL_ICONS = {
  TEXT_SIDEBAR: "grid_3x3",
  TEXT_MENTION: "tag",
  VOICE: "headset_mic",
} as const;

/**
 * Returns the icon for a given channel
 * @param channel channel to fetch icon for
 * @param context defaults to sidebar, use "mention" for _MENTION icon
 */
export function getChannelIcon(
  channel?: Channel,
  context: "sidebar" | "mention" = "sidebar",
): string {
  if (channel?.type === "TextChannel" && channel?.isVoice)
    return CHANNEL_ICONS.VOICE;

  return context === "mention"
    ? CHANNEL_ICONS.TEXT_MENTION
    : CHANNEL_ICONS.TEXT_SIDEBAR;
}
