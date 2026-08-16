import { describe, it, expect } from "vitest";

import { buildManaAlignment, countColorSources } from "./mana-alignment";
import type { DeckCard } from "./types";

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card-1",
    name: "Card",
    manaCost: "",
    cmc: 0,
    typeLine: "Instant",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

/** A land whose production has to be derived from its printed text. */
function land(overrides: Partial<DeckCard> = {}): DeckCard {
  return makeCard({ category: "land", typeLine: "Land", ...overrides });
}

/** A basic land, the simplest source: production comes from the subtype. */
function basic(subtype: string, quantity = 1): DeckCard {
  return land({
    name: subtype,
    typeLine: `Basic Land — ${subtype}`,
    quantity,
  });
}

/** A non-land card carrying coloured pips. */
function spell(manaCost: string, quantity = 1): DeckCard {
  return makeCard({ category: "creature", manaCost, cmc: 1, quantity });
}

describe("countColorSources", () => {
  it("reads production from a basic land subtype", () => {
    const sources = countColorSources([basic("Forest", 8)]);
    expect(sources.G).toBe(8);
    expect(sources.W).toBe(0);
  });

  it("credits both colours of a dual land carrying two subtypes", () => {
    const dual = land({
      name: "Tundra",
      typeLine: "Land — Plains Island",
    });
    const sources = countColorSources([dual]);
    expect(sources.W).toBe(1);
    expect(sources.U).toBe(1);
  });

  it("reads production from an activated ability when there is no subtype", () => {
    const cavern = land({
      name: "Gruul Turf",
      oracleText: "Gruul Turf enters tapped.\n{T}: Add {R}{G}.",
    });
    const sources = countColorSources([cavern]);
    expect(sources.R).toBe(1);
    expect(sources.G).toBe(1);
  });

  it("credits every colour for a land that taps for any colour", () => {
    const cityOfBrass = land({
      name: "City of Brass",
      oracleText: "{T}: Add one mana of any color.",
    });
    const sources = countColorSources([cityOfBrass]);
    expect(sources).toEqual({ W: 1, U: 1, B: 1, R: 1, G: 1 });
  });

  it("ignores coloured symbols that are not part of what the land adds", () => {
    // The {W} here is a cost, not production: crediting it would invent a
    // white source that the deck cannot actually tap for.
    const shrine = land({
      name: "Test Shrine",
      oracleText: "{W}, {T}: Draw a card.\n{T}: Add {B}.",
    });
    const sources = countColorSources([shrine]);
    expect(sources.B).toBe(1);
    expect(sources.W).toBe(0);
  });

  it("counts a land once per copy", () => {
    expect(countColorSources([basic("Island", 12)]).U).toBe(12);
  });

  it("ignores non-land cards even when they produce mana", () => {
    const ramp = makeCard({
      category: "ramp",
      name: "Llanowar Elves",
      oracleText: "{T}: Add {G}.",
    });
    expect(countColorSources([ramp]).G).toBe(0);
  });

  it("falls back to colour identity when the text says nothing usable", () => {
    const oddLand = land({
      name: "Unparsed Land",
      oracleText: "",
      colorIdentity: ["U", "B"],
    });
    const sources = countColorSources([oddLand]);
    expect(sources.U).toBe(1);
    expect(sources.B).toBe(1);
  });

  it("credits no colour to a land that only makes colourless mana", () => {
    const wastes = land({ name: "Wastes", oracleText: "{T}: Add {C}." });
    expect(countColorSources([wastes])).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 0 });
  });
});

describe("buildManaAlignment", () => {
  it("returns null for a deck with no coloured pips", () => {
    const cards = [basic("Forest", 10), makeCard({ manaCost: "{2}" })];
    expect(buildManaAlignment(cards)).toBeNull();
  });

  it("reports a deck whose sources mirror its pips as aligned", () => {
    // 10 green pips, 10 red pips; 10 Forests, 10 Mountains.
    const cards = [
      spell("{G}", 10),
      spell("{R}", 10),
      basic("Forest", 10),
      basic("Mountain", 10),
    ];
    const alignment = buildManaAlignment(cards);
    expect(alignment).not.toBeNull();
    expect(alignment?.isAligned).toBe(true);
    for (const color of alignment?.colors ?? []) {
      expect(color.status).toBe("aligned");
    }
  });

  it("flags a colour with far fewer sources than pips as under-supported", () => {
    // White carries 90% of the pips but only 10% of the sources.
    const cards = [spell("{W}", 9), spell("{U}", 1), basic("Plains", 1), basic("Island", 9)];
    const alignment = buildManaAlignment(cards);
    const white = alignment?.colors.find((c) => c.color === "W");
    expect(white?.status).toBe("under");
    expect(alignment?.isAligned).toBe(false);
  });

  it("flags the mirror-image colour as over-supported", () => {
    const cards = [spell("{W}", 9), spell("{U}", 1), basic("Plains", 1), basic("Island", 9)];
    const blue = buildManaAlignment(cards)?.colors.find((c) => c.color === "U");
    expect(blue?.status).toBe("over");
  });

  it("recommends a source count proportional to the colour's pip share", () => {
    // 75% of pips are green, so 75% of the 20 sources — 15 — should be green.
    const cards = [spell("{G}", 15), spell("{R}", 5), basic("Forest", 10), basic("Mountain", 10)];
    const green = buildManaAlignment(cards)?.colors.find((c) => c.color === "G");
    expect(green?.recommendedSources).toBe(15);
    expect(green?.sources).toBe(10);
  });

  it("omits colours the deck does not play", () => {
    const cards = [spell("{G}", 4), basic("Forest", 8)];
    const colors = buildManaAlignment(cards)?.colors.map((c) => c.color);
    expect(colors).toEqual(["G"]);
  });

  it("splits a hybrid pip across both of its colours", () => {
    // {W/U} is half a white pip and half a blue pip.
    const cards = [spell("{W/U}", 2), basic("Plains", 5), basic("Island", 5)];
    const alignment = buildManaAlignment(cards);
    expect(alignment?.colors.find((c) => c.color === "W")?.pips).toBe(1);
    expect(alignment?.colors.find((c) => c.color === "U")?.pips).toBe(1);
  });

  it("counts commander pips, since the commander is always castable", () => {
    const cards = [
      makeCard({ category: "commander", manaCost: "{B}{B}", cmc: 2 }),
      basic("Swamp", 10),
    ];
    const alignment = buildManaAlignment(cards);
    expect(alignment?.colors.find((c) => c.color === "B")?.pips).toBe(2);
  });

  it("reports every colour as under-supported when the deck has no lands", () => {
    const alignment = buildManaAlignment([spell("{R}", 4)]);
    expect(alignment?.totalSources).toBe(0);
    const red = alignment?.colors.find((c) => c.color === "R");
    expect(red?.sourceShare).toBe(0);
    expect(red?.status).toBe("under");
    expect(red?.recommendedSources).toBe(0);
  });

  it("counts colourless-only lands as sources without crediting a colour", () => {
    const cards = [spell("{R}", 4), basic("Mountain", 8), land({ name: "Wastes", oracleText: "{T}: Add {C}." })];
    const alignment = buildManaAlignment(cards);
    expect(alignment?.colorlessSources).toBe(1);
    expect(alignment?.totalSources).toBe(9);
  });
});
