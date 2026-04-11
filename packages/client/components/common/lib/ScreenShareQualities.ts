import { ScreenSharePresets, VideoResolution } from "livekit-client";

/**
 * Possible screen share qualities. Low is 720p@30fps, high 1080p@30fps and text is source@5fps.
 */
export type ScreenShareQualityName = "low" | "high" | "text";

/**
 * Array of available screen share quality names.
 */
export const ScreenShareQualityNames: ScreenShareQualityName[] = [
  "low",
  "high",
  "text",
];

type ScreenShareQuality = {
  name: ScreenShareQualityName;
  resolution: VideoResolution;
  fullName: string;
  contentHint: string;
};

/**
 * Get the full quality settings for the screen share quality defined by name.
 */
export function getScreenShareQuality(
  name: ScreenShareQualityName,
): ScreenShareQuality {
  switch (name) {
    case "low":
      return {
        name: "low",
        resolution: ScreenSharePresets.h720fps30.resolution,
        fullName: "720p@30FPS",
        contentHint: "motion",
      };
    case "high":
      // TODO: Cap this option at limit
      return {
        name: "high",
        resolution: ScreenSharePresets.h1080fps30.resolution,
        fullName: "1080p@30FPS",
        contentHint: "motion",
      };
    case "text": {
      // TODO: Cap this option at limit
      const originalResolution = ScreenSharePresets.original.resolution;
      originalResolution.frameRate = 5;
      originalResolution.aspectRatio = 0;
      return {
        name: "text",
        resolution: originalResolution,
        fullName: "Source@5FPS",
        contentHint: "text",
      };
    }
  }
}
