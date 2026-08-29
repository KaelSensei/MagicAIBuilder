import { describe, expect, it } from "vitest";
import { parseMoxfieldUserDecks } from "./moxfield-user";

describe("parseMoxfieldUserDecks empty profiles", () => {
  it("returns an empty page when a valid profile has no public decks", () => {
    expect(parseMoxfieldUserDecks({ data: [], totalResults: 0 })).toEqual({
      decks: [],
      total: 0,
      hasMore: false,
    });
  });
});
