/**
 * Test data builder for a deck (`Deck`), shared by every test that needs one instead of a local
 * `makeDeck` (audit tests_tooling TT-18, S5: 20 copies).
 *
 * Deck-building context. It moves to that context's `testing/` folder with the context's move
 * series; until then it lives in the shared kit. Cards come from `aDeckCard` (`./card`).
 *
 * @module test/builders/deck
 */
import type { Deck } from "@/lib/deck/types";

/**
 * A deck as the app creates a new one (`createEmptyDeck` in `lib/deck/store-factories.ts`), with
 * fixed values where that one varies:
 *
 * - a Commander deck (`format: "commander"`) with no commander, partner or companion yet, and no
 *   cards: legality is a report, so an empty deck is a valid starting point (ADR 0009);
 * - target bracket 3, the default of a new deck (`DEFAULT_TARGET_BRACKET`), no manual bracket;
 * - `id` "deck-1", `name` "Test Deck", private, not shared, not AI-generated, no budget, tags or
 *   description;
 * - both dates at the Unix epoch, so a test never depends on the clock.
 *
 * `cardCount` stays 0 unless given: the store derives it when a deck loads, and most code reads
 * `cards`. Pass it when the code under test reads it. `maybeboard` is not derived from cards whose
 * zone is "maybeboard" either.
 *
 * @param overrides - the fields this test cares about; they win over the defaults
 * @returns a new deck each call, with its own lists and dates
 */
export function aDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    format: "commander",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    cardCount: 0,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}
