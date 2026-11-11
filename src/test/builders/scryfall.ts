/**
 * Test data builder for a card as Scryfall's API sends it (`ScryfallCard`), shared by every test
 * that needs one instead of a local builder (audit tests_tooling TT-18, S5: 12 copies).
 *
 * Card-catalog context. It moves to that context's `testing/` folder with the context's move
 * series; until then it lives in the shared kit. Tests of an adapter replay a recorded `*-v1.ts`
 * fixture instead (ADR 0005, rule 4): this builder is for code that receives an already-parsed
 * card.
 *
 * @module test/builders/scryfall
 */
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * A Scryfall card with only the fields `ScryfallCard` requires:
 *
 * - `id` "00000000-0000-4000-8000-000000000001", a well-formed UUID, because the shared card cache
 *   (`scryfall/shared-cache-keys.ts`) and the deck card validation (`validation/card.ts`) reject
 *   an id that is not one;
 * - `name` "Card", mana value 0, an empty type line, colourless (`color_identity: []`), so it fits
 *   every commander's colour identity (CR 903.5c).
 *
 * Everything optional (`mana_cost`, `oracle_text`, `legalities`, `prices`, images…) is absent
 * unless given, as in the narrowest answer the app accepts. Give the fields the code under test
 * reads, ideally copied from the real card's Scryfall page.
 *
 * @param overrides - the fields this test cares about; they win over the defaults
 * @returns a new card each call, so a test may change it freely
 */
export function aScryfallCard(
  overrides: Partial<ScryfallCard> = {}
): ScryfallCard {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Card",
    cmc: 0,
    type_line: "",
    color_identity: [],
    ...overrides,
  };
}
