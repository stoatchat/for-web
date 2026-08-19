import {
  TrackPublishOptions,
  VideoEncoding,
  VideoPreset,
  VideoResolution,
} from "livekit-client";

import { ScreenShareQualityName } from "@revolt/state/stores/Voice";

export type ScreenShareContentHint = "motion" | "detail" | "text";

export type ScreenShareProfile = {
  quality: ScreenShareQualityName;
  resolution: VideoResolution;
  contentHint: ScreenShareContentHint;
  encoding?: VideoEncoding;
  audio: boolean;
  sourceIdx: number;
};

export type ScreenShareQuality = {
  name: ScreenShareQualityName;
  resolution: VideoResolution;
  fullName: string;
  contentHint: ScreenShareContentHint;
  encoding?: VideoEncoding;
};

/** 1080p60 @ 12 Mbps — general high-quality screen share. */
export const SCREEN_SHARE_PRESET_HIGH = new VideoPreset(
  1920,
  1080,
  12_000_000,
  60,
  "medium",
);

/** 1080p60 @ 18 Mbps — games and fast motion; visually lossless target. */
export const SCREEN_SHARE_PRESET_GAMING = new VideoPreset(
  1920,
  1080,
  18_000_000,
  60,
  "high",
);

const SCREEN_SHARE_PUBLISH_DEFAULTS: Pick<
  TrackPublishOptions,
  "screenShareSimulcastLayers" | "degradationPreference"
> = {
  screenShareSimulcastLayers: [],
  degradationPreference: "maintain-framerate",
};

export function screenSharePublishOptions(
  encoding?: VideoEncoding,
): TrackPublishOptions {
  return {
    ...SCREEN_SHARE_PUBLISH_DEFAULTS,
    ...(encoding ? { screenShareEncoding: encoding } : {}),
  };
}
