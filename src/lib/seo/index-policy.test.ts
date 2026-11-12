import { describe, expect, it } from "vitest";
import { isIndexableProfile } from "./index-policy";

describe("isIndexableProfile", () => {
  it("keeps a profile with no public deck out of the index", () => {
    expect(isIndexableProfile(0)).toBe(false);
  });

  it("offers a profile from its first public deck", () => {
    expect(isIndexableProfile(1)).toBe(true);
  });

  it("offers a profile with several public decks", () => {
    expect(isIndexableProfile(12)).toBe(true);
  });
});
