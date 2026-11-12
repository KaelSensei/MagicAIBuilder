import { describe, expect, it } from "vitest";

import { withSavedCommandRow, withSavedCommandRows } from "./command-zone-rows";
import type { ApiDeckCard } from "@/lib/db/deck-api";
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
 * Build a row as the command-zone route answers it.
 * @param id - Row id
 * @param scryfallId - Printing the row was placed with
 * @param flags - Role flags; a main-deck row by default
 * @returns The saved row
 */
function savedRow(
  id: string,
  scryfallId: string,
  flags: Partial<ApiDeckCard> = {}
): ApiDeckCard {
  return {
    ...commandCard(id, "Saved"),
    deckId: "deck-1",
    scryfallId,
    notes: null,
    isCommander: false,
    isPartner: false,
    ...flags,
  };
}

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

  it("leaves the decks alone when the slot was emptied", () => {
    const emptied: Readonly<Record<string, Deck>> = {
      "deck-1": {
        ...createEmptyDeck("deck-1", "Partners"),
        commander: THRASIOS,
        partner: null,
      },
    };

    const result = withSavedCommandRow(emptied, {
      deckId: "deck-1",
      slot: "partner",
      placedId: "tymna",
      rowId: "row-7",
    });

    expect(result).toBe(emptied);
  });
});

describe("withSavedCommandRows", () => {
  it("gives the commander and partner their saved row ids, matched by role and printing", () => {
    const placed: Readonly<Record<string, Deck>> = {
      "deck-1": {
        ...createEmptyDeck("deck-1", "Partners"),
        commander: { ...THRASIOS, id: "thrasios-printing" },
        partner: { ...TYMNA, id: "tymna-printing" },
        pairingType: "partner",
      },
    };

    const decks = withSavedCommandRows(placed, "deck-1", [
      savedRow("row-1", "thrasios-printing", { isCommander: true }),
      savedRow("row-2", "tymna-printing", {
        isCommander: true,
        isPartner: true,
      }),
      savedRow("row-3", "lurrus-printing", { category: "companion" }),
    ]);

    expect(decks["deck-1"]?.commander?.id).toBe("row-1");
    expect(decks["deck-1"]?.partner?.id).toBe("row-2");
  });
});
