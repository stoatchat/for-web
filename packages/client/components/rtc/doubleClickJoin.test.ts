import { describe, expect, test } from "vitest";

import {
  isDoubleClickJoinAvailable,
  shouldJoinOnDoubleClick,
} from "./doubleClickJoin";

describe("isDoubleClickJoinAvailable", () => {
  test("is available with a mouse on desktop", () => {
    expect(
      isDoubleClickJoinAvailable({ isMobile: false, hasCoarsePointer: false }),
    ).toBe(true);
  });

  test("is not available on mobile browsers", () => {
    expect(
      isDoubleClickJoinAvailable({ isMobile: true, hasCoarsePointer: false }),
    ).toBe(false);
  });

  test("is not available where touch is the primary input, e.g. tablets", () => {
    expect(
      isDoubleClickJoinAvailable({ isMobile: false, hasCoarsePointer: true }),
    ).toBe(false);
  });

  test("is not available on mobile touch devices", () => {
    expect(
      isDoubleClickJoinAvailable({ isMobile: true, hasCoarsePointer: true }),
    ).toBe(false);
  });
});

describe("shouldJoinOnDoubleClick", () => {
  const joinable = {
    available: true,
    enabled: true,
    isVoice: true,
    inCall: false,
    canConnect: true,
  };

  test("joins a voice channel the user can connect to", () => {
    expect(shouldJoinOnDoubleClick(joinable)).toBe(true);
  });

  test("does not join on touch devices, even with the setting enabled", () => {
    expect(shouldJoinOnDoubleClick({ ...joinable, available: false })).toBe(
      false,
    );
  });

  test("does not join when the setting is disabled", () => {
    expect(shouldJoinOnDoubleClick({ ...joinable, enabled: false })).toBe(
      false,
    );
  });

  test("does not join text channels", () => {
    expect(shouldJoinOnDoubleClick({ ...joinable, isVoice: false })).toBe(
      false,
    );
  });

  test("does not rejoin the channel the user is already in", () => {
    expect(shouldJoinOnDoubleClick({ ...joinable, inCall: true })).toBe(false);
  });

  test("does not join without permission to connect", () => {
    expect(shouldJoinOnDoubleClick({ ...joinable, canConnect: false })).toBe(
      false,
    );
  });
});
