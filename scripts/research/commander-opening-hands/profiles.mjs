// Deck profiles shaped on the per-bracket medians (Archidekt/ScrollVault and
// Moxfield/EDHTuner, 2026). They are archetypal shells, not decklists.
// Each `spell` row is a plan card; `key` marks tutors, combo pieces and engines.

const spells = (hist) =>
  Object.entries(hist).map(([mv, count]) => ({
    kind: "spell",
    cost: Number(mv),
    count,
  }));

export const PROFILES = {
  validate36: {
    id: "validate36",
    label: "Validation: 36 lands, 63 three-drops",
    commanderMv: 9,
    cards: [
      { kind: "land", count: 36 },
      { kind: "spell", cost: 3, count: 63 },
    ],
  },

  b1: {
    id: "b1",
    label: "B1 Exhibition — theme-first, 5-MV commander",
    commanderMv: 5,
    cards: [
      { kind: "land", count: 34 },
      { kind: "tland", count: 3 },
      { kind: "rock", cost: 1, out: 2, count: 1 },
      { kind: "rock", cost: 2, out: 1, count: 4 },
      { kind: "lramp", cost: 2, out: 1, tapped: true, count: 1 },
      { kind: "lramp", cost: 3, out: 1, tapped: true, toHand: 1, count: 2 },
      { kind: "rock", cost: 3, out: 1, count: 2 },
      { kind: "draw", cost: 2, n: 2, count: 1 },
      { kind: "engine", cost: 3, count: 2 },
      { kind: "draw", cost: 4, n: 3, count: 5 },
      ...spells({ 1: 4, 2: 10, 3: 11, 4: 10, 5: 5, 6: 2, 7: 2 }),
    ],
  },

  b2: {
    id: "b2",
    label: "B2 Core — midrange, 4-MV commander",
    commanderMv: 4,
    cards: [
      { kind: "land", count: 32 },
      { kind: "tland", count: 4 },
      { kind: "rock", cost: 1, out: 2, count: 1 },
      { kind: "rock", cost: 2, out: 1, count: 5 },
      { kind: "dork", cost: 1, out: 1, count: 1 },
      { kind: "lramp", cost: 2, out: 1, tapped: true, count: 2 },
      { kind: "lramp", cost: 3, out: 1, tapped: true, toHand: 1, count: 2 },
      { kind: "rock", cost: 3, out: 1, count: 2 },
      { kind: "draw", cost: 2, n: 2, count: 2 },
      { kind: "engine", cost: 3, count: 3 },
      { kind: "draw", cost: 4, n: 3, count: 3 },
      { kind: "draw", cost: 5, n: 3, count: 2 },
      ...spells({ 1: 4, 2: 8, 3: 10, 4: 9, 5: 5, 6: 3, 7: 1 }),
    ],
  },

  b3: {
    id: "b3",
    label: "B3 Upgraded — midrange, 4-MV commander",
    commanderMv: 4,
    cards: [
      { kind: "land", count: 34 },
      { kind: "tland", count: 2 },
      { kind: "rock", cost: 1, out: 2, count: 1 },
      { kind: "rock", cost: 2, out: 1, count: 5 },
      { kind: "dork", cost: 1, out: 1, count: 2 },
      { kind: "lramp", cost: 2, out: 1, tapped: true, count: 2 },
      { kind: "lramp", cost: 2, out: 1, tapped: false, count: 1 },
      { kind: "lramp", cost: 3, out: 1, tapped: true, toHand: 1, count: 2 },
      { kind: "draw", cost: 1, n: 1, count: 1 },
      { kind: "draw", cost: 2, n: 2, count: 2 },
      { kind: "engine", cost: 2, count: 1 },
      { kind: "engine", cost: 3, count: 3 },
      { kind: "draw", cost: 4, n: 3, count: 3 },
      ...spells({ 1: 4, 2: 7, 3: 9, 4: 9, 5: 5, 6: 4, 7: 2 }),
    ],
  },

  b3aggro: {
    id: "b3aggro",
    label: "B3 aggro / voltron — low curve, 3-MV commander cast early",
    commanderMv: 3,
    cards: [
      { kind: "land", count: 32 },
      { kind: "tland", count: 1 },
      { kind: "rock", cost: 1, out: 2, count: 1 },
      { kind: "rock", cost: 2, out: 1, count: 5 },
      { kind: "dork", cost: 1, out: 1, count: 2 },
      { kind: "lramp", cost: 2, out: 1, tapped: true, count: 2 },
      { kind: "draw", cost: 1, n: 1, count: 1 },
      { kind: "draw", cost: 2, n: 2, count: 2 },
      { kind: "engine", cost: 2, count: 2 },
      { kind: "engine", cost: 3, count: 2 },
      { kind: "draw", cost: 4, n: 3, count: 2 },
      ...spells({ 1: 7, 2: 13, 3: 12, 4: 8, 5: 4, 6: 2, 7: 1 }),
    ],
  },

  b3big: {
    id: "b3big",
    label: "B3 big mana / battlecruiser — 6-MV commander",
    commanderMv: 6,
    cards: [
      { kind: "land", count: 35 },
      { kind: "tland", count: 3 },
      { kind: "rock", cost: 1, out: 2, count: 1 },
      { kind: "rock", cost: 2, out: 1, count: 5 },
      { kind: "dork", cost: 1, out: 1, count: 2 },
      { kind: "lramp", cost: 2, out: 1, tapped: true, count: 3 },
      { kind: "lramp", cost: 3, out: 1, tapped: true, toHand: 1, count: 4 },
      { kind: "rock", cost: 3, out: 1, count: 1 },
      { kind: "engine", cost: 3, count: 3 },
      { kind: "draw", cost: 4, n: 3, count: 4 },
      { kind: "draw", cost: 5, n: 3, count: 3 },
      ...spells({ 1: 2, 2: 4, 3: 6, 4: 7, 5: 7, 6: 6, 7: 3 }),
    ],
  },

  b3spells: {
    id: "b3spells",
    label: "B3 spellslinger — cantrips and rocks, 4-MV commander",
    commanderMv: 4,
    cards: [
      { kind: "land", count: 34 },
      { kind: "tland", count: 1 },
      { kind: "rock", cost: 1, out: 2, count: 1 },
      { kind: "rock", cost: 2, out: 1, count: 7 },
      { kind: "rock", cost: 3, out: 1, count: 2 },
      { kind: "draw", cost: 1, n: 1, count: 6 },
      { kind: "draw", cost: 2, n: 2, count: 3 },
      { kind: "engine", cost: 2, count: 1 },
      { kind: "engine", cost: 3, count: 2 },
      { kind: "draw", cost: 3, n: 3, count: 2 },
      { kind: "draw", cost: 4, n: 3, count: 2 },
      ...spells({ 1: 8, 2: 10, 3: 9, 4: 5, 5: 3, 6: 2, 7: 1 }),
    ],
  },

  b4: {
    id: "b4",
    label: "B4 Optimized — efficient midrange, 3-MV commander",
    commanderMv: 3,
    cards: [
      { kind: "land", count: 33 },
      { kind: "tland", count: 1 },
      { kind: "rock", cost: 0, out: 1, count: 1 },
      { kind: "rock", cost: 1, out: 2, count: 1 },
      { kind: "dork", cost: 1, out: 1, count: 3 },
      { kind: "rock", cost: 2, out: 1, count: 6 },
      { kind: "lramp", cost: 2, out: 1, tapped: false, count: 2 },
      { kind: "lramp", cost: 2, out: 1, tapped: true, count: 1 },
      { kind: "lramp", cost: 3, out: 1, tapped: true, toHand: 1, count: 1 },
      { kind: "draw", cost: 1, n: 1, count: 1 },
      { kind: "engine", cost: 2, count: 2, key: true },
      { kind: "engine", cost: 3, count: 3, key: true },
      { kind: "draw", cost: 3, n: 3, count: 1 },
      { kind: "draw", cost: 4, n: 3, count: 3 },
      { kind: "spell", cost: 1, count: 2, key: true }, // tutors
      { kind: "spell", cost: 2, count: 2, key: true },
      ...spells({ 0: 1, 1: 4, 2: 6, 3: 8, 4: 7, 5: 5, 6: 3, 7: 2 }),
    ],
  },

  b5: {
    id: "b5",
    label: "B5 cEDH — 2-MV commander, fast mana",
    commanderMv: 2,
    cards: [
      { kind: "land", count: 28 },
      { kind: "rock", cost: 0, out: 1, count: 5 },
      { kind: "rock", cost: 1, out: 2, count: 2 },
      { kind: "dork", cost: 1, out: 1, count: 6 },
      { kind: "rock", cost: 2, out: 1, count: 6 },
      { kind: "lramp", cost: 2, out: 1, tapped: false, count: 2 },
      { kind: "draw", cost: 1, n: 1, count: 4 },
      { kind: "engine", cost: 1, count: 1, key: true },
      { kind: "engine", cost: 3, count: 2, key: true },
      { kind: "draw", cost: 3, n: 3, count: 2 },
      { kind: "spell", cost: 1, count: 4, key: true }, // tutors, Consultation
      { kind: "spell", cost: 2, count: 5, key: true }, // tutors, Oracle, Breach
      { kind: "spell", cost: 3, count: 1, key: true },
      ...spells({ 0: 3, 1: 4, 2: 7, 3: 8, 4: 5, 5: 2, 6: 2 }),
    ],
  },
};

// Variant: change the land count of a profile by swapping untapped lands for
// spells at the deck's typical cost (3 and 4, alternating).
export function withLands(profile, lands) {
  const cards = profile.cards.map((c) => ({ ...c }));
  const landRow = cards.find((c) => c.kind === "land");
  const current = cards
    .filter((c) => c.kind === "land" || c.kind === "tland")
    .reduce((s, c) => s + c.count, 0);
  let delta = lands - current;
  landRow.count += delta;
  const s3 = cards.find((c) => c.kind === "spell" && c.cost === 3 && !c.key);
  const s4 = cards.find((c) => c.kind === "spell" && c.cost === 4 && !c.key);
  let flip = 0;
  while (delta !== 0) {
    const row = flip++ % 2 === 0 ? s3 : s4;
    if (delta > 0) {
      row.count -= 1;
      delta -= 1;
    } else {
      row.count += 1;
      delta += 1;
    }
  }
  return { ...profile, id: `${profile.id}-L${lands}`, cards };
}
