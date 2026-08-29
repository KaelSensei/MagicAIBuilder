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

  it("rejects an incorrect card total", () => {
    const deck = validDeck();
    deck.cards[1].quantity = 97;

    expect(validateGeneratedDeck(deck)).toContain(
      "The generated deck contains 98 cards; expected 99."
    );
  });

  it("allows repeated basic lands but rejects repeated non-basics", () => {
    const deck = validDeck();
    deck.cards = [
      { name: "Sol Ring", quantity: 1, category: "ramp" },
      { name: "Sol Ring", quantity: 1, category: "ramp" },
      { name: "Island", quantity: 97, category: "land" },
    ];

    expect(validateGeneratedDeck(deck)).toContain(
      "Sol Ring is duplicated in the generated deck."
    );
  });

  it("rejects a non-basic quantity above one", () => {
    const deck = validDeck();
    deck.cards[0].quantity = 2;
    deck.cards[1].quantity = 98;

    expect(validateGeneratedDeck(deck)).toContain(
      "Sol Ring has more than one copy but is not a basic land."
    );
  });

  it("rejects the commander appearing in the card list", () => {
    const deck = validDeck();
    deck.cards[0].name = "Atraxa, Praetors' Voice";

    expect(validateGeneratedDeck(deck)).toContain(
      "The commander Atraxa, Praetors' Voice is duplicated in the card list."
    );
  });
});
