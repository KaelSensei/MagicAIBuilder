import { describe, it, expect } from "vitest";

import { buildTurnOnePlayability, chanceOfBoth } from "./turn-one";
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

/** A basic land, so production is unambiguous. */
function basic(subtype: string, quantity: number): DeckCard {
  return makeCard({
    name: subtype,
    category: "land",
    typeLine: `Basic Land — ${subtype}`,
    quantity,
  });
}

/** A one-mana spell with the given cost. */
function oneDrop(manaCost: string, quantity = 1): DeckCard {
  return makeCard({ category: "creature", manaCost, cmc: 1, quantity });
}

/** Filler that can never be a turn-one play. */
function filler(quantity: number): DeckCard {
  return makeCard({ category: "creature", manaCost: "{4}", cmc: 4, quantity });
}

describe("chanceOfBoth", () => {
  it("is certain when every card in the deck belongs to one group or the other", () => {
    // 4-card deck, 4-card hand: the hand is the whole deck.
    expect(chanceOfBoth(4, 2, 2, 4)).toBe(1);
  });

  it("is impossible when a group is empty", () => {
    expect(chanceOfBoth(40, 20, 0, 7)).toBe(0);
    expect(chanceOfBoth(40, 0, 20, 7)).toBe(0);
  });

  it("is impossible when the deck is empty", () => {
    expect(chanceOfBoth(0, 0, 0, 7)).toBe(0);
  });

  it("matches the hand-computed value for a small deck", () => {
    // 3-card deck (1 land, 1 spell, 1 blank), 2-card hand. Of the 3 equally
    // likely pairs, exactly one is land+spell.
    expect(chanceOfBoth(3, 1, 1, 2)).toBeCloseTo(1 / 3, 10);
  });

  it("rises as the deck gets richer in both groups", () => {
    const lean = chanceOfBoth(60, 10, 4, 7);
    const rich = chanceOfBoth(60, 24, 12, 7);
    expect(rich).toBeGreaterThan(lean);
  });

  it("never leaves the 0–1 range", () => {
    for (const lands of [0, 1, 17, 24, 40]) {
      const p = chanceOfBoth(60, lands, 60 - lands, 7);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("treats a hand larger than the deck as drawing the whole deck", () => {
    expect(chanceOfBoth(5, 3, 2, 7)).toBe(1);
  });
});

describe("buildTurnOnePlayability", () => {
  it("returns null for a deck with no one-mana spells", () => {
    expect(buildTurnOnePlayability([basic("Forest", 24), filler(36)])).toBeNull();
  });

  it("returns null for an empty library", () => {
    expect(buildTurnOnePlayability([])).toBeNull();
  });

  it("reports the library size it computed against", () => {
    const result = buildTurnOnePlayability([basic("Forest", 24), oneDrop("{G}", 4), filler(32)]);
    expect(result?.deckSize).toBe(60);
    expect(result?.lands).toBe(24);
    expect(result?.oneDrops).toBe(4);
  });

  it("gives a colourless one-drop no colour row but still counts it as a play", () => {
    const result = buildTurnOnePlayability([basic("Forest", 24), oneDrop("{1}", 4), filler(32)]);
    expect(result?.byColor).toEqual([]);
    expect(result?.anyPlay).toBeGreaterThan(0);
  });

  it("lists one row per colour that has a one-drop", () => {
    const cards = [
      basic("Forest", 12),
      basic("Island", 12),
      oneDrop("{G}", 4),
      oneDrop("{U}", 4),
      filler(28),
    ];
    const colors = buildTurnOnePlayability(cards)?.byColor.map((entry) => entry.color);
    expect(colors).toEqual(["U", "G"]);
  });

  it("counts only the sources that produce the colour in question", () => {
    const cards = [basic("Forest", 12), basic("Island", 12), oneDrop("{G}", 4), filler(32)];
    const green = buildTurnOnePlayability(cards)?.byColor[0];
    expect(green?.color).toBe("G");
    expect(green?.sources).toBe(12);
    expect(green?.spells).toBe(4);
  });

  it("counts a hybrid one-drop for each colour it can be cast with", () => {
    const cards = [basic("Plains", 12), basic("Island", 12), oneDrop("{W/U}", 4), filler(32)];
    const result = buildTurnOnePlayability(cards);
    expect(result?.byColor.find((e) => e.color === "W")?.spells).toBe(4);
    expect(result?.byColor.find((e) => e.color === "U")?.spells).toBe(4);
  });

  it("rates a colour with no sources as impossible", () => {
    const cards = [basic("Forest", 24), oneDrop("{W}", 4), filler(32)];
    const white = buildTurnOnePlayability(cards)?.byColor.find((e) => e.color === "W");
    expect(white?.sources).toBe(0);
    expect(white?.probability).toBe(0);
  });

  it("never rates a single colour above the colour-blind figure", () => {
    // Requiring a specific colour can only ever narrow the chance.
    const cards = [basic("Forest", 12), basic("Island", 12), oneDrop("{G}", 6), filler(30)];
    const result = buildTurnOnePlayability(cards);
    for (const entry of result?.byColor ?? []) {
      expect(entry.probability).toBeLessThanOrEqual(result?.anyPlay ?? 0);
    }
  });

  it("rates a deck with more sources and more one-drops higher", () => {
    const lean = buildTurnOnePlayability([basic("Forest", 18), oneDrop("{G}", 2), filler(40)]);
    const rich = buildTurnOnePlayability([basic("Forest", 26), oneDrop("{G}", 12), filler(22)]);
    expect(rich?.anyPlay).toBeGreaterThan(lean?.anyPlay ?? 1);
  });

  it("ignores lands when looking for one-drops, even a one-mana land", () => {
    // A land is played, not cast; its cmc must not make it a spell.
    const landWithCmc = makeCard({ category: "land", typeLine: "Land — Forest", cmc: 1, quantity: 24 });
    const result = buildTurnOnePlayability([landWithCmc, oneDrop("{G}", 4), filler(32)]);
    expect(result?.oneDrops).toBe(4);
  });
});
