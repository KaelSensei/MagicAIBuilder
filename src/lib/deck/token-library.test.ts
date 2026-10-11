import { describe, expect, it } from "vitest";

import { buildTokenLibrary, formatTokenLibrary } from "./token-library";
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
  it.each([
    ["Creates ten 2/2 blue black Zombie creature tokens.", "Zombie", ["blue", "black"], 10],
    ["Create 12 0/1 colorless Eldrazi-Spawn tokens.", "Eldrazi-Spawn", ["colorless"], 12],
    ["Create a 1/1 green token.", "green", [], 1],
    ["Create 1/1 Elf token.", "Elf", [], 1],
    ["Create an 1/1 WHITE Soldier creature token.", "Soldier", ["WHITE"], 1],
  ])("preserves the existing token grammar for %s", (text, name, colors, count) => {
    expect(buildTokenLibrary([card("Source", text)])).toEqual([
      expect.objectContaining({ name, colors, count }),
    ]);
  });

  it("ignores unsupported amounts without hiding a later valid creation", () => {
    expect(buildTokenLibrary([card("Source", "Create several 1/1 Elf tokens. Create two 2/2 Wolf tokens.")]))
      .toEqual([expect.objectContaining({ name: "Wolf", count: 2 })]);
  });

  it("extracts and deduplicates created tokens and emblems", () => {
    const entries = buildTokenLibrary([
      card("Raise the Alarm", "Create two 1/1 white Soldier creature tokens."),
      card(
        "Garruk",
        "Create a 3/3 green Beast creature token. You get an emblem with trample."
      ),
      card("Another", "Create a 1/1 white Soldier creature token."),
    ]);

    expect(entries).toEqual([
      {
        name: "Soldier",
        power: "1/1",
        colors: ["white"],
        count: 3,
        kind: "token",
      },
      {
        name: "Beast",
        power: "3/3",
        colors: ["green"],
        count: 1,
        kind: "token",
      },
      { name: "Emblem", power: null, colors: [], count: 1, kind: "emblem" },
    ]);
  });

  it("returns an empty library when no card creates a token", () => {
    expect(
      buildTokenLibrary([
        card("Lightning Bolt", "Lightning Bolt deals 3 damage to any target."),
      ])
    ).toEqual([]);
  });

  it("formats a portable token checklist", () => {
    expect(
      formatTokenLibrary([
        {
          name: "Soldier",
          power: "1/1",
          colors: ["white"],
          count: 3,
          kind: "token",
        },
        { name: "Emblem", power: null, colors: [], count: 1, kind: "emblem" },
        {
          name: "Beast",
          power: "3/3",
          colors: ["green"],
          count: 2,
          kind: "token",
        },
      ])
    ).toBe("2x 3/3 green Beast token\n3x 1/1 white Soldier token\n1x Emblem");
  });

  it("returns an empty export for an empty token library", () => {
    expect(formatTokenLibrary([])).toBe("");
  });
});
