/**
 * Pins the defaults of the shared card and deck builders. Tests across the suite rely on them, and
 * their TSDoc promises them, so a change here is a change to every test that omits a field.
 */
import { describe, expect, it } from "vitest";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { aScryfallCard } from "@/test/builders/scryfall";
import { categorizeCard } from "@/lib/deck/categories";
import { makeDeckCard } from "@/lib/deck/store-factories";

describe("aDeckCard", () => {
  it("is one colourless, legal copy in the main deck, with blank card text", () => {
    expect(aDeckCard()).toEqual({
      id: "card-1",
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
    });
  });

  it("takes any field from the overrides", () => {
    const card = aDeckCard({
      name: "Sol Ring",
      cmc: 1,
      zone: "maybeboard",
      notes: "staple",
    });

    expect(card).toMatchObject({
      id: "card-1",
      name: "Sol Ring",
      cmc: 1,
      zone: "maybeboard",
      notes: "staple",
    });
  });

  it("returns a new card and a new colour identity each time", () => {
    const first = aDeckCard();
    first.colorIdentity.push("G");

    expect(aDeckCard().colorIdentity).toEqual([]);
  });
});

describe("aDeck", () => {
  it("is an empty Commander deck with no commander yet, at the bracket a new deck gets", () => {
    expect(aDeck()).toEqual({
      id: "deck-1",
      name: "Test Deck",
      format: "commander",
      commander: null,
      partner: null,
      companion: null,
      pairingType: "none",
      cards: [],
      maybeboard: [],
      cardCount: 0,
      targetBracket: 3,
      manualBracket: null,
      budget: null,
      description: "",
      tags: [],
      shareToken: null,
      shareEnabled: false,
      isPublic: false,
      isAIGenerated: false,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    });
  });

  it("takes any field from the overrides, and leaves cardCount to the caller", () => {
    const commander = aDeckCard({ id: "cmd", category: "commander" });
    const deck = aDeck({ commander, cards: [aDeckCard()], format: "brawl" });

    expect(deck).toMatchObject({ commander, format: "brawl", cardCount: 0 });
    expect(deck.cards).toHaveLength(1);
  });

  it("returns new lists and dates each time", () => {
    const first = aDeck();
    first.cards.push(aDeckCard());
    first.createdAt.setFullYear(2030);

    expect(aDeck().cards).toEqual([]);
    expect(aDeck().createdAt).toEqual(new Date(0));
  });
});

describe("aScryfallCard", () => {
  it("is a colourless card with only the fields Scryfall always sends that the app reads", () => {
    expect(aScryfallCard()).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Card",
      cmc: 0,
      type_line: "",
      color_identity: [],
    });
  });

  it("feeds the app's own mapping into a deck card", () => {
    const solRing = aScryfallCard({
      name: "Sol Ring",
      mana_cost: "{1}",
      cmc: 1,
      type_line: "Artifact",
      oracle_text: "{T}: Add {C}{C}.",
    });

    expect(categorizeCard(solRing)).toBe("ramp");
    expect(makeDeckCard(solRing)).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Sol Ring",
      quantity: 1,
      zone: "main",
    });
  });
});
