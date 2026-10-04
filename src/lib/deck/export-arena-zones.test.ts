import { describe, expect, it } from "vitest";
import { createEmptyDeck } from "./store-factories";
import { exportArena } from "./export";
import { parseTextDecklist } from "./import";
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
  it("preserves a companion separately from main and sideboard cards", () => {
    const deck = createEmptyDeck("arena-companion", "Arena Companion");
    deck.companion = card("Lurrus of the Dream-Den", 1, "main");
    deck.cards = [
      card("Plains", 20, "main"),
      card("Negate", 3, "sideboard"),
      card("Counterspell", 2, "maybeboard"),
    ];

    const text = exportArena(deck);
    expect(text).toBe(
      "Companion\n1 Lurrus of the Dream-Den\n\nDeck\n20 Plains\n\nSideboard\n3 Negate\n1 Lurrus of the Dream-Den",
    );
    expect(parseTextDecklist(text)).toMatchObject({
      companion: "Lurrus of the Dream-Den",
      cards: [
        { name: "Plains", quantity: 20 },
        { name: "Negate", quantity: 3, zone: "sideboard" },
        { name: "Lurrus of the Dream-Den", quantity: 1, zone: "sideboard" },
      ],
    });
  });

  it("does not add another sideboard copy when the companion is already there", () => {
    const deck = createEmptyDeck("arena-existing-companion", "Existing Companion");
    deck.companion = card("Lurrus of the Dream-Den", 1, "main");
    deck.cards = [card("Lurrus of the Dream-Den", 1, "sideboard")];

    expect(exportArena(deck)).toBe(
      "Companion\n1 Lurrus of the Dream-Den\n\nDeck\n\nSideboard\n1 Lurrus of the Dream-Den",
    );
    expect(deck.cards).toHaveLength(1);
  });

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
