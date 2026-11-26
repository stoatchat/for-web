import type { Device } from "@revolt/common";

/**
 * Whether double-clicking a voice channel to join it is offered at all
 *
 * Mobile browsers (e.g. iOS Safari) turn a quick double tap into a double
 * click, so it is easy to join a call by accident while the drawer is still
 * sliding. Like channel reordering, it is therefore turned off where touch is
 * the primary input.
 */
export const isDoubleClickJoinAvailable = (
  device: Pick<Device, "isMobile" | "hasCoarsePointer">,
): boolean => !device.isMobile && !device.hasCoarsePointer;

/**
 * Whether a double click on a channel in the channel list should join it
 */
export function shouldJoinOnDoubleClick(channel: {
  /** Double click to join is offered on this device */
  available: boolean;
  /** The user turned the option on in the voice settings */
  enabled: boolean;
  isVoice: boolean;
  /** The user is already in this channel's call */
  inCall: boolean;
  canConnect: boolean;
}): boolean {
  return (
    channel.available &&
    channel.enabled &&
    channel.isVoice &&
    !channel.inCall &&
    channel.canConnect
  );
}
