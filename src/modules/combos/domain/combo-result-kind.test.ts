/**
 * Solitary, table-driven tests of `comboResultKind`, the table that maps a
 * Commander Spellbook Standalone result to the way it ends a game (I-65
 * requirement 2.4). Every name below is a Standalone feature name Spellbook
 * listed at https://backend.commanderspellbook.com/features/ on 2026-11-20
 * (API 7.4.4); "Lose the game" and "Infinite poison counters" are invented to
 * pin the edges of the table.
 */
import { describe, expect, it } from "vitest";
import { comboResultKind } from "@/modules/combos/domain/combo-result-kind";

describe("comboResultKind (Spellbook Standalone result → route kind)", () => {
  it.each([
    "Win the game",
    "Win the game at the beginning of your next upkeep",
    "Each opponent loses the game",
    "Target player loses the game on each of your turns",
    "Up to three target opponents lose the game",
    "On each of your turns, you take an extra turn unless an opponent chooses to lose the game",
  ])("maps %s to an alternative win", (result) => {
    expect(comboResultKind(result)).toBe("alternativeWin");
  });

  it.each([
    "Infinite combat damage",
    "Infinite combat damage to one opponent",
    "Near-infinite combat damage",
  ])("maps %s to combat: the damage it names is combat damage", (result) => {
    expect(comboResultKind(result)).toBe("combat");
  });

  it.each([
    "Infinite damage",
    "Near-infinite damage to any target",
    "Lethal damage to opponents not at some specific life totals",
    "Infinite lifeloss",
    "Near-infinite lifeloss for up to two target opponents",
  ])(
    "maps %s to drain: damage that is not combat damage, or life loss",
    (result) => {
      expect(comboResultKind(result)).toBe("drain");
    }
  );

  it.each([
    "Infinite mill",
    "Near-infinite mill for target opponent",
    "Infinite mill for up to two target players",
  ])("maps %s to mill", (result) => {
    expect(comboResultKind(result)).toBe("mill");
  });

  it.each([
    "Each opponent skips their turn",
    "Target opponent skips all their future turns",
    "Locks out all of your opponents but one, and allows you to choose which of your two neighboring opponents get to have turns",
    "Gain control of all permanents",
    "You control one opponent on each of their turns",
    "You control up to three opponents on each of their turns",
    "You control your opponents on each of their turns",
  ])("maps %s to a lock: opponents skip turns or are controlled", (result) => {
    expect(comboResultKind(result)).toBe("lock");
  });

  it.each([
    "Infinite turns",
    "Near-infinite turns",
    "Infinite turns after one turn cycle",
  ])("maps %s to an extra-turn result", (result) => {
    expect(comboResultKind(result)).toBe("extraTurn");
  });

  it("names the game loss before the skipped turns that cause it", () => {
    expect(
      comboResultKind(
        "Skip all your future turns, causing your opponents to eventually draw from an empty library and lose the game"
      )
    ).toBe("alternativeWin");
  });

  it.each([
    "Infinite self-mill",
    "Near-infinite self-mill",
    "Infinite colorless mana",
    "Infinite copies of creatures you control",
    "Infinite +1/+1 counters on creatures you control",
    "Infinitely large creatures you control until end of turn",
    "Infinite poison counters",
  ])("leaves %s unmapped, shown as another result", (result) => {
    expect(comboResultKind(result)).toBe("other");
  });

  it("does not read a player who can't lose the game as a game loss", () => {
    expect(comboResultKind("You can't lose the game")).toBe("other");
  });

  it("matches whatever the case, and an unknown or empty name never throws", () => {
    expect(comboResultKind("WIN THE GAME")).toBe("alternativeWin");
    expect(comboResultKind("Lose the game")).toBe("alternativeWin");
    expect(comboResultKind("")).toBe("other");
    expect(comboResultKind("A result Spellbook adds next year")).toBe("other");
  });
});
