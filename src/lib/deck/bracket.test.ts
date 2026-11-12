import { describe, it, expect, vi } from "vitest";
import { scoreBracket } from "@/lib/deck/bracket";
import type { Combo } from "@/modules/combos";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { DeckStats } from "@/lib/deck/analysis-types";
import { aDeck } from "@/test/builders/deck";

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return aDeck({ id: "test-deck", targetBracket: 2, ...overrides });
}

function makeStats(overrides: Partial<DeckStats> = {}): DeckStats {
  return {
    totalCards: 100,
    lands: 37,
    creatures: 25,
    ramp: 8,
    draw: 8,
    removal: 6,
    boardWipes: 3,
    avgCmc: 3.0,
    manaCurve: { 1: 5, 2: 15, 3: 20, 4: 15, 5: 8 },
    colorDistribution: { U: 30, W: 20 },
    gameChangersCount: 0,
    gameChangersList: [],
    totalPrice: 50,
    overBudgetCards: [],
    bannedCards: [],
    colorIdentityViolations: [],
    commanderRuleIssues: [],
    flexibleLands: 0,
    // Commander is graded by bracket scoring, not format stats.
    formatStats: null,
    manaAlignment: null,
    turnOnePlayability: null,
    ...overrides,
  };
}

/** A Commander Spellbook variant: an infinite combo of exactly two cards. */
function twoCardInfinite(first: string, second: string): Combo {
  return {
    id: `${first}+${second}`,
    cards: [first, second],
    isInfinite: true,
    effects: ["Infinite tokens"],
    description: "",
    prerequisites: { otherPieces: [], conditions: [], manaNeeded: "" },
  };
}

/** A main-deck tutor that is not a Game Changer, e.g. Diabolic Tutor. */
function plainTutor(index: number): DeckCard {
  return {
    id: `tutor-${index}`,
    name: `Plain Tutor ${index}`,
    manaCost: "{2}{B}{B}",
    cmc: 4,
    typeLine: "Sorcery",
    oracleText:
      "Search your library for a card, put that card into your hand, then shuffle.",
    colorIdentity: ["B"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
  };
}

/** Very casual stats: every dimension scores 1. */
const EXHIBITION_STATS: Partial<DeckStats> = {
  ramp: 2,
  draw: 2,
  removal: 2,
  boardWipes: 0,
  avgCmc: 4.5,
};

/** Assert non-null and return typed result (all test decks use format: "commander") */
function assertBracket(result: ReturnType<typeof scoreBracket>) {
  expect(result).not.toBeNull();
  return result!; // eslint-disable-line @typescript-eslint/no-non-null-assertion -- test assertion guards this
}

describe("scoreBracket", () => {
  it("derives warnings from deck data, not AI provenance or network activity", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Bracket warnings must not request external AI output");
    });
    const stats = makeStats({
      bannedCards: ["Griselbrand"],
      colorIdentityViolations: ["Lightning Bolt"],
      gameChangersCount: 1,
      gameChangersList: ["Sol Ring"],
      ramp: 3,
    });

    try {
      const playerCreated = assertBracket(scoreBracket(makeDeck({ isAIGenerated: false }), stats));
      const aiGenerated = assertBracket(scoreBracket(makeDeck({ isAIGenerated: true }), stats));

      expect(aiGenerated.warnings).toEqual(playerCreated.warnings);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("keeps named warnings stable when card order changes", () => {
    const deck = makeDeck();
    const first = makeStats({
      bannedCards: ["Zed", "Alpha"],
      colorIdentityViolations: ["Zed", "Alpha"],
      gameChangersCount: 2,
      gameChangersList: ["Zed", "Alpha"],
    });
    const reordered = makeStats({
      bannedCards: ["Alpha", "Zed"],
      colorIdentityViolations: ["Alpha", "Zed"],
      gameChangersCount: 2,
      gameChangersList: ["Alpha", "Zed"],
    });

    expect(assertBracket(scoreBracket(deck, first)).warnings).toEqual(
      assertBracket(scoreBracket(deck, reordered)).warnings
    );
  });

  it("names a card once when the deck holds several printings of it", () => {
    const stats = makeStats({
      bannedCards: ["Mana Crypt", "Griselbrand", "Mana Crypt"],
      colorIdentityViolations: ["Lightning Bolt", "Lightning Bolt"],
      gameChangersCount: 2,
      gameChangersList: ["Sol Ring", "Sol Ring"],
    });

    expect(assertBracket(scoreBracket(makeDeck(), stats)).warnings).toEqual(
      expect.arrayContaining([
        "Banned cards in deck: Griselbrand, Mana Crypt",
        "Color identity violations: Lightning Bolt",
        "2 Game Changer(s): Sol Ring",
      ])
    );
  });

  it("returns null for non-Commander formats", () => {
    const deck = makeDeck({ format: "standard" });
    const stats = makeStats();
    expect(scoreBracket(deck, stats)).toBeNull();
  });

  it("returns a score between 1 and 4", () => {
    const deck = makeDeck();
    const stats = makeStats();
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.overall).toBeGreaterThanOrEqual(1);
    expect(result.overall).toBeLessThanOrEqual(4);
  });

  it("returns bracket 1 for very casual stats (low ramp/draw, high cmc)", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 2,
      draw: 2,
      removal: 2,
      boardWipes: 0,
      avgCmc: 4.5,
      gameChangersCount: 0,
    });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.overall).toBe(1);
  });

  it("forces minimum bracket 3 when game changers > 0", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 2,
      draw: 2,
      avgCmc: 4.0,
      gameChangersCount: 1,
      gameChangersList: ["Sol Ring"],
    });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.overall).toBeGreaterThanOrEqual(3);
    expect(result.gameChangers).toBe(1);
  });

  it("forces minimum bracket 4 when game changers > 3", () => {
    const deck = makeDeck();
    const stats = makeStats({
      gameChangersCount: 4,
      gameChangersList: ["Sol Ring", "Demonic Tutor", "Rhystic Study", "Mana Crypt"],
    });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.overall).toBe(4);
  });

  it("scores five dimensions, none of them a tutor count", () => {
    const deck = makeDeck();
    const stats = makeStats();
    const result = assertBracket(scoreBracket(deck, stats));
    expect(Object.keys(result.dimensions).sort()).toEqual([
      "avgCmc",
      "draw",
      "ramp",
      "removal",
      "winSpeed",
    ]);
    for (const score of Object.values(result.dimensions)) {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(4);
    }
  });

  it("generates warnings for banned cards", () => {
    const deck = makeDeck();
    const stats = makeStats({ bannedCards: ["Griselbrand"] });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.warnings.some((w) => w.includes("Griselbrand"))).toBe(true);
  });

  it("generates warnings for low ramp", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 3 });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.warnings.some((w) => w.includes("ramp"))).toBe(true);
  });

  it("generates warnings for low land count", () => {
    const deck = makeDeck();
    const stats = makeStats({ lands: 28 });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.warnings.some((w) => w.includes("land"))).toBe(true);
  });

  it("generates no warnings for a well-built deck", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 10,
      draw: 10,
      lands: 36,
      totalCards: 100,
    });
    const result = assertBracket(scoreBracket(deck, stats));
    // Should not have ramp/land/draw warnings
    expect(
      result.warnings.filter((w) => w.includes("ramp") || w.includes("land count"))
    ).toHaveLength(0);
  });

  it("states the official two-card combo rule, not a Rules Committee rule", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 });
    const result = assertBracket(
      scoreBracket(deck, stats, [
        twoCardInfinite("Chatterfang, Squirrel General", "Pitiless Plunderer"),
      ])
    );
    expect(result.twoCardInfiniteCombos).toBe(1);
    expect(result.warnings).toContain(
      "1 infinite 2-card combo detected — Bracket 3 minimum: Brackets 1–2 allow none, Bracket 3 none before turn 6"
    );
    expect(result.warnings.join("\n")).not.toMatch(/\bRC\b|Rules Committee/);
  });

  it("does NOT force bracket 4 for a 3-card infinite combo", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 });
    const combos = [
      { id: "c2", cards: ["A", "B", "C"], isInfinite: true, effects: ["Infinite mana"], description: "", prerequisites: { otherPieces: [], conditions: [], manaNeeded: "" } },
    ];
    const result = assertBracket(scoreBracket(deck, stats, combos as import("@/modules/combos").Combo[]));
    expect(result.twoCardInfiniteCombos).toBe(0);
    expect(result.overall).toBeLessThanOrEqual(3); // may still be low bracket
  });

  it("does NOT force bracket 4 for a non-infinite 2-card combo", () => {
    const deck = makeDeck();
    const stats = makeStats({ ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 });
    const combos = [
      { id: "c3", cards: ["A", "B"], isInfinite: false, effects: ["Draw cards"], description: "", prerequisites: { otherPieces: [], conditions: [], manaNeeded: "" } },
    ];
    const result = assertBracket(scoreBracket(deck, stats, combos as import("@/modules/combos").Combo[]));
    expect(result.twoCardInfiniteCombos).toBe(0);
  });

  it("scores high win speed when many fast-win cards present", () => {
    const fastWinCards = Array.from({ length: 5 }, (_, i) => ({
      id: `fw-${i}`,
      name: `Win Card ${i}`,
      manaCost: "{1}",
      cmc: 1,
      typeLine: "Instant",
      oracleText: "You win the game.",
      colorIdentity: [],
      isGameChanger: false,
      isBanned: false,
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "winCondition" as const,
      quantity: 1,
      zone: "main" as const,
    }));
    const deck = makeDeck({ cards: fastWinCards });
    const stats = makeStats({ avgCmc: 2.0, ramp: 12, draw: 12 });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.dimensions.winSpeed).toBe(4);
  });

  it("warns when computed bracket exceeds target bracket", () => {
    const deck = makeDeck({ targetBracket: 1 as 1 | 2 | 3 | 4 });
    const stats = makeStats({
      ramp: 15,
      draw: 15,
      avgCmc: 1.5,
      removal: 12,
      boardWipes: 5,
    });
    const result = assertBracket(scoreBracket(deck, stats));
    if (result.overall > 1) {
      expect(result.warnings.some((w) => w.includes("target is Bracket 1"))).toBe(true);
    }
  });

  it("warns about low card draw", () => {
    const deck = makeDeck();
    const stats = makeStats({ draw: 2 });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.warnings.some((w) => w.includes("card draw"))).toBe(true);
  });

  it("warns about incomplete deck", () => {
    const deck = makeDeck();
    const stats = makeStats({ totalCards: 60 });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.warnings.some((w) => w.includes("60/100"))).toBe(true);
  });

  it("warns about color identity violations", () => {
    const deck = makeDeck();
    const stats = makeStats({ colorIdentityViolations: ["Lightning Bolt"] });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.warnings.some((w) => w.includes("Lightning Bolt"))).toBe(true);
  });

  it("score clamps to 4 even with extreme stats", () => {
    const deck = makeDeck();
    const stats = makeStats({
      ramp: 20,
      draw: 20,
      avgCmc: 1.0,
      gameChangersCount: 10,
    });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.overall).toBe(4);
  });

  it("propagates getCompanionDeckWarnings into bracket warnings", () => {
    const commander: DeckCard = {
      id: "cmd",
      name: "Isamaru, Hound of Konda",
      manaCost: "{W}",
      cmc: 1,
      typeLine: "Legendary Creature — Dog",
      oracleText: "",
      colorIdentity: ["W"],
      isGameChanger: false,
      isBanned: false,
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "commander",
      quantity: 1,
      zone: "main",
    };
    const companion: DeckCard = {
      id: "comp",
      name: "Lutri, the Spellchaser",
      manaCost: "{U}{R}",
      cmc: 3,
      typeLine: "Legendary Creature — Elemental Otter",
      oracleText: "Companion — Each spell in your deck has a different name.",
      colorIdentity: ["U", "R"],
      isGameChanger: false,
      isBanned: false,
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "companion",
      quantity: 1,
      zone: "main",
    };
    const deck = makeDeck({ commander, companion, cards: [] });
    const stats = makeStats({ totalCards: 100 });
    const result = assertBracket(scoreBracket(deck, stats));
    expect(result.warnings.some((w) => w.toLowerCase().includes("lutri"))).toBe(true);
    expect(result.warnings.some((w) => w.toLowerCase().includes("banned"))).toBe(true);
  });
});

/**
 * The official restrictions set a floor under the estimate (bracket text of
 * 2025-10-21): Brackets 1–2 allow no Game Changers and no two-card combos,
 * Bracket 3 up to three Game Changers and two-card combos that do not come up
 * before turn 6, Bracket 4 anything legal. A deck list cannot show how early a
 * combo comes up, so a two-card combo sets the floor at Bracket 3, not 4.
 */
describe("scoreBracket — official floor per restriction", () => {
  it.each([
    { gameChangers: 0, twoCardCombos: 0, expected: 1 },
    { gameChangers: 1, twoCardCombos: 0, expected: 3 },
    { gameChangers: 3, twoCardCombos: 0, expected: 3 },
    { gameChangers: 4, twoCardCombos: 0, expected: 4 },
    { gameChangers: 0, twoCardCombos: 1, expected: 3 },
    { gameChangers: 0, twoCardCombos: 2, expected: 3 },
    { gameChangers: 3, twoCardCombos: 1, expected: 3 },
    { gameChangers: 4, twoCardCombos: 1, expected: 4 },
  ])(
    "an Exhibition-level list with $gameChangers Game Changers and $twoCardCombos two-card combos scores Bracket $expected",
    ({ gameChangers, twoCardCombos, expected }) => {
      const stats = makeStats({
        ...EXHIBITION_STATS,
        gameChangersCount: gameChangers,
        gameChangersList: Array.from(
          { length: gameChangers },
          (_, i) => `Game Changer ${i}`
        ),
      });
      const combos = Array.from({ length: twoCardCombos }, (_, i) =>
        twoCardInfinite(`Piece A${i}`, `Piece B${i}`)
      );
      expect(
        assertBracket(scoreBracket(makeDeck(), stats, combos)).overall
      ).toBe(expected);
    }
  );

  it("never estimates Bracket 5: only the cEDH metagame separates it from Bracket 4", () => {
    const stats = makeStats({
      ramp: 25,
      draw: 20,
      avgCmc: 1.8,
      gameChangersCount: 15,
    });
    const combos = [twoCardInfinite("Thassa's Oracle", "Demonic Consultation")];
    expect(assertBracket(scoreBracket(makeDeck(), stats, combos)).overall).toBe(
      4
    );
  });
});

/**
 * Regression: Wizards removed the tutor restriction on 2025-10-21 and relies on
 * the Game Changers list to catch efficient tutors. Tutors that are not Game
 * Changers must not move a deck out of Bracket 1 or 2.
 */
describe("scoreBracket — tutors are not restricted", () => {
  it.each([
    { shell: "Exhibition", stats: EXHIBITION_STATS, bracket: 1 },
    { shell: "Core", stats: {}, bracket: 2 },
  ])(
    "a $shell list stays in Bracket $bracket with six plain tutors",
    ({ stats, bracket }) => {
      const deckStats = makeStats(stats);
      const without = assertBracket(scoreBracket(makeDeck(), deckStats));
      const withTutors = assertBracket(
        scoreBracket(
          makeDeck({
            cards: Array.from({ length: 6 }, (_, i) => plainTutor(i)),
          }),
          deckStats
        )
      );

      expect(without.overall).toBe(bracket);
      expect(withTutors.overall).toBe(bracket);
      expect(withTutors.warnings).toEqual(without.warnings);
    }
  );
});
