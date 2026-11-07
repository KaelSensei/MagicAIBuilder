import { describe, expect, it } from "vitest";
import { restoredDeckCards } from "./snapshot-restore";

describe("restoredDeckCards", () => {
  it("rejects a non-array snapshot with a type error", () => {
    expect(() => restoredDeckCards("deck-1", null)).toThrow(TypeError);
  });
});
