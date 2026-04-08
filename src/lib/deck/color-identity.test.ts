import { describe, expect, it } from "vitest";
import type { Deck, DeckCard } from "./types";
import { getColorIdentityViolations, isCompanionOutsideColorIdentity } from "./color-identity";

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

describe("isCompanionOutsideColorIdentity", () => {
  it("returns false when there is no commander", () => {
    const deck = makeDeck({
      commander: null,
      companion: makeDeckCard({ id: "comp", name: "Lurrus", colorIdentity: ["W", "B"] }),
    });
    expect(isCompanionOutsideColorIdentity(deck)).toBe(false);
  });

  it("returns false when there is no companion", () => {
    const deck = makeDeck({ companion: null });
    expect(isCompanionOutsideColorIdentity(deck)).toBe(false);
  });

  it("returns false when companion is within commander identity", () => {
    const deck = makeDeck({
      commander: makeDeckCard({ id: "cmd", name: "Cmd", category: "commander", colorIdentity: ["G", "U", "W"] }),
      companion: makeDeckCard({ id: "comp", name: "Companion", colorIdentity: ["G", "W"] }),
    });
    expect(isCompanionOutsideColorIdentity(deck)).toBe(false);
  });

  it("returns true when companion has colors outside commander identity", () => {
    const deck = makeDeck({
      commander: makeDeckCard({ id: "cmd", name: "Cmd", category: "commander", colorIdentity: ["G", "U"] }),
      companion: makeDeckCard({ id: "comp", name: "Lurrus", colorIdentity: ["W", "B"] }),
    });
    expect(isCompanionOutsideColorIdentity(deck)).toBe(true);
  });

  it("includes partner identity when checking companion", () => {
    const deck = makeDeck({
      commander: makeDeckCard({ id: "cmd", name: "Cmd", category: "commander", colorIdentity: ["G"] }),
      partner: makeDeckCard({ id: "prt", name: "Partner", category: "commander", colorIdentity: ["W"] }),
      companion: makeDeckCard({ id: "comp", name: "Companion", colorIdentity: ["G", "W"] }),
    });
    expect(isCompanionOutsideColorIdentity(deck)).toBe(false);
  });

  it("returns false for colorless companion with any commander", () => {
    const deck = makeDeck({
      companion: makeDeckCard({ id: "comp", name: "Colorless Comp", colorIdentity: [] }),
    });
    expect(isCompanionOutsideColorIdentity(deck)).toBe(false);
  });
});

