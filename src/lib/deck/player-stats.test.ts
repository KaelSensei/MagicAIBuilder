import { describe, expect, it } from "vitest";

import {
  countPlayerStats,
  countsDeckCards,
  type PlayerStatsCard,
  type PlayerStatsDeck,
  type StatsWindow,
} from "./player-stats";

const YEAR_2026: StatsWindow = {
  start: new Date("2026-01-01T00:00:00Z"),
  end: new Date("2026-12-01T00:00:00Z"),
};

const BEFORE_THE_WINDOW = new Date("2025-06-01T00:00:00Z");
const IN_THE_WINDOW = new Date("2026-03-15T00:00:00Z");
const AFTER_THE_CUT_OFF = new Date("2026-12-10T00:00:00Z");

const SOL_RING: PlayerStatsCard = { name: "Sol Ring", typeLine: "Artifact" };
const ARCANE_SIGNET: PlayerStatsCard = { name: "Arcane Signet", typeLine: "Artifact" };
const RELENTLESS_RATS: PlayerStatsCard = { name: "Relentless Rats", typeLine: "Creature — Rat" };
const FOREST: PlayerStatsCard = { name: "Forest", typeLine: "Basic Land — Forest" };

/** A Commander deck created and last saved in March 2026, with no card. */
function aStatsDeck(overrides: Partial<PlayerStatsDeck> = {}): PlayerStatsDeck {
  return {
    deckId: "deck-1",
    format: "commander",
    commanders: ["Atraxa, Praetors' Voice"],
    colorIdentity: ["W", "U", "B", "G"],
    computedBracket: null,
    targetBracket: null,
    mainCards: [],
    createdAt: IN_THE_WINDOW,
    updatedAt: IN_THE_WINDOW,
    snapshotDates: [],
    ...overrides,
  };
}

describe("countPlayerStats", () => {
  it("counts a deck created in the window as active and added", () => {
    const stats = countPlayerStats([aStatsDeck({ deckId: "atraxa" })], YEAR_2026);

    expect(stats.activeDeckIds).toEqual(["atraxa"]);
    expect(stats.addedDeckIds).toEqual(["atraxa"]);
  });

  it("leaves out a deck untouched in the window and a deck created after its cut-off", () => {
    const untouched = aStatsDeck({
      deckId: "untouched",
      createdAt: BEFORE_THE_WINDOW,
      updatedAt: BEFORE_THE_WINDOW,
    });
    const afterCutOff = aStatsDeck({
      deckId: "december",
      createdAt: AFTER_THE_CUT_OFF,
      updatedAt: AFTER_THE_CUT_OFF,
    });

    const stats = countPlayerStats([untouched, afterCutOff], YEAR_2026);

    expect(stats.activeDeckIds).toEqual([]);
    expect(stats.addedDeckIds).toEqual([]);
  });

  it("counts an older deck with a snapshot in the window as active and changed, not added", () => {
    const older = aStatsDeck({
      deckId: "older",
      createdAt: BEFORE_THE_WINDOW,
      updatedAt: BEFORE_THE_WINDOW,
      snapshotDates: [BEFORE_THE_WINDOW, IN_THE_WINDOW],
    });

    const stats = countPlayerStats([older], YEAR_2026);

    expect(stats.activeDeckIds).toEqual(["older"]);
    expect(stats.changedDeckIds).toEqual(["older"]);
    expect(stats.addedDeckIds).toEqual([]);
  });

  it("counts an older deck last saved in the window as active and changed", () => {
    const saved = aStatsDeck({
      deckId: "saved",
      createdAt: BEFORE_THE_WINDOW,
      updatedAt: IN_THE_WINDOW,
    });

    const stats = countPlayerStats([saved], YEAR_2026);

    expect(stats.activeDeckIds).toEqual(["saved"]);
    expect(stats.changedDeckIds).toEqual(["saved"]);
  });

  it("does not count a deck as changed when its only save is its creation", () => {
    const stats = countPlayerStats([aStatsDeck({ deckId: "new" })], YEAR_2026);

    expect(stats.changedDeckIds).toEqual([]);
  });

  it("counts every active deck by format and keeps Commander-family decks for the commander statistics", () => {
    const decks = [
      aStatsDeck({ deckId: "modern", format: "modern", commanders: [] }),
      aStatsDeck({ deckId: "commander" }),
      aStatsDeck({ deckId: "brawl", format: "brawl" }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.formats).toEqual([
      { format: "commander", deckIds: ["commander"] },
      { format: "brawl", deckIds: ["brawl"] },
      { format: "modern", deckIds: ["modern"] },
    ]);
    expect(stats.commanderDeckIds).toEqual(["commander", "brawl"]);
  });

  it("counts the Commander-family decks of each colour, in WUBRG order", () => {
    const decks = [
      aStatsDeck({ deckId: "atraxa", colorIdentity: ["W", "U", "B", "G"] }),
      aStatsDeck({ deckId: "omnath", colorIdentity: ["G"] }),
      aStatsDeck({ deckId: "kozilek", colorIdentity: [] }),
      aStatsDeck({ deckId: "elves", format: "modern", commanders: [], colorIdentity: ["G"] }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.colors).toEqual([
      { color: "W", deckIds: ["atraxa"] },
      { color: "U", deckIds: ["atraxa"] },
      { color: "B", deckIds: ["atraxa"] },
      { color: "R", deckIds: [] },
      { color: "G", deckIds: ["atraxa", "omnath"] },
    ]);
  });

  it("counts decks per colour identity, colourless included, the most decks first", () => {
    const decks = [
      aStatsDeck({ deckId: "omnath", colorIdentity: ["G"] }),
      aStatsDeck({ deckId: "atraxa", colorIdentity: ["G", "W", "U", "B"] }),
      aStatsDeck({ deckId: "kozilek", colorIdentity: [] }),
      aStatsDeck({ deckId: "tymna-kraum", colorIdentity: ["W", "U", "B", "G"] }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.colorIdentities).toEqual([
      { identity: ["W", "U", "B", "G"], deckIds: ["atraxa", "tymna-kraum"] },
      { identity: [], deckIds: ["kozilek"] },
      { identity: ["G"], deckIds: ["omnath"] },
    ]);
  });

  it("counts a partner pair as one commander whichever slot each partner sits in", () => {
    const decks = [
      aStatsDeck({ deckId: "atraxa", commanders: ["Atraxa, Praetors' Voice"] }),
      aStatsDeck({ deckId: "pair-1", commanders: ["Tymna the Weaver", "Kraum, Ludevic's Opus"] }),
      aStatsDeck({ deckId: "pair-2", commanders: ["Kraum, Ludevic's Opus", "Tymna the Weaver"] }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.commanders.map(({ names, deckIds }) => ({ names, deckIds }))).toEqual([
      { names: ["Kraum, Ludevic's Opus", "Tymna the Weaver"], deckIds: ["pair-1", "pair-2"] },
      { names: ["Atraxa, Praetors' Voice"], deckIds: ["atraxa"] },
    ]);
  });

  it("marks a commander new when none of the player's decks created before the window had it", () => {
    const decks = [
      aStatsDeck({ deckId: "atraxa-2025", createdAt: BEFORE_THE_WINDOW, updatedAt: BEFORE_THE_WINDOW }),
      aStatsDeck({ deckId: "atraxa-2026" }),
      aStatsDeck({ deckId: "omnath", commanders: ["Omnath, Locus of Creation"] }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.commanders.map(({ names, isNew }) => ({ names, isNew }))).toEqual([
      { names: ["Atraxa, Praetors' Voice"], isNew: false },
      { names: ["Omnath, Locus of Creation"], isNew: true },
    ]);
  });

  it("ranks the cards used most once per deck whatever their copies, basics left out, ties by name", () => {
    const decks = [
      aStatsDeck({
        deckId: "rats",
        mainCards: [...Array.from({ length: 20 }, () => RELENTLESS_RATS), SOL_RING, FOREST],
      }),
      aStatsDeck({ deckId: "atraxa", mainCards: [SOL_RING, ARCANE_SIGNET, FOREST] }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.cardsUsedMost).toEqual([
      { name: "Sol Ring", deckIds: ["rats", "atraxa"] },
      { name: "Arcane Signet", deckIds: ["atraxa"] },
      { name: "Relentless Rats", deckIds: ["rats"] },
    ]);
  });

  it("lists only the ten cards used most", () => {
    const twelveCards = Array.from({ length: 12 }, (_, index) => ({
      name: `Card ${String(index).padStart(2, "0")}`,
      typeLine: "Artifact",
    }));

    const stats = countPlayerStats([aStatsDeck({ mainCards: twelveCards })], YEAR_2026);

    expect(stats.cardsUsedMost.map((card) => card.name)).toEqual(
      twelveCards.slice(0, 10).map((card) => card.name)
    );
  });

  it("counts the distinct cards in two or more decks and lists the five most shared", () => {
    const sevenShared = Array.from({ length: 7 }, (_, index) => ({
      name: `Shared ${index}`,
      typeLine: "Artifact",
    }));
    const decks = [
      aStatsDeck({ deckId: "a", mainCards: [...sevenShared, SOL_RING, FOREST] }),
      aStatsDeck({ deckId: "b", mainCards: [...sevenShared, FOREST] }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.sharedCards.count).toBe(7);
    expect(stats.sharedCards.mostShared).toEqual(
      sevenShared.slice(0, 5).map((card) => ({ name: card.name, deckIds: ["a", "b"] }))
    );
  });

  it("counts per bracket the decks computed at it and the decks whose player aims for it", () => {
    const decks = [
      aStatsDeck({ deckId: "a", computedBracket: 3, targetBracket: 2 }),
      aStatsDeck({ deckId: "b", computedBracket: 3, targetBracket: null }),
      aStatsDeck({ deckId: "c", computedBracket: null, targetBracket: 4 }),
    ];

    const stats = countPlayerStats(decks, YEAR_2026);

    expect(stats.brackets).toEqual([
      { bracket: 1, computedDeckIds: [], targetDeckIds: [] },
      { bracket: 2, computedDeckIds: [], targetDeckIds: ["a"] },
      { bracket: 3, computedDeckIds: ["a", "b"], targetDeckIds: [] },
      { bracket: 4, computedDeckIds: [], targetDeckIds: ["c"] },
      { bracket: 5, computedDeckIds: [], targetDeckIds: [] },
    ]);
  });
});

describe("countsDeckCards", () => {
  it("counts the cards of a Commander deck added or changed in the window", () => {
    const added = aStatsDeck();
    const changed = aStatsDeck({
      createdAt: BEFORE_THE_WINDOW,
      updatedAt: BEFORE_THE_WINDOW,
      snapshotDates: [IN_THE_WINDOW],
    });

    expect(countsDeckCards(added, YEAR_2026)).toBe(true);
    expect(countsDeckCards(changed, YEAR_2026)).toBe(true);
  });

  it("counts no card of an untouched Commander deck nor of an active deck in another format", () => {
    const untouched = aStatsDeck({ createdAt: BEFORE_THE_WINDOW, updatedAt: BEFORE_THE_WINDOW });
    const modern = aStatsDeck({ format: "modern" });

    expect(countsDeckCards(untouched, YEAR_2026)).toBe(false);
    expect(countsDeckCards(modern, YEAR_2026)).toBe(false);
  });
});
