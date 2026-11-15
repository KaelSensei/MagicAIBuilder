import { describe, expect, it } from "vitest";
import type { PipColor } from "@/lib/deck/mana-alignment";
import { fitToDeckSize, type KeptCard } from "./generated-deck-size";

function spell(name: string, quantity = 1): KeptCard {
  return {
    card: { name, quantity, category: "other" },
    isBasicLand: false,
    producedColours: [],
  };
}

const BASIC_COLOUR: Readonly<Record<string, readonly PipColor[]>> = {
  Plains: ["W"],
  Island: ["U"],
  Swamp: ["B"],
  Forest: ["G"],
};

function basic(name: string, quantity: number): KeptCard {
  return {
    card: { name, quantity, category: "land" },
    isBasicLand: true,
    producedColours: BASIC_COLOUR[name] ?? [],
  };
}

function nonbasicLand(
  name: string,
  producedColours: readonly PipColor[]
): KeptCard {
  return {
    card: { name, quantity: 1, category: "land" },
    isBasicLand: false,
    producedColours,
  };
}

/** `count` distinct singleton spells. */
function spells(count: number): KeptCard[] {
  return Array.from({ length: count }, (_, index) =>
    spell(`Spell ${index + 1}`)
  );
}

describe("fitToDeckSize", () => {
  it("keeps a list of exactly the deck size as it is", () => {
    const kept = [...spells(60), basic("Island", 39)];

    expect(fitToDeckSize(kept, 99, [{ colour: "U", target: 19 }])).toEqual({
      status: "fitted",
      cards: kept.map(({ card }) => card),
      corrections: [],
    });
  });

  it("splits added basics by source targets, not one to one", () => {
    const repair = fitToDeckSize(spells(60), 99, [
      { colour: "W", target: 19 },
      { colour: "G", target: 36 },
    ]);

    expect(repair).toEqual({
      status: "fitted",
      cards: [
        ...spells(60).map(({ card }) => card),
        { name: "Plains", quantity: 11, category: "land" },
        { name: "Forest", quantity: 28, category: "land" },
      ],
      corrections: [
        {
          action: "added",
          name: "Plains",
          quantity: 11,
          reason: "fill_to_size",
        },
        {
          action: "added",
          name: "Forest",
          quantity: 28,
          reason: "fill_to_size",
        },
      ],
    });
  });

  it("counts the sources already listed, nonbasic lands included, and adds onto existing stacks first", () => {
    const repair = fitToDeckSize(
      [
        ...spells(75),
        nonbasicLand("Glacial Fortress", ["W", "U"]),
        basic("Island", 10),
      ],
      99,
      [
        { colour: "W", target: 19 },
        { colour: "U", target: 19 },
      ]
    );

    expect(repair).toEqual({
      status: "fitted",
      cards: [
        ...spells(75).map(({ card }) => card),
        { name: "Glacial Fortress", quantity: 1, category: "land" },
        { name: "Island", quantity: 11, category: "land" },
        { name: "Plains", quantity: 12, category: "land" },
      ],
      corrections: [
        {
          action: "added",
          name: "Plains",
          quantity: 12,
          reason: "fill_to_size",
        },
        {
          action: "added",
          name: "Island",
          quantity: 1,
          reason: "fill_to_size",
        },
      ],
    });
  });

  it("evens the sources, ties in WUBRG order, when no spell sets a target", () => {
    const repair = fitToDeckSize([...spells(90), basic("Island", 4)], 99, [
      { colour: "W", target: 0 },
      { colour: "U", target: 0 },
      { colour: "G", target: 0 },
    ]);

    expect(repair).toMatchObject({
      status: "fitted",
      corrections: [
        {
          action: "added",
          name: "Plains",
          quantity: 3,
          reason: "fill_to_size",
        },
        {
          action: "added",
          name: "Forest",
          quantity: 2,
          reason: "fill_to_size",
        },
      ],
    });
  });

  it("fills a colourless command zone with Wastes", () => {
    const repair = fitToDeckSize(spells(97), 99, []);

    expect(repair).toMatchObject({
      status: "fitted",
      corrections: [
        {
          action: "added",
          name: "Wastes",
          quantity: 2,
          reason: "fill_to_size",
        },
      ],
    });
  });

  it("trims a long list from its largest basic stack first, and drops a stack trimmed to zero", () => {
    const repair = fitToDeckSize(
      [
        ...spells(96),
        basic("Swamp", 2),
        basic("Island", 3),
        basic("Forest", 5),
      ],
      99,
      [
        { colour: "U", target: 19 },
        { colour: "B", target: 19 },
        { colour: "G", target: 19 },
      ]
    );

    expect(repair).toEqual({
      status: "fitted",
      cards: [
        ...spells(96).map(({ card }) => card),
        { name: "Swamp", quantity: 2, category: "land" },
        { name: "Island", quantity: 1, category: "land" },
      ],
      corrections: [
        { action: "removed", name: "Forest", quantity: 5, reason: "over_size" },
        { action: "removed", name: "Island", quantity: 2, reason: "over_size" },
      ],
    });
  });

  it.each([
    [100, "1 card"],
    [101, "2 cards"],
  ])(
    "rejects a list of %i spells, since only basics may be cut",
    (count, excess) => {
      expect(
        fitToDeckSize(spells(count), 99, [{ colour: "U", target: 19 }])
      ).toEqual({
        status: "rejected",
        reasons: [
          `The generated deck has ${excess} too many and not enough basic lands to trim.`,
        ],
      });
    }
  );
});
