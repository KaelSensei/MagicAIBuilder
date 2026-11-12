import { describe, expect, it } from "vitest";
import {
  isOwnedOracleCard,
  oracleNameKey,
  ownedOracleNames,
} from "./owned-oracle-names";

describe("oracleNameKey", () => {
  it.each([
    ["Sol Ring", "sol ring"],
    ["  Sol   Ring ", "sol ring"],
    ["Urza’s Saga", "urza's saga"],
    [
      "Esika, God of the Tree // The Prismatic Bridge",
      "esika, god of the tree",
    ],
    ["Fire//Ice", "fire"],
  ])("keys %j as %j", (name, key) => {
    expect(oracleNameKey(name)).toBe(key);
  });
});

describe("ownedOracleNames and isOwnedOracleCard", () => {
  it("counts a card as owned whatever printing the collection holds", () => {
    const owned = ownedOracleNames([{ name: "Sol Ring", quantity: 2 }]);

    expect(isOwnedOracleCard({ name: "Sol Ring" }, owned)).toBe(true);
    expect(isOwnedOracleCard({ name: "Arcane Signet" }, owned)).toBe(false);
  });

  it("matches a multi-face card whether the row or the search result names one face or both", () => {
    const owned = ownedOracleNames([
      { name: "Delver of Secrets", quantity: 1 },
      { name: "Esika, God of the Tree // The Prismatic Bridge", quantity: 1 },
    ]);

    expect(
      isOwnedOracleCard(
        { name: "Delver of Secrets // Insectile Aberration" },
        owned
      )
    ).toBe(true);
    expect(isOwnedOracleCard({ name: "Esika, God of the Tree" }, owned)).toBe(
      true
    );
  });

  it("does not count a back face as the card it belongs to", () => {
    const owned = ownedOracleNames([
      { name: "Insectile Aberration", quantity: 1 },
    ]);

    expect(
      isOwnedOracleCard(
        { name: "Delver of Secrets // Insectile Aberration" },
        owned
      )
    ).toBe(false);
  });

  it("ignores rows with no copy left", () => {
    const owned = ownedOracleNames([{ name: "Sol Ring", quantity: 0 }]);

    expect(owned.size).toBe(0);
    expect(isOwnedOracleCard({ name: "Sol Ring" }, owned)).toBe(false);
  });

  it("keeps one entry per Oracle card across printings and foil rows", () => {
    const owned = ownedOracleNames([
      { name: "Sol Ring", quantity: 1 },
      { name: "sol ring", quantity: 3 },
      { name: "Command Tower", quantity: 1 },
    ]);

    expect(owned.size).toBe(2);
  });
});
