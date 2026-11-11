import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckComboQuery } from "@/lib/combos/deck-query";
import type { SpellbookVariant } from "@/lib/combos/spellbook";

type CacheModule = typeof import("@/lib/combos/combo-cache");

const COMBO: SpellbookVariant = {
  id: "742-1295",
  cards: ["Demonic Consultation", "Thassa's Oracle"],
  effects: ["Win the game"],
  description: "",
  isInfinite: true,
  prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{U}{U}{B}" },
};

function deck(...main: string[]): DeckComboQuery {
  return { commanders: [], main };
}

describe("combo cache", () => {
  let cache: CacheModule;

  beforeEach(async () => {
    vi.resetModules();
    cache = await import("@/lib/combos/combo-cache");
  });

  it("reuses a lookup until its time to live runs out", () => {
    cache.storeCachedCombos(deck("a", "b"), [COMBO], 0);

    expect(
      cache.readCachedCombos(deck("a", "b"), cache.COMBO_CACHE_TTL_MS - 1)
    ).toEqual([COMBO]);
    expect(
      cache.readCachedCombos(deck("a", "b"), cache.COMBO_CACHE_TTL_MS)
    ).toBeNull();
  });

  it("keeps commanders and main-deck cards apart in the key", () => {
    cache.storeCachedCombos({ commanders: ["a"], main: ["b"] }, [COMBO], 0);

    expect(
      cache.readCachedCombos({ commanders: [], main: ["a", "b"] }, 0)
    ).toBeNull();
  });

  it("drops the oldest list once it holds its maximum", () => {
    for (let i = 0; i <= cache.COMBO_CACHE_MAX_ENTRIES; i += 1) {
      cache.storeCachedCombos(deck(`card ${i}`), [], 0);
    }

    expect(cache.readCachedCombos(deck("card 0"), 0)).toBeNull();
    expect(cache.readCachedCombos(deck("card 1"), 0)).toEqual([]);
  });
});
