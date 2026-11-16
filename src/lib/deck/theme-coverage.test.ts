import { describe, expect, it } from "vitest";

import { themeCoverage } from "./theme-coverage";
import type { DeckTheme } from "./theme-match";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

const DRAGON_TYPE: DeckTheme = {
  handles: [{ kind: "creatureType", value: "Dragon" }],
  match: "any",
};

const SHIVAN_DRAGON = aDeckCard({
  id: "shivan-dragon",
  name: "Shivan Dragon",
  typeLine: "Creature — Dragon",
  category: "creature",
});

const SOL_RING = aDeckCard({
  id: "sol-ring",
  name: "Sol Ring",
  typeLine: "Artifact",
  category: "ramp",
});

const SNOW_FORESTS = aDeckCard({
  id: "snow-forest",
  name: "Snow-Covered Forest",
  typeLine: "Basic Snow Land — Forest",
  category: "land",
  quantity: 10,
});

const DRYAD_ARBOR = aDeckCard({
  id: "dryad-arbor",
  name: "Dryad Arbor",
  typeLine: "Land Creature — Forest Dryad",
  category: "land",
});

describe("themeCoverage", () => {
  it("leaves basic lands out of the count by default, and counts a nonbasic land", () => {
    const deck = aDeck({ cards: [SHIVAN_DRAGON, SNOW_FORESTS, DRYAD_ARBOR] });

    const coverage = themeCoverage(deck, DRAGON_TYPE);

    expect(coverage.onTheme).toBe(1);
    expect(coverage.denominator).toBe(2);
    expect(coverage.offTheme).toEqual([
      { cardName: "Dryad Arbor", category: "land" },
    ]);
  });

  it("counts every copy of a basic land when the owner switches basics on", () => {
    const letterS: DeckTheme = {
      handles: [{ kind: "firstLetter", value: "S", ignoreLeadingThe: false }],
      match: "any",
      countBasics: true,
    };
    const deck = aDeck({ cards: [SHIVAN_DRAGON, SNOW_FORESTS, DRYAD_ARBOR] });

    const coverage = themeCoverage(deck, letterS);

    expect(coverage.onTheme).toBe(11);
    expect(coverage.denominator).toBe(12);
  });

  it("counts the on-theme cards and lists each off-theme card under its stored category", () => {
    const deck = aDeck({ cards: [SHIVAN_DRAGON, SOL_RING] });

    const coverage = themeCoverage(deck, DRAGON_TYPE);

    expect(coverage.onTheme).toBe(1);
    expect(coverage.denominator).toBe(2);
    expect(coverage.offTheme).toEqual([
      { cardName: "Sol Ring", category: "ramp" },
    ]);
  });

  it("counts the commander and the partner, first and marked as in the command zone", () => {
    const deck = aDeck({
      commander: aDeckCard({
        id: "commander",
        name: "Rograkh, Son of Rohgahh",
        typeLine: "Legendary Creature — Dwarf Berserker",
        category: "commander",
      }),
      partner: aDeckCard({
        id: "partner",
        name: "Miirym, Sentinel Wyrm",
        typeLine: "Legendary Creature — Dragon Spirit",
        category: "commander",
      }),
      cards: [SOL_RING, SHIVAN_DRAGON],
    });

    const coverage = themeCoverage(deck, DRAGON_TYPE);

    expect(coverage.onTheme).toBe(2);
    expect(coverage.denominator).toBe(4);
    expect(
      coverage.cards.map(({ cardName, commandZone, onTheme }) => ({
        cardName,
        commandZone,
        onTheme,
      }))
    ).toEqual([
      { cardName: "Rograkh, Son of Rohgahh", commandZone: true, onTheme: false },
      { cardName: "Miirym, Sentinel Wyrm", commandZone: true, onTheme: true },
      { cardName: "Shivan Dragon", commandZone: false, onTheme: true },
      { cardName: "Sol Ring", commandZone: false, onTheme: false },
    ]);
  });

  it("gives one result for the same cards in any order, the main deck by name", () => {
    const cards = [SOL_RING, DRYAD_ARBOR, SHIVAN_DRAGON];

    const forwards = themeCoverage(aDeck({ cards }), DRAGON_TYPE);
    const backwards = themeCoverage(
      aDeck({ cards: cards.toReversed() }),
      DRAGON_TYPE
    );

    expect(backwards).toEqual(forwards);
    expect(forwards.cards.map((card) => card.cardName)).toEqual([
      "Dryad Arbor",
      "Shivan Dragon",
      "Sol Ring",
    ]);
  });

  it("counts copies, and leaves the Sideboard and Considering rows out", () => {
    const deck = aDeck({
      cards: [
        { ...SHIVAN_DRAGON, quantity: 3 },
        SOL_RING,
        aDeckCard({
          id: "sideboard-dragon",
          name: "Thundermaw Hellkite",
          typeLine: "Creature — Dragon",
          zone: "sideboard",
        }),
        aDeckCard({
          id: "considering-rock",
          name: "Arcane Signet",
          typeLine: "Artifact",
          category: "ramp",
          zone: "maybeboard",
          isMaybeboard: true,
        }),
      ],
    });

    const coverage = themeCoverage(deck, DRAGON_TYPE);

    expect(coverage.onTheme).toBe(3);
    expect(coverage.denominator).toBe(4);
    expect(coverage.offTheme).toEqual([
      { cardName: "Sol Ring", category: "ramp" },
    ]);
  });
});
