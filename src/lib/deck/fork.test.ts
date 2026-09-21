import { describe, expect, it } from "vitest";
import { buildForkData, type ForkSourceDeck } from "./fork";

const source: ForkSourceDeck = {
  id: "deck-source",
  name: "Atraxa counters",
  description: "A public list",
  format: "commander",
  targetBracket: 3,
  manualBracket: null,
  budget: 250,
  commanderId: "card-commander",
  commanderName: "Atraxa, Praetors' Voice",
  partnerId: null,
  companionId: null,
  pairingType: "none",
  userId: "user-source",
  userName: "DeckBuilder",
  cards: [
    {
      scryfallId: "card-commander",
      name: "Atraxa, Praetors' Voice",
      manaCost: "",
      cmc: 4,
      typeLine: "Legendary Creature",
      oracleText: "",
      power: "4",
      toughness: "4",
      colorIdentity: ["W", "U", "B", "G"],
      isGameChanger: false,
      isBanned: false,
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "commander",
      quantity: 1,
      isCommander: true,
      isPartner: false,
      zone: "main",
    },
  ],
};

describe("buildForkData", () => {
  it("creates a private copy with source attribution and all card zones", () => {
    const result = buildForkData(source, "user-forker");

    expect(result).toMatchObject({
      name: "Atraxa counters (Fork)",
      description: "A public list",
      userId: "user-forker",
      isPublic: false,
      shareEnabled: false,
      forkedFromDeckId: "deck-source",
      forkedFromDeckName: "Atraxa counters",
      forkedFromUserName: "DeckBuilder",
    });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({
      scryfallId: "card-commander",
      isCommander: true,
      zone: "main",
    });
  });

  it("does not copy the source sharing state", () => {
    const result = buildForkData({ ...source, isPublic: true, shareEnabled: true }, "user-forker");

    expect(result.isPublic).toBe(false);
    expect(result.shareEnabled).toBe(false);
    expect(result.shareToken).toBeNull();
  });
});
