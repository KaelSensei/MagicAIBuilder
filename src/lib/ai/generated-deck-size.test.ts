import { describe, expect, it } from "vitest";
import { fitToDeckSize, type KeptCard } from "./generated-deck-size";

function spell(name: string, quantity = 1): KeptCard {
  return { card: { name, quantity, category: "other" }, isBasicLand: false };
}

function basic(name: string, quantity: number): KeptCard {
  return { card: { name, quantity, category: "land" }, isBasicLand: true };
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

    expect(fitToDeckSize(kept, 99, ["U"])).toEqual({
      status: "fitted",
      cards: kept.map(({ card }) => card),
      corrections: [],
    });
  });

  it("fills a short list with basics of the command zone's colours in WUBRG order, onto existing stacks first", () => {
    const repair = fitToDeckSize([...spells(60), basic("Island", 34)], 99, [
      "W",
      "U",
    ]);

    expect(repair).toEqual({
      status: "fitted",
      cards: [
        ...spells(60).map(({ card }) => card),
        { name: "Island", quantity: 36, category: "land" },
        { name: "Plains", quantity: 3, category: "land" },
      ],
      corrections: [
        {
          action: "added",
          name: "Plains",
          quantity: 3,
          reason: "fill_to_size",
        },
        {
          action: "added",
          name: "Island",
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
      ["U", "B", "G"]
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
      expect(fitToDeckSize(spells(count), 99, ["U"])).toEqual({
        status: "rejected",
        reasons: [
          `The generated deck has ${excess} too many and not enough basic lands to trim.`,
        ],
      });
    }
  );
});
