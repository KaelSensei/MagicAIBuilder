/**
 * The card filter's rule over stored rows, solitary: which rows run a card.
 * The route test (`app/api/decks/search/route.test.ts`) covers the zones, the
 * names and ownership end to end; these pin the rows it does not seed.
 */
import { describe, expect, it } from "vitest";
import {
  decksPassingCardFilter,
  type DeckCardFilterRow,
} from "./deck-card-filter";

/** A one-copy main-deck row of `deckId`, unless given. */
function row(
  deckId: string,
  name: string,
  overrides: Partial<DeckCardFilterRow> = {}
): DeckCardFilterRow {
  return {
    deckId,
    name,
    quantity: 1,
    zone: "main",
    isCommander: false,
    isPartner: false,
    category: "other",
    ...overrides,
  };
}

describe("decksPassingCardFilter", () => {
  it("does not count a companion, which is outside the deck (CR 702.139a)", () => {
    const rows = [
      row("lutri", "Lutri, the Spellchaser", { category: "companion" }),
    ];

    expect(
      decksPassingCardFilter(["lutri"], rows, {
        all: ["Lutri, the Spellchaser"],
        none: [],
      })
    ).toEqual([]);
  });

  it("does not count a row of zero copies, as the commitment index does not", () => {
    const rows = [row("empty-row", "Sol Ring", { quantity: 0 })];

    expect(
      decksPassingCardFilter(["empty-row"], rows, {
        all: [],
        none: ["Sol Ring"],
      })
    ).toEqual(["empty-row"]);
  });

  it("counts a partner in any zone, as the command zone commits it", () => {
    const rows = [
      row("pair", "Tymna the Weaver", { isPartner: true, zone: "sideboard" }),
    ];

    expect(
      decksPassingCardFilter(["pair"], rows, {
        all: ["Tymna the Weaver"],
        none: [],
      })
    ).toEqual(["pair"]);
  });

  it("keeps the given deck order and ignores rows of decks it was not given", () => {
    const rows = [
      row("b", "Sol Ring"),
      row("a", "Sol Ring"),
      row("other", "Sol Ring"),
    ];

    expect(
      decksPassingCardFilter(["b", "a"], rows, { all: ["Sol Ring"], none: [] })
    ).toEqual(["b", "a"]);
  });
});
