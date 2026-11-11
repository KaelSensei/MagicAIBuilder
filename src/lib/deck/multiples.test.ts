import { describe, it, expect } from "vitest";
import {
  oracleAllowsMultiples,
  maxQuantity,
  CAPPED_MULTIPLES,
} from "@/lib/deck/multiples";

describe("CAPPED_MULTIPLES", () => {
  it("has Nazgûl capped at 9", () => {
    expect(CAPPED_MULTIPLES["Nazgûl"]).toBe(9);
  });

  it("has Seven Dwarves capped at 7", () => {
    expect(CAPPED_MULTIPLES["Seven Dwarves"]).toBe(7);
  });
});

describe("oracleAllowsMultiples", () => {
  it("returns true for 'a deck can have any number of cards named'", () => {
    expect(
      oracleAllowsMultiples("A deck can have any number of cards named Relentless Rats.")
    ).toBe(true);
  });

  it("returns true for 'your deck can have any number of cards named'", () => {
    expect(
      oracleAllowsMultiples("Your deck can have any number of cards named Shadowborn Apostle.")
    ).toBe(true);
  });

  it("returns false for regular oracle text", () => {
    expect(oracleAllowsMultiples("Deal 3 damage to any target.")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(oracleAllowsMultiples("")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(
      oracleAllowsMultiples("A DECK CAN HAVE ANY NUMBER OF CARDS NAMED Pest.")
    ).toBe(true);
  });
});

describe("maxQuantity", () => {
  it("returns 99 for basic lands", () => {
    expect(maxQuantity("Forest", "Basic Land — Forest", "")).toBe(99);
    expect(maxQuantity("Island", "Basic Land — Island", "")).toBe(99);
  });

  // CR 903.5b: the singleton exemption covers every land with the basic supertype.
  it.each([
    ["Snow-Covered Forest", "Basic Snow Land — Forest"],
    ["Snow-Covered Wastes", "Basic Snow Land"],
    ["Wastes", "Basic Land"],
  ])("returns 99 for %s", (name, typeLine) => {
    expect(maxQuantity(name, typeLine, "")).toBe(99);
  });

  it("returns 99 for oracle-text multiples (Relentless Rats)", () => {
    expect(
      maxQuantity(
        "Relentless Rats",
        "Creature — Rat",
        "A deck can have any number of cards named Relentless Rats."
      )
    ).toBe(99);
  });

  it("returns 9 for Nazgûl", () => {
    expect(maxQuantity("Nazgûl", "Creature — Wraith", "")).toBe(9);
  });

  it("returns 7 for Seven Dwarves", () => {
    expect(maxQuantity("Seven Dwarves", "Creature — Dwarf", "")).toBe(7);
  });

  it("returns 1 for regular cards", () => {
    expect(maxQuantity("Sol Ring", "Artifact", "")).toBe(1);
    expect(maxQuantity("Counterspell", "Instant", "Counter target spell.")).toBe(1);
  });
});
