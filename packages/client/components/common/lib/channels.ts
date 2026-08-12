import { Channel } from "stoat.js";

const TEXT_SIDEBAR = "grid_3x3",
  TEXT_MENTION = "tag",
  VOICE = "headset_mic";

/**
 * Returns the icon for a given channel
 * @param context - defaults to sidebar, use "mention" for mention icon
 */
export const getChannelIcon = (
  channel?: Channel,
  context?: "sidebar" | "mention",
) =>
  channel?.isVoice
    ? VOICE
    : context === "mention"
      ? TEXT_MENTION
      : TEXT_SIDEBAR;
