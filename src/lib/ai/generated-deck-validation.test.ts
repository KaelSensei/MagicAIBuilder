import { describe, expect, it } from "vitest";
import { validateGeneratedDeck } from "./generated-deck-validation";

function validDeck() {
  return {
    commander: "Atraxa, Praetors' Voice",
    partner: null,
    cards: [
      { name: "Sol Ring", quantity: 1, category: "ramp" },
      { name: "Island", quantity: 98, category: "land" },
    ],
  };
}

describe("validateGeneratedDeck", () => {
  it("accepts a 99-card singleton deck with grouped basics", () => {
    expect(validateGeneratedDeck(validDeck())).toEqual([]);
  });

  it("accepts 98 cards when a partner commander is present", () => {
    const deck = { ...validDeck(), partner: "Thrasios, Triton Hero" };
    deck.cards[1].quantity = 97;

    expect(validateGeneratedDeck(deck)).toEqual([]);
  });

  it("rejects malformed provider output", () => {
    expect(validateGeneratedDeck({ commander: "Atraxa" })).toEqual([
      "The AI returned an invalid deck structure.",
    ]);
  });

  it("rejects a card without a name", () => {
    const deck = validDeck();
    deck.cards[0].name = "  ";

    expect(validateGeneratedDeck(deck)).toEqual([
      "The generated deck contains a card without a name.",
    ]);
  });

  it.each([0, -1, 1.5])("rejects a quantity of %s", (quantity) => {
    const deck = validDeck();
    deck.cards[0].quantity = quantity;

    expect(validateGeneratedDeck(deck)).toEqual([
      "Sol Ring has an invalid quantity.",
    ]);
  });

  // Copy limits, the deck size and the commander repeated in the list need card
  // data: generated-deck-legality.test.ts covers them.
  it("leaves the deck size and copy limits to the card-data check", () => {
    const deck = validDeck();
    deck.cards = [
      { name: "Sol Ring", quantity: 2, category: "ramp" },
      { name: "Atraxa, Praetors' Voice", quantity: 1, category: "creature" },
    ];

    expect(validateGeneratedDeck(deck)).toEqual([]);
  });
});
