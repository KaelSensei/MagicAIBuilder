import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCombosForDeck, fetchCombosForCard, clearSpellbookCache } from "@/lib/combos/spellbook";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeVariantResponse(variants: object[]) {
  return {
    count: variants.length,
    results: variants,
  };
}

function makeVariant(id: string, cards: string[], effects: string[], description = "") {
  return {
    id,
    uses: cards.map((name) => ({ card: { name } })),
    produces: effects.map((name) => ({ feature: { name } })),
    description,
  };
}

describe("fetchCombosForDeck", () => {
  beforeEach(() => {
    clearSpellbookCache();
    mockFetch.mockReset();
  });

  it("returns empty array when API returns no variants", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeVariantResponse([]),
    });

    const result = await fetchCombosForDeck(["Lightning Bolt", "Mountain"]);
    expect(result).toEqual([]);
  });

  it("deduplicates combos found for multiple cards", async () => {
    const sharedVariant = makeVariant(
      "combo-1",
      ["Splinter Twin", "Deceiver Exarch"],
      ["Infinite ETB triggers", "Infinite tokens"]
    );

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeVariantResponse([sharedVariant]),
    });

    // Both cards in the deck
    const result = await fetchCombosForDeck(["Splinter Twin", "Deceiver Exarch"]);
    // Should appear only once
    const comboCount = result.filter((c) => c.id === "combo-1").length;
    expect(comboCount).toBeLessThanOrEqual(1);
  });

  it("marks combos with 'Infinite' in effects as isInfinite", async () => {
    const variant = makeVariant(
      "combo-inf",
      ["Isochron Scepter", "Dramatic Reversal", "Mana artifact"],
      ["Infinite mana", "Infinite storm count"]
    );

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeVariantResponse([variant]),
    });

    const result = await fetchCombosForCard("Isochron Scepter");
    const parsed = result.find((c) => c.id === "combo-inf");
    expect(parsed).toBeDefined();
    expect(parsed!.isInfinite).toBe(true);
  });

  it("returns cached result on second call within TTL", async () => {
    const variant = makeVariant("cache-test", ["Card A"], ["Draw cards"]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeVariantResponse([variant]),
    });

    // First call — populates cache
    const first = await fetchCombosForCard("Card A");
    expect(first).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call — should use cache, not fetch again
    const second = await fetchCombosForCard("Card A");
    expect(second).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1 call
  });

  it("returns empty array when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await fetchCombosForCard("Bad Card");
    expect(result).toEqual([]);
  });

  it("sorts by card count when isInfinite is equal", async () => {
    const twoCard = makeVariant("v-2", ["Card A", "Card B"], ["Draw cards"]);
    const threeCard = makeVariant("v-3", ["Card A", "Card B", "Card C"], ["Draw more cards"]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeVariantResponse([threeCard, twoCard]),
    });

    const result = await fetchCombosForDeck(["Card A", "Card B", "Card C"]);
    expect(result).toHaveLength(2);
    // Shorter combo (2 cards) should come first when both are non-infinite
    expect(result[0].cards).toHaveLength(2);
    expect(result[1].cards).toHaveLength(3);
  });

  it("returns empty array when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchCombosForCard("Sol Ring");
    expect(result).toEqual([]);
  });

  it("sorts infinite combos before non-infinite, then by card count", async () => {
    const nonInfinite = makeVariant("v-noninf", ["Card A", "Card B"], ["Draw cards"]);
    const infinite = makeVariant("v-inf", ["Card A", "Card B", "Card C"], ["Infinite mana"]);

    // Each card fetch returns both variants
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeVariantResponse([nonInfinite, infinite]),
    });

    const result = await fetchCombosForDeck(["Card A", "Card B", "Card C"]);
    expect(result).toHaveLength(2);
    // Infinite should come first
    expect(result[0].isInfinite).toBe(true);
    expect(result[1].isInfinite).toBe(false);
  });

  it("only returns combos where all required cards are in deck", async () => {
    // Combo requires Card A + Card B + Card C
    const variant = makeVariant(
      "combo-3c",
      ["Card A", "Card B", "Card C"],
      ["Win the game"]
    );

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeVariantResponse([variant]),
    });

    // Deck only has Card A and Card B — missing Card C
    const result = await fetchCombosForDeck(["Card A", "Card B"]);
    // Combo should NOT be returned since Card C is missing
    expect(result).toHaveLength(0);
  });
});
