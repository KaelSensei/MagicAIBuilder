import { describe, expect, it } from "vitest";

import { withSavedCommandRow } from "./command-zone-rows";
import { createEmptyDeck } from "./store-factories";
import type { Deck, DeckCard } from "./types";

/**
 * Build a command-zone card as the store holds it.
 * @param id - Id the card carries
 * @param name - Card name
 * @returns A commander-category deck card
 */
function commandCard(id: string, name: string): DeckCard {
  return {
    id,
    scryfallId: `${id}-printing`,
    name,
    manaCost: "",
    cmc: 4,
    typeLine: "Legendary Creature",
    oracleText: "Partner",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "commander",
    quantity: 1,
    zone: "main",
  };
}

const THRASIOS = commandCard("thrasios", "Thrasios, Triton Hero");
const TYMNA = commandCard("tymna", "Tymna the Weaver");

/**
 * Hold one deck led by a Partner pair.
 * @returns The decks a store would hold
 */
function partnerDecks(): Readonly<Record<string, Deck>> {
  return {
    "deck-1": {
      ...createEmptyDeck("deck-1", "Partners"),
      commander: THRASIOS,
      partner: TYMNA,
      pairingType: "partner",
    },
  };
}

describe("withSavedCommandRow", () => {
  it("gives the placed partner its saved row id and keeps the commander", () => {
    const decks = withSavedCommandRow(partnerDecks(), {
      deckId: "deck-1",
      slot: "partner",
      placedId: "tymna",
      rowId: "row-7",
    });

    expect(decks["deck-1"]?.partner).toEqual({ ...TYMNA, id: "row-7" });
    expect(decks["deck-1"]?.commander).toBe(THRASIOS);
  });

  it("leaves a card placed after the save started alone", () => {
    const decks = partnerDecks();

    const result = withSavedCommandRow(decks, {
      deckId: "deck-1",
      slot: "commander",
      placedId: "an-older-choice",
      rowId: "row-7",
    });

    expect(result).toBe(decks);
  });

  it("leaves the decks alone when the deck was closed", () => {
    const decks = partnerDecks();

    const result = withSavedCommandRow(decks, {
      deckId: "deck-2",
      slot: "commander",
      placedId: "thrasios",
      rowId: "row-7",
    });

    expect(result).toBe(decks);
  });
});
