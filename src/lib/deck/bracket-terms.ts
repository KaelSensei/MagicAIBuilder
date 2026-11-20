/**
 * The five heuristic terms of the bracket estimate, method version 1: ramp,
 * draw, removal, win speed and average mana value, each scored 1 to 4 with
 * the inputs, bounds and cards that set its score (I-77 requirement 2.2).
 *
 * The thresholds are the product's own reading, not an official rule: Wizards
 * publishes no ramp or draw counts per bracket. Tutors are not a term: Wizards
 * removed the tutor restriction on 2025-10-21 and lets the Game Changers list
 * catch the efficient ones. Changing a bound or a term needs a new
 * `BRACKET_METHOD_VERSION` (I-77 9.1). Not responsible for the floors
 * (`bracket-floor.ts`) or the mean of the terms (`explain-bracket.ts`).
 *
 * @module deck/bracket-terms
 */
import type { DeckStats } from "./analysis-types";
import type {
  BracketTerm,
  BracketTermKey,
  TermCard,
  TermInput,
  TermMeasure,
  TermThreshold,
} from "./bracket-assessment";
import { compareTermCards, placementOf } from "./bracket-card-placement";
import type { CardCategory, Deck, DeckCard } from "./types";

type Bounds = readonly [number, number, number];

const RAMP_BOUNDS: Bounds = [5, 8, 12];
/** Average mana value read by the ramp term: cheaper spells use ramp better. */
const RAMP_CMC_BOUNDS: Bounds = [2.5, 3, 3.5];
const DRAW_BOUNDS: Bounds = [4, 8, 12];
const REMOVAL_BOUNDS: Bounds = [4, 7, 10];
/** A board wipe weighs one and a half spot removal spells. */
const BOARD_WIPE_WEIGHT = 1.5;
const AVG_CMC_BOUNDS: Bounds = [2, 2.5, 3.2];
/** More fast wins than these read as win speed 3, then 4. */
const FAST_WIN_BOUNDS = [1, 3] as const;
/** More win conditions than this read as win speed 2. */
const WIN_CONDITION_BOUND = 2;
/** At or under this average mana value, win speed gains one step. */
const FAST_CURVE_BOUND = 2.5;

/** The cards a deck's stats count: command zone and main deck (`computeDeckStats`). */
function countedCards(deck: Deck): readonly DeckCard[] {
  return [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...deck.cards.filter((card) => card.zone === "main"),
  ];
}

/**
 * How many bounds a threshold's value passes: a rising value passes each
 * bound it exceeds, a falling one (average mana value) each bound it does not
 * exceed. Each bound passed is one step of the term's score.
 */
function boundsPassed(threshold: TermThreshold): number {
  const { value, bounds, direction } = threshold;
  return bounds.filter((bound) =>
    direction === "higherIsStronger" ? value > bound : value <= bound
  ).length;
}

/** The bounds passed on one measure; none when the term does not read it. */
type BoundsPassedOn = (measure: TermMeasure) => number;

/**
 * Win speed: more fast wins than the higher bound read 4, more than the lower
 * bound read 3, otherwise win conditions above their bound read 2; a fast
 * curve adds one step to the last three readings.
 */
function winSpeedScore(passed: BoundsPassedOn): number {
  const curveStep = passed("avgCmc");
  const fastWinSteps = passed("fastWins");
  if (fastWinSteps >= FAST_WIN_BOUNDS.length) return 4;
  if (fastWinSteps > 0) return Math.min(4, 3 + curveStep);
  return 1 + passed("winConditions") + curveStep;
}

/** How each term turns the bounds its measures pass into a score 1–4. */
const TERM_SCORERS: Readonly<
  Record<BracketTermKey, (passed: BoundsPassedOn) => number>
> = {
  // High ramp with a low curve reads as a faster deck: the mean of the two.
  ramp: (passed) => Math.round((2 + passed("ramp") + passed("avgCmc")) / 2),
  draw: (passed) => 1 + passed("draw"),
  removal: (passed) => 1 + passed("weightedRemoval"),
  winSpeed: winSpeedScore,
  avgCmc: (passed) => 1 + passed("avgCmc"),
};

/**
 * Scores one term 1–4 from its thresholds, the way `scoreBracketTerms` does.
 *
 * Re-running it with one threshold's value changed tells what the term would
 * read at another count (I-77 5.2), so the path to a lower bracket never
 * repeats a bound in its own words.
 *
 * @param key - the term
 * @param thresholds - the term's thresholds, as its `BracketTerm` holds them
 * @returns the term's score, 1 to 4
 */
export function scoreTerm(
  key: BracketTermKey,
  thresholds: readonly TermThreshold[]
): number {
  const passed: BoundsPassedOn = (measure) => {
    const threshold = thresholds.find((entry) => entry.measure === measure);
    return threshold ? boundsPassed(threshold) : 0;
  };
  return TERM_SCORERS[key](passed);
}

function rising(
  measure: TermThreshold["measure"],
  value: number,
  bounds: readonly number[]
): TermThreshold {
  return { measure, value, bounds, direction: "higherIsStronger" };
}

function falling(
  measure: TermThreshold["measure"],
  value: number,
  bounds: readonly number[]
): TermThreshold {
  return { measure, value, bounds, direction: "lowerIsStronger" };
}

function estimated(name: TermInput["name"], count: number): TermInput {
  return { name, count, certainty: "estimated" };
}

/** Average mana value: printed card data, so exact (I-77 3.1). */
function averageManaValue(stats: DeckStats): TermInput {
  return { name: "avgCmc", count: stats.avgCmc, certainty: "exact" };
}

function placedIn(
  cards: readonly DeckCard[],
  categories: readonly CardCategory[]
): TermCard[] {
  return cards
    .filter((card) => categories.includes(card.category))
    .map(placementOf);
}

function sorted(cards: readonly TermCard[]): readonly TermCard[] {
  return cards.toSorted(compareTermCards);
}

function rampTerm(stats: DeckStats, counted: readonly DeckCard[]): BracketTerm {
  const thresholds = [
    rising("ramp", stats.ramp, RAMP_BOUNDS),
    falling("avgCmc", stats.avgCmc, RAMP_CMC_BOUNDS),
  ];
  return {
    key: "ramp",
    inputs: [estimated("ramp", stats.ramp), averageManaValue(stats)],
    thresholds,
    score: scoreTerm("ramp", thresholds),
    cards: sorted(placedIn(counted, ["ramp"])),
  };
}

function drawTerm(stats: DeckStats, counted: readonly DeckCard[]): BracketTerm {
  const thresholds = [rising("draw", stats.draw, DRAW_BOUNDS)];
  return {
    key: "draw",
    inputs: [estimated("draw", stats.draw)],
    thresholds,
    score: scoreTerm("draw", thresholds),
    cards: sorted(placedIn(counted, ["draw"])),
  };
}

function removalTerm(
  stats: DeckStats,
  counted: readonly DeckCard[]
): BracketTerm {
  const weighted = stats.removal + stats.boardWipes * BOARD_WIPE_WEIGHT;
  const thresholds = [rising("weightedRemoval", weighted, REMOVAL_BOUNDS)];
  return {
    key: "removal",
    inputs: [
      estimated("removal", stats.removal),
      estimated("boardWipes", stats.boardWipes),
    ],
    thresholds,
    score: scoreTerm("removal", thresholds),
    cards: sorted(placedIn(counted, ["removal", "boardWipe"])),
  };
}

/**
 * The rule that reads a card as a fast win, or null. A cheap colourless card
 * counts only once the deck holds a win condition.
 */
function fastWinRule(card: DeckCard, hasWinCondition: boolean): string | null {
  const text = card.oracleText.toLowerCase();
  if (text.includes("win the game")) return "winSpeed/winTheGame";
  if (text.includes("storm")) return "winSpeed/storm";
  if (text.includes("infinite")) return "winSpeed/infinite";
  if (card.colorIdentity.length === 0 && card.cmc <= 2 && hasWinCondition) {
    return "winSpeed/cheapColourless";
  }
  return null;
}

function fastWinCards(
  main: readonly DeckCard[],
  hasWinCondition: boolean
): TermCard[] {
  return main.flatMap((card): TermCard[] => {
    const ruleId = fastWinRule(card, hasWinCondition);
    return ruleId === null
      ? []
      : [{ by: "rule", cardId: card.id, name: card.name, ruleId }];
  });
}

/** Win speed reads main-deck rows, not copies, and leaves the command zone out. */
function winSpeedTerm(deck: Deck, stats: DeckStats): BracketTerm {
  const main = deck.cards.filter((card) => card.zone === "main");
  const winConditions = placedIn(main, ["winCondition"]);
  const fastWins = fastWinCards(main, winConditions.length > 0);
  const thresholds = [
    rising("fastWins", fastWins.length, FAST_WIN_BOUNDS),
    rising("winConditions", winConditions.length, [WIN_CONDITION_BOUND]),
    falling("avgCmc", stats.avgCmc, [FAST_CURVE_BOUND]),
  ];
  return {
    key: "winSpeed",
    inputs: [
      estimated("winConditions", winConditions.length),
      estimated("fastWins", fastWins.length),
      averageManaValue(stats),
    ],
    thresholds,
    score: scoreTerm("winSpeed", thresholds),
    cards: sorted([...winConditions, ...fastWins]),
  };
}

/** Average mana value alone: every nonland card weighs in, so it names none. */
function avgCmcTerm(stats: DeckStats): BracketTerm {
  const thresholds = [falling("avgCmc", stats.avgCmc, AVG_CMC_BOUNDS)];
  return {
    key: "avgCmc",
    inputs: [averageManaValue(stats)],
    thresholds,
    score: scoreTerm("avgCmc", thresholds),
    cards: [],
  };
}

/**
 * Scores the five heuristic terms of a deck. Counts come from the deck's
 * stats, as the builder computes them; the cards come from the deck itself.
 *
 * @param deck - a Commander deck
 * @param stats - the stats `computeDeckStats` gives that deck
 * @returns the five terms, in `BRACKET_TERM_KEYS` order
 */
export function scoreBracketTerms(
  deck: Deck,
  stats: DeckStats
): readonly BracketTerm[] {
  const counted = countedCards(deck);
  return [
    rampTerm(stats, counted),
    drawTerm(stats, counted),
    removalTerm(stats, counted),
    winSpeedTerm(deck, stats),
    avgCmcTerm(stats),
  ];
}
