import { ScreenShareQualityName } from "@revolt/state/stores/Voice";
import { ScreenSharePresets, VideoResolution } from "livekit-client";
import { Client } from "stoat.js";

type ScreenShareQuality = {
  name: ScreenShareQualityName;
  resolution: VideoResolution;
  fullName: string;
  contentHint: string;
};

export function getEnabledScreenShareQualities(
  client: Client,
): ScreenShareQualityName[] {
  // Always enable low
  const names: ScreenShareQualityName[] = ["low"];

  if (client.configured()) {
    // TODO: Use new user limits if the user is new - I don't think there's a way to do that now?
    const limit =
      client.configuration?.features.limits.default.video_resolution;

    // TODO: Add more resolutions to stream from if they're enabled. May tie into premium users in the future?
    if (limit) {
      if (
        (limit[0] === 0 || limit[0] >= 1920) &&
        (limit[1] === 0 || limit[1] >= 1080)
      ) {
        names.push("high", "text");
      }
    }
  }

  return names;
}

/**
 * Get the full quality settings for the screen share quality defined by name.
 */
export function getScreenShareQuality(
  name: ScreenShareQualityName,
  client: Client,
): ScreenShareQuality {
  // Squash desired quality if the quality passed is not enabled
  const enabled = getEnabledScreenShareQualities(client);
  if (!enabled.includes(name)) {
    name = "low";
  }

  switch (name) {
    case "low":
      return {
        name: "low",
        resolution: ScreenSharePresets.h720fps30.resolution,
        fullName: "720p@30FPS",
        contentHint: "motion",
      };
    case "high":
      return {
        name: "high",
        resolution: ScreenSharePresets.h1080fps30.resolution,
        fullName: "1080p@30FPS",
        contentHint: "motion",
      };
    case "text": {
      const originalResolution = ScreenSharePresets.original.resolution;
      originalResolution.frameRate = 5;
      originalResolution.aspectRatio = 0;
      if (client.configured()) {
        // TODO: Use new user limits if the user is new - I don't think there's a way to do that now?
        const limit =
          client.configuration?.features.limits.default.video_resolution;

        if (limit) {
          originalResolution.width = limit[0];
          originalResolution.height = limit[1];
          // If both resolutions are limited, set aspect ratio
          if (
            originalResolution.height !== 0 &&
            originalResolution.width !== 0
          ) {
            originalResolution.aspectRatio =
              originalResolution.width / originalResolution.height;
          }
        }
      }
      return {
        name: "text",
        resolution: originalResolution,
        fullName: "Source@5FPS",
        contentHint: "text",
      };
    }
  }
}
