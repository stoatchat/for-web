import type { Server } from "stoat.js";
import { describe, expect, test } from "vitest";

import { isLargeServer } from "./largeServer";

const server = (approximateMemberCount: number) =>
  ({ approximateMemberCount }) as unknown as Server;

describe("isLargeServer", () => {
  test("is false when there is no server", () => {
    expect(isLargeServer(undefined)).toBe(false);
  });

  test("is false for a server under the threshold", () => {
    expect(isLargeServer(server(999))).toBe(false);
  });

  test("is false exactly at the threshold", () => {
    expect(isLargeServer(server(1000))).toBe(false);
  });

  test("is true once a server crosses the threshold", () => {
    expect(isLargeServer(server(1001))).toBe(true);
  });
});
