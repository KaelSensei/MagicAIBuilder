import { describe, expect, it } from "vitest";

import { chanceOfAtLeast } from "./draw-odds";
import {
  countLibrary,
  libraryCardNames,
  type DrawOddsTarget,
} from "./draw-odds-library";
import { OPENING_HAND_SIZE } from "./game-constants";
import type { DeckCard } from "./types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

const LANDS: DrawOddsTarget = { kind: "lands" };

/** I-97 states its contract to four decimal places. */
const FOUR_DECIMALS = 4;

/**
 * Hands of seven from 99 cards that hold three or more of 36 lands, over all
 * hands of seven: Σ C(36, i) · C(63, 7 − i) for i = 3..7, over C(99, 7). The
 * I-97 contract, committed in `draw-odds.test.ts` from exact integer arithmetic.
 */
const THREE_LANDS_IN_SEVEN_OF_99 = 26_736_733 / 53_358_536;

/** The commander, which a deck holds in its command zone (CR 903.6), not among its cards. */
const COMMANDER = aDeckCard({
  id: "commander",
  name: "Omnath, Locus of Mana",
  category: "commander",
  typeLine: "Legendary Creature — Elemental",
});

/** One row of basic Forests. */
function forests(quantity: number, id = "forest"): DeckCard {
  return aDeckCard({
    id,
    name: "Forest",
    category: "land",
    typeLine: "Basic Land — Forest",
    quantity,
  });
}

/** Distinct one-copy creatures, the non-land part of a singleton deck. */
function spells(count: number): DeckCard[] {
  return Array.from({ length: count }, (_, index) =>
    aDeckCard({
      id: `spell-${index}`,
      name: `Spell ${index}`,
      category: "creature",
      typeLine: "Creature — Elf",
    })
  );
}

describe("countLibrary", () => {
  it("counts the 99 main-deck cards of a commander deck as its library, and its 36 lands as matching", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [forests(36), ...spells(63)],
    });

    expect(countLibrary(deck, LANDS)).toEqual({
      librarySize: 99,
      matching: 36,
    });
  });

  it("leaves Sideboard cards out of the library, so a Sideboard land never matches", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [
        forests(36),
        ...spells(63),
        { ...forests(2, "sideboard-forest"), zone: "sideboard" },
        aDeckCard({
          id: "sideboard-spell",
          name: "Pest Control",
          zone: "sideboard",
        }),
      ],
    });

    expect(countLibrary(deck, LANDS)).toEqual({
      librarySize: 99,
      matching: 36,
    });
  });

  it("leaves Considering cards out of the library, so a Considering land never matches", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [
        forests(36),
        ...spells(63),
        { ...forests(1, "considered-forest"), zone: "maybeboard" },
        aDeckCard({
          id: "considered-spell",
          name: "Craterhoof Behemoth",
          zone: "maybeboard",
        }),
      ],
    });

    expect(countLibrary(deck, LANDS)).toEqual({
      librarySize: 99,
      matching: 36,
    });
  });

  it("counts a library of 98 when a partner shares the command zone", () => {
    const deck = aDeck({
      commander: aDeckCard({
        id: "commander",
        name: "Tana, the Bloodsower",
        category: "commander",
      }),
      partner: aDeckCard({
        id: "partner",
        name: "Thrasios, Triton Hero",
        category: "commander",
      }),
      pairingType: "partner",
      cards: [forests(36), ...spells(62)],
    });

    expect(countLibrary(deck, LANDS)).toEqual({
      librarySize: 98,
      matching: 36,
    });
  });

  it("counts a chosen card's copies in the library as matching", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [
        forests(36),
        aDeckCard({ id: "sol-ring", name: "Sol Ring", category: "ramp" }),
        ...spells(62),
      ],
    });

    expect(countLibrary(deck, { kind: "card", name: "Sol Ring" })).toEqual({
      librarySize: 99,
      matching: 1,
    });
  });

  it("counts every copy of a chosen card held in several rows, such as two printings", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [forests(20), forests(16, "forest-other-printing"), ...spells(63)],
    });

    expect(countLibrary(deck, { kind: "card", name: "Forest" })).toEqual({
      librarySize: 99,
      matching: 36,
    });
  });

  it("counts no copies of a chosen card held only in Considering, a known zero chance", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [
        forests(36),
        ...spells(63),
        aDeckCard({ id: "considered", name: "Sol Ring", zone: "maybeboard" }),
      ],
    });
    const count = countLibrary(deck, { kind: "card", name: "Sol Ring" });

    expect(count).toEqual({ librarySize: 99, matching: 0 });
    expect(
      chanceOfAtLeast({ ...count, drawn: OPENING_HAND_SIZE, minimum: 1 })
    ).toEqual({
      kind: "known",
      probability: 0,
    });
  });

  it("gives the I-97 chance of three or more lands in the opening seven of a 99-card deck with 36 lands", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [forests(36), ...spells(63)],
    });
    const question = {
      ...countLibrary(deck, LANDS),
      drawn: OPENING_HAND_SIZE,
      minimum: 3,
    };

    expect(chanceOfAtLeast(question)).toEqual({
      kind: "known",
      probability: expect.closeTo(THREE_LANDS_IN_SEVEN_OF_99, FOUR_DECIMALS),
    });
  });

  it("counts an empty library for a deck without cards, which the odds name instead of answering zero", () => {
    const count = countLibrary(aDeck({ commander: COMMANDER }), LANDS);

    expect(count).toEqual({ librarySize: 0, matching: 0 });
    expect(
      chanceOfAtLeast({ ...count, drawn: OPENING_HAND_SIZE, minimum: 3 })
    ).toEqual({
      kind: "unknown",
      reason: "empty-library",
    });
  });
});

describe("libraryCardNames", () => {
  it("names each card in the library once, in alphabetical order, leaving out Sideboard and Considering cards", () => {
    const deck = aDeck({
      commander: COMMANDER,
      cards: [
        aDeckCard({ id: "sol-ring", name: "Sol Ring", category: "ramp" }),
        forests(20),
        forests(16, "forest-other-printing"),
        aDeckCard({ id: "signet", name: "Arcane Signet", category: "ramp" }),
        aDeckCard({ id: "side", name: "Pest Control", zone: "sideboard" }),
        aDeckCard({ id: "maybe", name: "Craterhoof Behemoth", zone: "maybeboard" }),
      ],
    });

    expect(libraryCardNames(deck)).toEqual([
      "Arcane Signet",
      "Forest",
      "Sol Ring",
    ]);
  });
});
