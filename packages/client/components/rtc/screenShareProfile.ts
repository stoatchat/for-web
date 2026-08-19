import { VideoEncoding, VideoResolution } from "livekit-client";

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
