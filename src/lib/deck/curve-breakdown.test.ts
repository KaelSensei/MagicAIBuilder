/**
 * Solitary tests of the mana curve breakdown: which rows a bar counts, permanents against spells,
 * the medians, the total mana value, and a bar's own cards and colours.
 */
import { describe, expect, it } from "vitest";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import type { DeckCard } from "@/lib/deck/types";
import { computeDeckStats } from "./stats";
import {
  curveBucketCards,
  curveMedians,
  curvePartsByBucket,
  curveSideOf,
  totalManaValue,
} from "./curve-breakdown";

const card = (overrides: Partial<DeckCard>): DeckCard =>
  aDeckCard({ id: overrides.name, ...overrides });

/** The face fields these tests never read. */
const blankText = { oracleText: "", imageUri: "", artCropUri: "" } as const;

describe("curveSideOf", () => {
  it.each([
    ["Artifact", "permanent"],
    ["Battle — Siege", "permanent"],
    ["Legendary Creature — Elf Druid", "permanent"],
    ["Enchantment — Aura", "permanent"],
    ["Legendary Planeswalker — Jace", "permanent"],
    ["Instant", "spell"],
    ["Kindred Sorcery — Elf", "spell"],
  ] as const)("reads a %s as a %s (CR 110.4)", (typeLine, side) => {
    expect(curveSideOf(card({ name: "X", typeLine }))).toBe(side);
  });

  it("counts a double-faced card by its front face (CR 712.8a)", () => {
    const delver = card({
      name: "Delver of Secrets",
      typeLine: "Creature — Human Wizard // Creature — Human Insect",
    });
    const spellFront = card({
      name: "Bala Ged Recovery",
      typeLine: "Sorcery // Land",
      cardFaces: [
        {
          name: "Bala Ged Recovery",
          manaCost: "{2}{G}",
          typeLine: "Sorcery",
          ...blankText,
        },
        {
          name: "Bala Ged Sanctuary",
          manaCost: "",
          typeLine: "Land",
          ...blankText,
        },
      ],
    });

    expect(curveSideOf(delver)).toBe("permanent");
    expect(curveSideOf(spellFront)).toBe("spell");
  });
});

describe("curvePartsByBucket", () => {
  it("splits each bucket so its parts add up to buildManaCurve's figure for a deck with a commander", () => {
    const deck = aDeck({
      commander: card({
        name: "Omnath",
        cmc: 4,
        typeLine: "Legendary Creature — Elemental",
        category: "creature",
      }),
      partner: card({
        name: "Thrasios",
        cmc: 2,
        typeLine: "Legendary Creature — Merfolk",
        category: "creature",
      }),
      companion: card({
        name: "Jegantha",
        cmc: 5,
        typeLine: "Creature — Elemental",
        category: "creature",
      }),
      cards: [
        card({
          name: "Cultivate",
          cmc: 3,
          typeLine: "Sorcery",
          category: "ramp",
          quantity: 1,
        }),
        card({
          name: "Llanowar Elves",
          cmc: 1,
          typeLine: "Creature — Elf",
          category: "ramp",
        }),
        card({
          name: "Forest",
          cmc: 0,
          typeLine: "Basic Land — Forest",
          category: "land",
          quantity: 30,
        }),
        card({
          name: "Sol Ring",
          cmc: 1,
          typeLine: "Artifact",
          category: "ramp",
        }),
        card({
          name: "Emrakul",
          cmc: 15,
          typeLine: "Legendary Creature — Eldrazi",
          category: "creature",
        }),
        card({
          name: "Craterhoof",
          cmc: 8,
          typeLine: "Creature — Beast",
          category: "creature",
        }),
        card({
          name: "Negate",
          cmc: 2,
          typeLine: "Instant",
          category: "removal",
          zone: "sideboard",
        }),
        card({
          name: "Opt",
          cmc: 1,
          typeLine: "Instant",
          category: "draw",
          zone: "maybeboard",
        }),
      ],
    });
    // The builder's `deckAnalysisCards`: commander, partner and every zone, never the companion.
    const analysed = [deck.commander, deck.partner, ...deck.cards].filter(
      (row) => row !== null
    );

    const parts = curvePartsByBucket(analysed);
    const sums = Object.fromEntries(
      [...parts].map(([bucket, part]) => [
        bucket,
        part.permanents + part.spells,
      ])
    );

    expect(sums).toEqual(computeDeckStats(deck).manaCurve);
    expect(parts.get(1)).toEqual({ permanents: 2, spells: 0 });
    expect(parts.get(3)).toEqual({ permanents: 0, spells: 1 });
    expect(parts.get(7)).toEqual({ permanents: 2, spells: 0 });
  });
});

describe("curveMedians", () => {
  it("takes the mean of the two middle copies of an even count, from the stored mana value", () => {
    const cards = [
      card({ name: "Bear", cmc: 2, typeLine: "Creature — Bear" }),
      card({ name: "Opt", cmc: 3, typeLine: "Instant" }),
      card({ name: "Rampant Growth", cmc: 4, typeLine: "Sorcery" }),
      card({
        name: "Emrakul",
        cmc: 15,
        typeLine: "Legendary Creature — Eldrazi",
      }),
      card({
        name: "Negate",
        cmc: 9,
        typeLine: "Instant",
        zone: "sideboard",
        quantity: 9,
      }),
    ];

    expect(curveMedians(cards).withoutLands).toBe(3.5);
  });

  it("counts every copy, so one row of several copies weighs as much as that many rows", () => {
    const cards = [
      card({
        name: "Relentless Rats",
        cmc: 3,
        typeLine: "Creature — Rat",
        quantity: 3,
      }),
      card({ name: "Craterhoof", cmc: 8, typeLine: "Creature — Beast" }),
      card({
        name: "Emrakul",
        cmc: 15,
        typeLine: "Legendary Creature — Eldrazi",
      }),
    ];

    expect(curveMedians(cards).withoutLands).toBe(3);
  });

  it("adds the main deck's lands, a land-filed modal double-faced card included, at mana value 0 to the median with lands (CR 202.3a)", () => {
    const cards = [
      card({ name: "Bear", cmc: 2, typeLine: "Creature — Bear" }),
      card({ name: "Opt", cmc: 3, typeLine: "Instant" }),
      card({ name: "Rampant Growth", cmc: 4, typeLine: "Sorcery" }),
      card({
        name: "Forest",
        cmc: 0,
        typeLine: "Basic Land — Forest",
        category: "land",
        quantity: 2,
      }),
      card({
        name: "Emeria's Call",
        cmc: 7,
        typeLine: "Sorcery // Land",
        category: "land",
      }),
      card({
        name: "Island",
        cmc: 0,
        typeLine: "Basic Land — Island",
        category: "land",
        zone: "sideboard",
        quantity: 20,
      }),
    ];

    // Copies with lands: 0, 0, 0, 2, 3, 4.
    expect(curveMedians(cards)).toEqual({ withoutLands: 3, withLands: 1 });
  });

  it("has neither median for a deck with no nonland card, lands or not", () => {
    const lands = [
      card({
        name: "Forest",
        typeLine: "Basic Land — Forest",
        category: "land",
        quantity: 36,
      }),
    ];

    expect(curveMedians([])).toEqual({ withoutLands: null, withLands: null });
    expect(curveMedians(lands)).toEqual({
      withoutLands: null,
      withLands: null,
    });
  });
});

describe("curveBucketCards", () => {
  it("counts a card without a mana cost by its colour identity, and one with neither as colourless", () => {
    const cards = [
      card({
        name: "Ancestral Vision",
        cmc: 0,
        typeLine: "Sorcery",
        colorIdentity: ["U"],
      }),
      card({
        name: "Ornithopter",
        cmc: 0,
        manaCost: "{0}",
        typeLine: "Artifact Creature — Thopter",
      }),
      card({ name: "Gleemox", cmc: 0, typeLine: "Artifact", quantity: 2 }),
      card({
        name: "Lotus Petal",
        cmc: 0,
        typeLine: "Artifact",
        zone: "maybeboard",
      }),
    ];

    const bucket = curveBucketCards(cards, 0);

    expect(bucket.rows.map(({ name }) => name)).toEqual([
      "Ancestral Vision",
      "Gleemox",
      "Ornithopter",
    ]);
    expect(bucket.count).toBe(4);
    expect(bucket.parts).toEqual({ permanents: 3, spells: 1 });
    expect(bucket.colours).toEqual([
      { colour: "U", copies: 1 },
      { colour: "C", copies: 3 },
    ]);
  });
});

describe("totalManaValue", () => {
  it("sums mana value times quantity over the commander, partner and main deck, lands adding nothing (CR 202.3)", () => {
    const cards = [
      card({
        name: "Omnath",
        cmc: 4,
        typeLine: "Legendary Creature — Elemental",
        category: "creature",
      }),
      card({
        name: "Relentless Rats",
        cmc: 3,
        typeLine: "Creature — Rat",
        quantity: 2,
      }),
      card({
        name: "Emrakul",
        cmc: 15,
        typeLine: "Legendary Creature — Eldrazi",
      }),
      card({
        name: "Emeria's Call",
        cmc: 7,
        typeLine: "Sorcery // Land",
        category: "land",
      }),
      card({ name: "Negate", cmc: 2, typeLine: "Instant", zone: "sideboard" }),
    ];

    expect(totalManaValue(cards)).toBe(25);
    expect(totalManaValue([])).toBe(0);
  });
});
