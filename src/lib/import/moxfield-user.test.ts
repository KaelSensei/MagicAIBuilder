import { describe, expect, it } from "vitest";
import { parseMoxfieldUserDecks } from "./moxfield-user";

describe("parseMoxfieldUserDecks", () => {
  it("returns public deck summaries from a paginated search response", () => {
    const result = parseMoxfieldUserDecks({
      data: [
        {
          publicId: "deck-1",
          name: "Atraxa Superfriends",
          format: "commander",
          lastUpdatedAtUtc: "2026-08-01T12:00:00Z",
        },
        {
          publicId: "deck-2",
          name: "Modern test",
          format: "modern",
          lastUpdatedAtUtc: null,
        },
      ],
      totalResults: 2,
    });

    expect(result).toEqual({
      decks: [
        {
          id: "deck-1",
          name: "Atraxa Superfriends",
          format: "commander",
          lastUpdatedAt: "2026-08-01T12:00:00Z",
        },
        {
          id: "deck-2",
          name: "Modern test",
          format: "modern",
          lastUpdatedAt: null,
        },
      ],
      total: 2,
      hasMore: false,
    });
  });

  it("accepts Moxfield's nested results shape and marks later pages", () => {
    const result = parseMoxfieldUserDecks({
      results: {
        items: [{ publicId: "deck-3", name: "Najeela", format: "Commander" }],
        total: 4,
      },
    });

    expect(result.decks).toEqual([
      { id: "deck-3", name: "Najeela", format: "Commander", lastUpdatedAt: null },
    ]);
    expect(result.total).toBe(4);
    expect(result.hasMore).toBe(true);
  });

  it("rejects malformed or empty responses instead of returning unusable links", () => {
    expect(() => parseMoxfieldUserDecks({ data: [{ name: "Missing id" }] })).toThrow(
      "Moxfield returned no usable decks"
    );
  });
});
