import { describe, expect, test } from "vitest";

import type { State } from "..";

import { Voice } from "./Voice";

describe("Voice store: joinOnDoubleClick", () => {
  const store = new Voice({} as State);

  test("is off by default", () => {
    expect(store.default().joinOnDoubleClick).toBe(false);
    expect(store.clean({}).joinOnDoubleClick).toBe(false);
  });

  test("keeps a stored boolean", () => {
    expect(store.clean({ joinOnDoubleClick: true }).joinOnDoubleClick).toBe(
      true,
    );
  });

  test("ignores values that are not booleans", () => {
    expect(
      store.clean({ joinOnDoubleClick: "true" as unknown as boolean })
        .joinOnDoubleClick,
    ).toBe(false);
  });
});
