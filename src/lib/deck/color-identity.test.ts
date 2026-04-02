import { describe, expect, it } from "vitest";
import type { Deck, DeckCard } from "./types";
import { getColorIdentityViolations } from "./color-identity";

function makeDeckCard(overrides: Partial<DeckCard>): DeckCard {
  return {
    id: "c1",
    name: "Card",
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test",
    format: "commander",
    commander: makeDeckCard({ id: "cmd", name: "Cmd", category: "commander", colorIdentity: ["G", "U"] }),
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    tags: [],
    description: "",
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    shareToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("getColorIdentityViolations", () => {
  it("returns empty when commander is not set", () => {
    const deck = makeDeck({ commander: null });
    deck.cards = [makeDeckCard({ id: "x", name: "Lightning Bolt", colorIdentity: ["R"] })];
    expect(getColorIdentityViolations(deck)).toEqual([]);
  });

  it("flags main cards outside commander+partner identity", () => {
    const deck = makeDeck();
    deck.cards = [
      makeDeckCard({ id: "ok", name: "Simic Card", colorIdentity: ["G"] }),
      makeDeckCard({ id: "bad", name: "Lightning Bolt", colorIdentity: ["R"] }),
    ];
    const v = getColorIdentityViolations(deck);
    expect(v.map((x) => x.cardName)).toEqual(["Lightning Bolt"]);
    expect(v[0]?.cardId).toBe("bad");
  });

  it("includes partner identity in allowed colors", () => {
    const deck = makeDeck({
      partner: makeDeckCard({
        id: "prt",
        name: "Partner",
        category: "commander",
        colorIdentity: ["R"],
      }),
    });
    deck.cards = [makeDeckCard({ id: "ok", name: "Red Card", colorIdentity: ["R"] })];
    expect(getColorIdentityViolations(deck)).toEqual([]);
  });
});

