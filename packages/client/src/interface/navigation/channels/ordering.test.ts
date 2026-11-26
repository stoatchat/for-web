import { describe, expect, test } from "vitest";

import { applyChannelOrdering, orderedCategories } from "./ordering";

describe("orderedCategories", () => {
  const category = (id: string, channels: string[]) => ({
    id,
    title: id,
    channels,
  });

  test("keeps stored channels, including the ones we cannot see", () => {
    expect(
      orderedCategories([category("news", ["a", "hidden"])], ["a"]),
    ).toEqual([
      { id: "default", title: "Default", channelIds: [] },
      { id: "news", title: "news", channelIds: ["a", "hidden"] },
    ]);
  });

  test("collects channels no category claims into default", () => {
    expect(
      orderedCategories([category("news", ["a"])], ["a", "b", "c"]),
    ).toEqual([
      { id: "default", title: "Default", channelIds: ["b", "c"] },
      { id: "news", title: "news", channelIds: ["a"] },
    ]);
  });

  test("appends unclaimed channels to a stored default, keeping its place", () => {
    expect(
      orderedCategories(
        [category("news", ["a"]), category("default", ["b"])],
        ["a", "b", "c"],
      ),
    ).toEqual([
      { id: "news", title: "news", channelIds: ["a"] },
      { id: "default", title: "default", channelIds: ["b", "c"] },
    ]);
  });

  test("replaces a stored default we cannot see any channel in", () => {
    expect(
      orderedCategories(
        [category("default", ["hidden"]), category("news", ["a"])],
        ["a"],
      ),
    ).toEqual([
      { id: "default", title: "Default", channelIds: [] },
      { id: "news", title: "news", channelIds: ["a"] },
    ]);
  });

  test("always offers a default to drop channels into", () => {
    expect(orderedCategories(undefined, [])).toEqual([
      { id: "default", title: "Default", channelIds: [] },
    ]);
  });
});

describe("applyChannelOrdering", () => {
  test("keeps a hidden channel ahead of its channel when one moves away", () => {
    expect(
      applyChannelOrdering(["a", "hidden", "b"], ["a", "b"], ["b"]),
    ).toEqual(["hidden", "b"]);
  });

  test("moves a hidden channel with the channel it sits in front of", () => {
    expect(
      applyChannelOrdering(["a", "hidden", "b"], ["a", "b"], ["b", "a"]),
    ).toEqual(["hidden", "b", "a"]);
  });

  test("leaves a trailing hidden channel at the end", () => {
    expect(
      applyChannelOrdering(["a", "b", "hidden"], ["a", "b"], ["b", "a"]),
    ).toEqual(["b", "a", "hidden"]);
  });

  test("keeps a hidden channel whose channel left the category", () => {
    expect(
      applyChannelOrdering(["a", "hidden", "b"], ["a", "b"], ["a"]),
    ).toEqual(["a", "hidden"]);
  });

  test("places a channel dropped in from another category", () => {
    expect(
      applyChannelOrdering(["a", "b"], ["a", "b"], ["a", "c", "b"]),
    ).toEqual(["a", "c", "b"]);
  });

  test("keeps hidden channels when every displayed channel leaves", () => {
    expect(applyChannelOrdering(["hidden", "a"], ["a"], [])).toEqual([
      "hidden",
    ]);
  });
});
