import { describe, expect, it } from "vitest";

import { buildTokenLibrary } from "./token-library";
import type { DeckCard } from "./types";

function card(name: string, oracleText: string): DeckCard {
  return {
    id: name,
    name,
    manaCost: "",
    cmc: 3,
    typeLine: "Creature",
    oracleText,
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main",
    scryfallId: name,
  };
}

describe("buildTokenLibrary", () => {
  it("extracts and deduplicates created tokens and emblems", () => {
    const entries = buildTokenLibrary([
      card("Raise the Alarm", "Create two 1/1 white Soldier creature tokens."),
      card("Garruk", "Create a 3/3 green Beast creature token. You get an emblem with trample."),
      card("Another", "Create a 1/1 white Soldier creature token."),
    ]);

    expect(entries).toEqual([
      { name: "Soldier", power: "1/1", colors: ["white"], count: 3, kind: "token" },
      { name: "Beast", power: "3/3", colors: ["green"], count: 1, kind: "token" },
      { name: "Emblem", power: null, colors: [], count: 1, kind: "emblem" },
    ]);
  });

  it("returns an empty library when no card creates a token", () => {
    expect(buildTokenLibrary([card("Lightning Bolt", "Lightning Bolt deals 3 damage to any target.")])).toEqual([]);
  });
});
