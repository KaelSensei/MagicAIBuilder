import { describe, expect, it } from "vitest";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { getDeckPresentationManaColors } from "./HomeDeckCard";

function makeCard(
  id: string,
  name: string,
  colorIdentity: readonly string[]
): DeckCard {
  return {
    id,
    name,
    manaCost: "",
    cmc: 0,
    typeLine: "Legendary Creature",
    oracleText: "",
    colorIdentity: [...colorIdentity],
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

function makeDeck(options?: {
  readonly commander?: DeckCard | null;
  readonly partner?: DeckCard | null;
}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: options?.commander ?? null,
    partner: options?.partner ?? null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
  };
}

describe("getDeckPresentationManaColors", () => {
  it("returns empty when the deck has no commander", () => {
    expect(getDeckPresentationManaColors(makeDeck())).toEqual([]);
  });

  it("keeps commander identity order", () => {
    const deck = makeDeck({
      commander: makeCard("cmd", "Atraxa", ["W", "U", "B", "G"]),
    });

    expect(getDeckPresentationManaColors(deck)).toEqual(["W", "U", "B", "G"]);
  });

  it("merges commander and partner identity without duplicates", () => {
    const deck = makeDeck({
      commander: makeCard("cmd", "Thrasios", ["U", "G"]),
      partner: makeCard("partner", "Rograkh", ["R"]),
    });

    expect(getDeckPresentationManaColors(deck)).toEqual(["U", "G", "R"]);
  });

  it("falls back to colorless for a colorless commander", () => {
    const deck = makeDeck({
      commander: makeCard("cmd", "Kozilek", []),
    });

    expect(getDeckPresentationManaColors(deck)).toEqual(["C"]);
  });
});
