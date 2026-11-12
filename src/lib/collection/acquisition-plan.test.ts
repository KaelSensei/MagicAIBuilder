// Pins how stored deck rows are sorted into command-zone slots before the plan counts them.
import { describe, expect, it } from "vitest";

import { toAcquisitionPlanDeck } from "./acquisition-plan";
import type { AcquisitionPlanRow } from "./acquisition-plan";

function row(
  name: string,
  flags: Pick<AcquisitionPlanRow, "isCommander" | "isPartner">,
  typeLine = "Legendary Creature"
): AcquisitionPlanRow {
  return {
    id: `row-${name}`,
    scryfallId: name,
    name,
    quantity: 1,
    price: 1,
    typeLine,
    zone: "main",
    ...flags,
  };
}

const COMMANDER = { isCommander: true, isPartner: false } as const;
// The deck editor saves the second commander with both flags set.
const SECOND_COMMANDER = { isCommander: true, isPartner: true } as const;
const OTHER = { isCommander: false, isPartner: false } as const;

const deckOf = (...cards: readonly AcquisitionPlanRow[]) => ({
  id: "deck",
  name: "Deck",
  cards,
});

describe("toAcquisitionPlanDeck", () => {
  it("keeps both commanders of a partner pair, whatever the row order", () => {
    const tymna = row("Tymna the Weaver", COMMANDER);
    const thrasios = row("Thrasios, Triton Hero", SECOND_COMMANDER);

    for (const cards of [
      [tymna, thrasios],
      [thrasios, tymna],
    ]) {
      expect(toAcquisitionPlanDeck(deckOf(...cards))).toEqual({
        id: "deck",
        name: "Deck",
        cards: [],
        commander: tymna,
        partner: thrasios,
      });
    }
  });

  it("files a Background as the second commander", () => {
    const jaheira = row("Jaheira, Friend of the Forest", COMMANDER);
    const background = row(
      "Raised by Giants",
      SECOND_COMMANDER,
      "Legendary Enchantment — Background"
    );

    const deck = toAcquisitionPlanDeck(deckOf(background, jaheira));

    expect(deck.commander).toBe(jaheira);
    expect(deck.partner).toBe(background);
  });

  it("keeps a companion with the other cards", () => {
    const kenrith = row("Kenrith, the Returned King", COMMANDER);
    const jegantha = row("Jegantha, the Wellspring", OTHER);
    const solRing = row("Sol Ring", OTHER, "Artifact");

    const deck = toAcquisitionPlanDeck(deckOf(kenrith, jegantha, solRing));

    expect(deck.commander).toBe(kenrith);
    expect(deck.partner).toBeNull();
    expect(deck.cards).toEqual([jegantha, solRing]);
  });

  it("keeps the first row of each slot, as the deck editor shows it", () => {
    const first = row("Tymna the Weaver", COMMANDER);
    const stale = row("Kraum, Ludevic's Opus", COMMANDER);

    const deck = toAcquisitionPlanDeck(deckOf(first, stale));

    expect(deck.commander).toBe(first);
    expect(deck.cards).toEqual([]);
  });
});
