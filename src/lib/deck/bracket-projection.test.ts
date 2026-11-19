/**
 * `scoreBracket` keeps the numbers the builder shows today (I-77 slice 1).
 *
 * The builder's bracket badge reads `scoreBracket` (`useBracketScore`). This
 * slice makes it a projection of `explainBracket` and must move no number,
 * including on a list under 60 cards, where the audit counts the floors only
 * (requirement 2.6) but the badge still shows the heuristic.
 */
import { describe, expect, it } from "vitest";
import { scoreBracket } from "@/lib/deck/bracket";
import type { DeckStats } from "@/lib/deck/analysis-types";
import {
  explainBracket,
  heuristicReading,
  termScores,
} from "@/lib/deck/explain-bracket";
import type { BracketAssessment } from "@/lib/deck/bracket-assessment";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck } from "@/lib/deck/types";
import type { Combo } from "@/modules/combos";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import {
  aDeckStats,
  aThirtyCardList,
  aTwoCardInfinite,
  cards,
} from "@/lib/deck/testing/bracket-decks";

/** One call of `bracket.test.ts`: its deck, stats and combos. */
interface ScoreCase {
  readonly name: string;
  readonly deck?: Partial<Deck>;
  readonly stats?: Partial<DeckStats>;
  readonly combos?: readonly Combo[];
}

/** Very casual stats: every dimension scores 1. */
const EXHIBITION: Partial<DeckStats> = {
  ramp: 2,
  draw: 2,
  removal: 2,
  boardWipes: 0,
  avgCmc: 4.5,
};

const fastWinCards = cards(5, (i) =>
  aDeckCard({
    id: `fw-${i}`,
    name: `Win Card ${i}`,
    cmc: 1,
    typeLine: "Instant",
    oracleText: "You win the game.",
    category: "winCondition",
  })
);

const plainTutors = cards(6, (i) =>
  aDeckCard({
    id: `tutor-${i}`,
    name: `Plain Tutor ${i}`,
    cmc: 4,
    typeLine: "Sorcery",
    oracleText:
      "Search your library for a card, put that card into your hand, then shuffle.",
    colorIdentity: ["B"],
  })
);

const companionDeck: Partial<Deck> = {
  cards: [],
  commander: aDeckCard({
    id: "cmd",
    name: "Isamaru, Hound of Konda",
    cmc: 1,
    typeLine: "Legendary Creature — Dog",
    colorIdentity: ["W"],
    category: "commander",
  }),
  companion: aDeckCard({
    id: "comp",
    name: "Lutri, the Spellchaser",
    cmc: 3,
    typeLine: "Legendary Creature — Elemental Otter",
    oracleText: "Companion — Each spell in your deck has a different name.",
    colorIdentity: ["U", "R"],
    category: "companion",
  }),
};

const threeCardInfinite: Combo = {
  ...aTwoCardInfinite("A", "B"),
  id: "c2",
  cards: ["A", "B", "C"],
};
const twoCardValueCombo: Combo = {
  ...aTwoCardInfinite("A", "B"),
  id: "c3",
  isInfinite: false,
};

/** The official floor table of `bracket.test.ts`: Game Changers, two-card combos. */
const FLOOR_TABLE = [
  [0, 0],
  [1, 0],
  [3, 0],
  [4, 0],
  [0, 1],
  [0, 2],
  [3, 1],
  [4, 1],
] as const;

const floorCases: readonly ScoreCase[] = FLOOR_TABLE.map(
  ([gameChangers, twoCardCombos]) => ({
    name: `floor table: ${gameChangers} Game Changers, ${twoCardCombos} two-card combos`,
    stats: {
      ...EXHIBITION,
      gameChangersCount: gameChangers,
      gameChangersList: Array.from(
        { length: gameChangers },
        (_, i) => `Game Changer ${i}`
      ),
    },
    combos: Array.from({ length: twoCardCombos }, (_, i) =>
      aTwoCardInfinite(`Piece A${i}`, `Piece B${i}`)
    ),
  })
);

/** The deck, stats and combos of every `scoreBracket` call in `bracket.test.ts`. */
const BRACKET_TEST_CASES: readonly ScoreCase[] = [
  {
    name: "warnings from deck data, player-created",
    deck: { isAIGenerated: false },
    stats: {
      bannedCards: ["Griselbrand"],
      colorIdentityViolations: ["Lightning Bolt"],
      gameChangersCount: 1,
      gameChangersList: ["Sol Ring"],
      ramp: 3,
    },
  },
  {
    name: "warnings from deck data, AI-generated",
    deck: { isAIGenerated: true },
    stats: {
      bannedCards: ["Griselbrand"],
      colorIdentityViolations: ["Lightning Bolt"],
      gameChangersCount: 1,
      gameChangersList: ["Sol Ring"],
      ramp: 3,
    },
  },
  {
    name: "named warnings, first order",
    stats: {
      bannedCards: ["Zed", "Alpha"],
      colorIdentityViolations: ["Zed", "Alpha"],
      gameChangersCount: 2,
      gameChangersList: ["Zed", "Alpha"],
    },
  },
  {
    name: "named warnings, reordered",
    stats: {
      bannedCards: ["Alpha", "Zed"],
      colorIdentityViolations: ["Alpha", "Zed"],
      gameChangersCount: 2,
      gameChangersList: ["Alpha", "Zed"],
    },
  },
  {
    name: "several printings",
    stats: {
      bannedCards: ["Mana Crypt", "Griselbrand", "Mana Crypt"],
      colorIdentityViolations: ["Lightning Bolt", "Lightning Bolt"],
      gameChangersCount: 2,
      gameChangersList: ["Sol Ring", "Sol Ring"],
    },
  },
  { name: "the default stats" },
  { name: "very casual stats", stats: { ...EXHIBITION, gameChangersCount: 0 } },
  {
    name: "one Game Changer",
    stats: {
      ramp: 2,
      draw: 2,
      avgCmc: 4.0,
      gameChangersCount: 1,
      gameChangersList: ["Sol Ring"],
    },
  },
  {
    name: "four Game Changers",
    stats: {
      gameChangersCount: 4,
      gameChangersList: [
        "Sol Ring",
        "Demonic Tutor",
        "Rhystic Study",
        "Mana Crypt",
      ],
    },
  },
  { name: "a banned card", stats: { bannedCards: ["Griselbrand"] } },
  { name: "low ramp", stats: { ramp: 3 } },
  { name: "low land count", stats: { lands: 28 } },
  {
    name: "a well-built deck",
    stats: { ramp: 10, draw: 10, lands: 36, totalCards: 100 },
  },
  {
    name: "a two-card infinite",
    stats: { ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 },
    combos: [
      aTwoCardInfinite("Chatterfang, Squirrel General", "Pitiless Plunderer"),
    ],
  },
  {
    name: "a three-card infinite",
    stats: { ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 },
    combos: [threeCardInfinite],
  },
  {
    name: "a two-card value combo",
    stats: { ramp: 2, draw: 2, avgCmc: 4.5, gameChangersCount: 0 },
    combos: [twoCardValueCombo],
  },
  {
    name: "five fast-win cards",
    deck: { cards: fastWinCards },
    stats: { avgCmc: 2.0, ramp: 12, draw: 12 },
  },
  {
    name: "above a target of 1",
    deck: { targetBracket: 1 },
    stats: { ramp: 15, draw: 15, avgCmc: 1.5, removal: 12, boardWipes: 5 },
  },
  { name: "low card draw", stats: { draw: 2 } },
  { name: "an incomplete deck", stats: { totalCards: 60 } },
  {
    name: "a colour identity violation",
    stats: { colorIdentityViolations: ["Lightning Bolt"] },
  },
  {
    name: "extreme stats",
    stats: { ramp: 20, draw: 20, avgCmc: 1.0, gameChangersCount: 10 },
  },
  {
    name: "a banned companion",
    deck: companionDeck,
    stats: { totalCards: 100 },
  },
  ...floorCases,
  {
    name: "a cEDH-level list",
    stats: { ramp: 25, draw: 20, avgCmc: 1.8, gameChangersCount: 15 },
    combos: [aTwoCardInfinite("Thassa's Oracle", "Demonic Consultation")],
  },
  { name: "an Exhibition shell", stats: EXHIBITION },
  {
    name: "an Exhibition shell with six plain tutors",
    deck: { cards: plainTutors },
    stats: EXHIBITION,
  },
  { name: "a Core shell with six plain tutors", deck: { cards: plainTutors } },
];

function assessed(scoreCase: ScoreCase): BracketAssessment {
  const assessment = explainBracket({
    deck: aDeck({ targetBracket: 2, ...scoreCase.deck }),
    stats: aDeckStats(scoreCase.stats),
    comboData: {
      kind: "found",
      combos: scoreCase.combos ?? [],
      fetchedAt: null,
    },
  });
  if (assessment === null) throw new Error("a Commander deck is assessed");
  return assessment;
}

function checkedCount(
  assessment: BracketAssessment,
  rule: "gameChangers" | "twoCardCombos"
): number {
  const row = assessment.floors.find((floorRow) => floorRow.rule === rule);
  return row?.status === "checked" ? row.count : 0;
}

describe("scoreBracket is the projection of explainBracket on every bracket.test.ts case", () => {
  it.each(BRACKET_TEST_CASES)("$name", (scoreCase) => {
    const score = scoreBracket(
      aDeck({ targetBracket: 2, ...scoreCase.deck }),
      aDeckStats(scoreCase.stats),
      scoreCase.combos
    );
    const assessment = assessed(scoreCase);

    expect(score).toEqual({
      overall: assessment.estimate,
      dimensions: termScores(assessment),
      gameChangers: checkedCount(assessment, "gameChangers"),
      twoCardInfiniteCombos: checkedCount(assessment, "twoCardCombos"),
      warnings: expect.any(Array),
    });
    expect(assessment.heuristicPart.kind).toBe("scored");
    expect(heuristicReading(assessment)).toBe(assessment.estimate);
  });

  it("assesses no deck outside Commander, as scoreBracket scores none", () => {
    const deck = aDeck({ format: "standard" });
    const stats = aDeckStats();

    expect(scoreBracket(deck, stats)).toBeNull();
    expect(
      explainBracket({
        deck,
        stats,
        comboData: { kind: "found", combos: [], fetchedAt: null },
      })
    ).toBeNull();
  });
});

/** The builder's computation: stats from the deck, then the score. */
function builderScore(deck: Deck) {
  return scoreBracket(deck, computeDeckStats(deck));
}

describe("scoreBracket on a list under 60 cards (pinned: the badge shows the heuristic)", () => {
  it("scores an empty Commander deck at Bracket 2 from its heuristic, as it does today", () => {
    expect(builderScore(aDeck())).toEqual({
      overall: 2,
      dimensions: { ramp: 3, draw: 1, removal: 1, winSpeed: 2, avgCmc: 4 },
      gameChangers: 0,
      twoCardInfiniteCombos: 0,
      warnings: [
        "Low ramp count (0) — recommend 8–12",
        "Low card draw (0) — recommend 8–12",
        "Low land count (0) — recommend 33–38",
        "Deck has only 0/100 cards",
      ],
    });
  });

  it("scores a 30-card list at Bracket 3 from its heuristic, as it does today", () => {
    expect(builderScore(aDeck({ cards: aThirtyCardList() }))).toEqual({
      overall: 3,
      dimensions: { ramp: 3, draw: 2, removal: 2, winSpeed: 2, avgCmc: 4 },
      gameChangers: 0,
      twoCardInfiniteCombos: 0,
      warnings: [
        "Low ramp count (5) — recommend 8–12",
        "Low land count (10) — recommend 33–38",
        "Deck has only 30/100 cards",
      ],
    });
  });
});
