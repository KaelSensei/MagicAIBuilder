import { describe, it, expect } from "vitest";
import { oracleAllowsMultiples, maxQuantity, allowsMultiples, CAPPED_MULTIPLES } from "@/lib/deck/multiples";

describe("oracleAllowsMultiples", () => {
  it("returns true for 'a deck can have any number of cards named'", () => {
    expect(oracleAllowsMultiples("A deck can have any number of cards named Relentless Rats.")).toBe(true);
  });

  it("returns true for 'your deck can have any number of cards named'", () => {
    expect(oracleAllowsMultiples("Your deck can have any number of cards named Shadowborn Apostle.")).toBe(true);
  });

  it("returns false for regular oracle text", () => {
    expect(oracleAllowsMultiples("Destroy target creature.")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(oracleAllowsMultiples("")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(oracleAllowsMultiples("A DECK CAN HAVE ANY NUMBER OF CARDS NAMED Dragon's Approach")).toBe(true);
  });
});

describe("maxQuantity", () => {
  it("returns 99 for basic land type", () => {
    expect(maxQuantity("Forest", "Basic Land — Forest")).toBe(99);
    expect(maxQuantity("Plains", "Basic Land — Plains")).toBe(99);
    expect(maxQuantity("Island", "Basic Land — Island")).toBe(99);
    expect(maxQuantity("Swamp", "Basic Land — Swamp")).toBe(99);
    expect(maxQuantity("Mountain", "Basic Land — Mountain")).toBe(99);
    expect(maxQuantity("Wastes", "Basic Land")).toBe(99);
  });

  it("returns 99 for oracle unlimited multiples", () => {
    expect(maxQuantity("Relentless Rats", "Creature — Rat", "A deck can have any number of cards named Relentless Rats.")).toBe(99);
  });

  it("returns 9 for Nazgûl", () => {
    expect(maxQuantity("Nazgûl", "Creature — Wraith")).toBe(9);
  });

  it("returns 7 for Seven Dwarves", () => {
    expect(maxQuantity("Seven Dwarves", "Creature — Dwarf")).toBe(7);
  });

  it("returns 1 for a regular non-basic card", () => {
    expect(maxQuantity("Sol Ring", "Artifact")).toBe(1);
  });

  it("returns 1 for a legendary creature", () => {
    expect(maxQuantity("Atraxa, Praetors' Voice", "Legendary Creature — Phyrexian Angel Horror")).toBe(1);
  });

  it("oracle text takes priority over name for multiples detection", () => {
    // A hypothetical card with the oracle text but not in CAPPED_MULTIPLES
    expect(maxQuantity("Custom Card", "Creature — Human", "A deck can have any number of cards named Custom Card.")).toBe(99);
  });
});

describe("allowsMultiples", () => {
  it("returns true for basic lands", () => {
    expect(allowsMultiples("Forest", "Basic Land — Forest")).toBe(true);
  });

  it("returns true for oracle-unlimited cards", () => {
    expect(allowsMultiples("Relentless Rats", "Creature — Rat", "A deck can have any number of cards named Relentless Rats.")).toBe(true);
  });

  it("returns true for Nazgûl (capped at 9)", () => {
    expect(allowsMultiples("Nazgûl", "Creature — Wraith")).toBe(true);
  });

  it("returns true for Seven Dwarves (capped at 7)", () => {
    expect(allowsMultiples("Seven Dwarves", "Creature — Dwarf")).toBe(true);
  });

  it("returns false for regular cards", () => {
    expect(allowsMultiples("Lightning Bolt", "Instant")).toBe(false);
    expect(allowsMultiples("Sol Ring", "Artifact")).toBe(false);
  });
});

describe("CAPPED_MULTIPLES", () => {
  it("contains Nazgûl with cap 9", () => {
    expect(CAPPED_MULTIPLES["Nazgûl"]).toBe(9);
  });

  it("contains Seven Dwarves with cap 7", () => {
    expect(CAPPED_MULTIPLES["Seven Dwarves"]).toBe(7);
  });
});
