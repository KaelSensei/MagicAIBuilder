import { describe, expect, it } from "vitest";
import { createEmptyDeck } from "./store-factories";
import { exportArena } from "./export";
import type { DeckCard, DeckZone } from "./types";

/**
 * Build a minimal card with a distinct zone for export contract tests.
 * @param name Card name.
 * @param quantity Number of copies.
 * @param zone Deck zone.
 * @returns A card suitable for the export contract.
 */
function card(name: string, quantity: number, zone: DeckZone): DeckCard {
  return {
    id: name,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Instant",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity,
    zone,
  };
}

describe("Arena deck export zones", () => {
  it("keeps sideboard cards separate and excludes Considering cards", () => {
    const deck = createEmptyDeck("arena-zones", "Arena Zones");
    deck.cards = [
      card("Sol Ring", 1, "main"),
      card("Negate", 3, "sideboard"),
      card("Counterspell", 2, "maybeboard"),
    ];

    expect(exportArena(deck)).toBe("Deck\n1 Sol Ring\n\nSideboard\n3 Negate");
  });
});
