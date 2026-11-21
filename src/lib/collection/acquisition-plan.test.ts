// Pins how stored deck rows are sorted into command-zone slots before the plan counts them,
// and how each deck's "proxy now" / "buy later" choices split a printing's copies.
import { describe, expect, it } from "vitest";

import { aDeckCard } from "@/test/builders/card";
import {
  buildAcquisitionPlan,
  toAcquisitionPlanDeck,
} from "./acquisition-plan";
import type {
  AcquisitionPlanDeck,
  AcquisitionPlanRow,
} from "./acquisition-plan";
import type { AcquisitionMode } from "./acquisition-intent";

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

describe("buildAcquisitionPlan with each deck's acquisition choices", () => {
  const MANA_CRYPT = aDeckCard({
    id: "row-crypt",
    scryfallId: "crypt",
    name: "Mana Crypt",
    typeLine: "Artifact",
    price: 150,
  });

  const deckNeedingCrypt = (
    id: string,
    intents: Readonly<Record<string, AcquisitionMode>> = {}
  ): AcquisitionPlanDeck => ({
    id,
    name: `Deck ${id.toUpperCase()}`,
    cards: [MANA_CRYPT],
    commander: null,
    partner: null,
    intents,
  });

  it("defers a printing marked proxy now in its only deck instead of buying it", () => {
    const plan = buildAcquisitionPlan(
      [deckNeedingCrypt("a", { crypt: "proxy_now" })],
      {}
    );

    expect(plan).toEqual([
      expect.objectContaining({
        scryfallId: "crypt",
        requiredQuantity: 1,
        acquireQuantity: 0,
        deferredQuantity: 1,
        deferred: [{ id: "a", name: "Deck A", mode: "proxy_now", quantity: 1 }],
      }),
    ]);
  });

  it("gives an owned copy to the deck with no choice first", () => {
    const plan = buildAcquisitionPlan(
      [deckNeedingCrypt("a", { crypt: "proxy_now" }), deckNeedingCrypt("b")],
      { crypt: 1 }
    );

    expect(plan).toEqual([
      expect.objectContaining({
        scryfallId: "crypt",
        requiredQuantity: 2,
        ownedQuantity: 1,
        acquireQuantity: 0,
        deferredQuantity: 1,
        deferred: [{ id: "a", name: "Deck A", mode: "proxy_now", quantity: 1 }],
      }),
    ]);
  });

  it("never counts one copy twice across a deferred deck and a buying deck", () => {
    const plan = buildAcquisitionPlan(
      [deckNeedingCrypt("a", { crypt: "proxy_now" }), deckNeedingCrypt("b")],
      {}
    );

    expect(plan).toEqual([
      expect.objectContaining({
        requiredQuantity: 2,
        acquireQuantity: 1,
        deferredQuantity: 1,
        deferred: [{ id: "a", name: "Deck A", mode: "proxy_now", quantity: 1 }],
      }),
    ]);
  });

  it("defers a printing marked buy later with its own choice", () => {
    const plan = buildAcquisitionPlan(
      [deckNeedingCrypt("a", { crypt: "buy_later" })],
      {}
    );

    expect(plan).toEqual([
      expect.objectContaining({
        acquireQuantity: 0,
        deferredQuantity: 1,
        deferred: [{ id: "a", name: "Deck A", mode: "buy_later", quantity: 1 }],
      }),
    ]);
  });

  it("defers nothing when the collection covers a deck that has a choice", () => {
    const plan = buildAcquisitionPlan(
      [deckNeedingCrypt("a", { crypt: "proxy_now" }), deckNeedingCrypt("b")],
      { crypt: 2 }
    );

    expect(plan).toEqual([]);
  });

  it("ignores a choice saved in another deck", () => {
    const plan = buildAcquisitionPlan(
      [
        deckNeedingCrypt("a"),
        { ...deckNeedingCrypt("b", { other: "proxy_now" }), cards: [] },
      ],
      {}
    );

    expect(plan).toEqual([
      expect.objectContaining({
        acquireQuantity: 1,
        deferredQuantity: 0,
        deferred: [],
      }),
    ]);
  });
});
