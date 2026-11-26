import { describe, expect, test } from "vitest";

import type { State } from "..";

import { Voice } from "./Voice";

describe("Voice store: joinOnDoubleClick", () => {
  const store = new Voice({} as State);

  test("is on by default", () => {
    expect(store.default().joinOnDoubleClick).toBe(true);
    expect(store.clean({}).joinOnDoubleClick).toBe(true);
  });

  test("keeps a stored boolean", () => {
    expect(store.clean({ joinOnDoubleClick: false }).joinOnDoubleClick).toBe(
      false,
    );
  });

  test("ignores values that are not booleans", () => {
    expect(
      store.clean({ joinOnDoubleClick: "false" as unknown as boolean })
        .joinOnDoubleClick,
    ).toBe(true);
  });
});
