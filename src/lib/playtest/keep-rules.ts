/**
 * Opening-hand keep rules for multiplayer Commander.
 *
 * Source: `docs/product/guides/commander-mulligans-curves-and-play-style.md`,
 * section "How picky to be: keep rules by hand". The figures are the guide's
 * Computed margins, produced by the seeded simulator in
 * `scripts/research/commander-opening-hands/` (`margins.mjs`). This module
 * copies the published tables as data; it does not import the simulator.
 * Its advice carries the fields of I-28's `KeepRule` (bracket, stage, lands,
 * cheap ramp, verdict, margin) so the deck check can reuse it.
 *
 * @module playtest/keep-rules
 */

import type { DeckCard } from "@/lib/deck/types";
import type { DeckFormat } from "@/lib/deck/formats";
import { keptOpeningHandSize, type MulliganTally } from "./engine";
import { isOpeningHandLand } from "./opening-hand-evidence";

/** The guide counts ramp as cheap when its mana value is 2 or less. */
const CHEAP_RAMP_MAX_MANA_VALUE = 2;

/** The guide's hand class: lands, and ramp costing 2 or less. */
export interface HandClass {
  readonly lands: number;
  readonly cheapRamp: number;
}

/**
 * Classifies a hand the way the guide's model does.
 *
 * Ramp is read from the deck's own card category (`categorizeCard` tags it
 * when the card is added, and the player can change it), so this module does
 * not guess roles from rules text.
 *
 * @param hand - the cards in hand
 * @returns the number of lands and of cheap ramp pieces
 */
export function classifyHand(hand: readonly DeckCard[]): HandClass {
  let lands = 0;
  let cheapRamp = 0;
  for (const card of hand) {
    if (isOpeningHandLand(card)) lands += 1;
    else if (card.category === "ramp" && card.cmc <= CHEAP_RAMP_MAX_MANA_VALUE)
      cheapRamp += 1;
  }
  return { lands, cheapRamp };
}

/**
 * Whether the guide's keep rules apply to a format. Its model simulates 99
 * cards plus a commander; it has no shells for 60-card formats (Brawl,
 * Oathbreaker or constructed), so they keep the land-balance evidence.
 *
 * @param format - the deck's format
 * @returns true for Commander only
 */
export function hasComputedKeepRules(format: DeckFormat): boolean {
  return format === "commander";
}

/** The guide's brackets: 1 to 4, and 5 for cEDH. */
export type KeepBracket = 1 | 2 | 3 | 4 | 5;

/** A rule the guide states for every shell, whatever the bracket. */
export type EveryShellRuleId =
  | "zeroLands"
  | "oneLandShortOfRamp"
  | "oneLandTwoRamp"
  | "twoLandsNoRamp"
  | "twoLandsOneRamp"
  | "twoLandsOneRampAgainstSix"
  | "twoLandsTwoRamp";

/** Where the player stands in the mulligan sequence (I-28's KeepRule stage). */
export type KeepStage =
  "firstSeven" | "freeSeven" | "six" | "five" | "fourOrFewer";

/** What a seven-card hand is weighed against: a fresh seven, or going to six. */
export type KeepAlternative = "freshSeven" | "six";

/** The advice shown for a hand. */
export type KeepVerdict = "keep" | "mulligan" | "judgment";

/** The two stages the guide publishes keep tables for. */
export type SevenCardStage = "firstSeven" | "freeSeven";

/** Keep advice for a hand, and the rule it comes from. */
export type KeepAdvice =
  | {
      readonly kind: "bracket";
      readonly verdict: KeepVerdict;
      readonly bracket: KeepBracket;
      readonly stage: SevenCardStage;
      readonly against: KeepAlternative;
      /** Value of keeping minus value of mulliganing, in percent of the latter. */
      readonly marginPct: number;
    }
  | {
      readonly kind: "generic";
      readonly verdict: KeepVerdict;
      readonly rule: EveryShellRuleId;
      readonly stage: SevenCardStage;
      readonly against: KeepAlternative;
    }
  | {
      readonly kind: "noRule";
      readonly stage: KeepStage;
      /**
       * `smallerHand`: the guide publishes tables for the first and free seven
       * only. `uncoveredHand`: neither the bracket table nor an every-shell
       * rule covers this hand.
       */
      readonly reason: "smallerHand" | "uncoveredHand";
    };

/** What the advice needs to know about the hand and the mulligans taken. */
export interface KeepQuestion {
  readonly hand: HandClass;
  readonly mulligan: MulliganTally;
  /** The deck's target bracket; null when it has none. */
  readonly bracket: number | null;
}

/** Margins in percent: [first seven, against a fresh seven; free seven, against a six]. */
type MarginPair = readonly [number, number];

/** Cheap ramp as the guide classes it: 0, 1, or 2 standing for "2+". */
type RampClass = 0 | 1 | 2;

/** A bracket cell: the margin pair, or null where the guide shows "—". */
type Cell = MarginPair | null;

/** One row of the guide's "By bracket" table, columns B1 to B5. */
interface BracketRow {
  readonly lands: number;
  readonly ramp: RampClass;
  readonly byBracket: readonly [Cell, Cell, Cell, Cell, Cell];
}

/**
 * The guide's "By bracket" table (Computed, the five bracket shells), copied
 * row by row, columns B1 to B5. Each pair reads first seven / free seven.
 * "—" (a class seen in fewer than 1% of hands) is null.
 */
// prettier-ignore
const BY_BRACKET: readonly BracketRow[] = [
  { lands: 0, ramp: 0, byBracket: [[-55.2, -52.2], [-54.4, -51.1], null,           null,           null] },
  { lands: 0, ramp: 1, byBracket: [[-35.3, -30.9], [-39.0, -34.7], [-43.6, -40.0], [-48.9, -44.9], [-51.2, -46.2]] },
  { lands: 0, ramp: 2, byBracket: [null,           null,           [-29.1, -24.5], [-29.9, -24.5], [-20.7, -12.5]] },
  { lands: 1, ramp: 0, byBracket: [[-27.9, -23.0], [-27.8, -22.7], [-30.4, -25.8], [-35.7, -30.8], [-35.8, -29.2]] },
  { lands: 1, ramp: 1, byBracket: [[-6.0, 0.4],    [-8.6, -2.1],   [-12.2, -6.5],  [-14.9, -8.4],  [-14.3, -5.5]] },
  { lands: 1, ramp: 2, byBracket: [[6.9, 14.2],    [2.2, 9.5],     [2.4, 9.1],     [4.2, 12.2],    [9.3, 20.6]] },
  { lands: 2, ramp: 0, byBracket: [[-7.3, -1.0],   [-8.0, -1.5],   [-11.6, -5.8],  [-15.4, -8.9],  [-20.9, -12.8]] },
  { lands: 2, ramp: 1, byBracket: [[9.4, 16.8],    [7.1, 14.8],    [4.8, 11.7],    [2.0, 9.9],     [-1.4, 8.7]] },
  { lands: 2, ramp: 2, byBracket: [[15.3, 23.2],   [11.5, 19.5],   [12.8, 20.1],   [14.3, 23.1],   [13.2, 24.8]] },
  { lands: 3, ramp: 0, byBracket: [[0.2, 7.0],     [-0.9, 6.1],    [-5.2, 1.0],    [-8.3, -1.2],   [-17.0, -8.5]] },
  { lands: 3, ramp: 1, byBracket: [[10.0, 17.5],   [8.3, 16.0],    [7.2, 14.2],    [5.3, 13.4],    [-1.5, 8.6]] },
  { lands: 3, ramp: 2, byBracket: [[9.9, 17.4],    [8.5, 16.3],    [10.9, 18.2],   [11.7, 20.3],   [6.3, 17.2]] },
  { lands: 4, ramp: 0, byBracket: [[-0.9, 5.8],    [-2.3, 4.7],    [-6.1, 0.0],    [-9.0, -2.0],   [-20.1, -11.9]] },
  { lands: 4, ramp: 1, byBracket: [[4.7, 11.8],    [3.0, 10.4],    [3.5, 10.3],    [1.5, 9.3],     [-8.7, 0.7]] },
  { lands: 4, ramp: 2, byBracket: [null,           null,           [3.3, 10.1],    [3.8, 11.8],    [-6.6, 3.0]] },
  { lands: 5, ramp: 0, byBracket: [[-6.6, -0.2],   [-7.7, -1.1],   [-10.8, -4.9],  [-13.6, -7.0],  null] },
  { lands: 5, ramp: 1, byBracket: [null,           [-5.8, 0.9],    [-6.0, 0.2],    [-7.5, -0.4],   null] },
];

/** A rule the guide states for every shell, for the hand classes it covers. */
interface EveryShellRule {
  readonly id: EveryShellRuleId;
  readonly verdict: KeepVerdict;
  readonly against: KeepAlternative;
  readonly lands: number;
  readonly ramp: readonly RampClass[];
}

/**
 * What the guide states for every shell, used when no bracket rule applies.
 * Against a fresh seven, from "By bracket" ("In plain words, for the first
 * seven… Everywhere.") and Ten findings, #2. Against a six, only the keeps
 * carry over, because "the free seven is always more lenient"; the guide
 * states no every-shell mulligan for it.
 */
// prettier-ignore
const EVERY_SHELL_RULES: readonly EveryShellRule[] = [
  // "Zero lands: mulligan."
  { id: "zeroLands",                 verdict: "mulligan", against: "freshSeven", lands: 0, ramp: [0, 1, 2] },
  // "One land: mulligan unless it comes with two cheap ramp pieces."
  { id: "oneLandShortOfRamp",        verdict: "mulligan", against: "freshSeven", lands: 1, ramp: [0, 1] },
  // "1 land with two cheap ramp pieces is a keep in every shell (+1.5% to +9.3%)"
  { id: "oneLandTwoRamp",            verdict: "keep",     against: "freshSeven", lands: 1, ramp: [2] },
  { id: "oneLandTwoRamp",            verdict: "keep",     against: "six",        lands: 1, ramp: [2] },
  // "a first seven with 2 lands and no cheap ramp is a mulligan in every shell"
  { id: "twoLandsNoRamp",            verdict: "mulligan", against: "freshSeven", lands: 2, ramp: [0] },
  // "2 lands with one cheap ramp piece is a keep everywhere except cEDH"
  { id: "twoLandsOneRamp",           verdict: "keep",     against: "freshSeven", lands: 2, ramp: [1] },
  // B5, free seven: "one cheap ramp piece with 2–3 lands is enough (+8.7%, +8.6%)"
  { id: "twoLandsOneRampAgainstSix", verdict: "keep",     against: "six",        lands: 2, ramp: [1] },
  // "Two lands with cheap ramp: keep (cEDH needs two pieces)."
  { id: "twoLandsTwoRamp",           verdict: "keep",     against: "freshSeven", lands: 2, ramp: [2] },
  { id: "twoLandsTwoRamp",           verdict: "keep",     against: "six",        lands: 2, ramp: [2] },
];

/** Every-shell rules keyed by `lands:ramp:against`. */
const EVERY_SHELL_BY_CLASS = new Map<string, EveryShellRule>(
  EVERY_SHELL_RULES.flatMap((rule) =>
    rule.ramp.map(
      (ramp) => [`${rule.lands}:${ramp}:${rule.against}`, rule] as const
    )
  )
);

/** "Beyond ±2% the decision is clear; within ±2% it is a judgment call." */
const CLEAR_MARGIN_PCT = 2;

/** Rows keyed by `lands:ramp`, built once for constant-time lookup. */
const ROWS_BY_CLASS = new Map<string, BracketRow>(
  BY_BRACKET.map((row) => [`${row.lands}:${row.ramp}`, row])
);

/**
 * Finds where the player stands in the mulligan sequence.
 *
 * @param tally - mulligans taken and whether the first one is free
 * @returns the stage of the hand being judged
 */
export function keepStage(tally: MulliganTally): KeepStage {
  if (tally.mulliganCount === 0) return "firstSeven";
  if (tally.firstMulliganFree && tally.mulliganCount === 1) return "freeSeven";
  const size = keptOpeningHandSize(tally);
  if (size === 6) return "six";
  if (size === 5) return "five";
  return "fourOrFewer";
}

function rampClass(cheapRamp: number): RampClass {
  if (cheapRamp >= 2) return 2;
  return cheapRamp === 1 ? 1 : 0;
}

function isKeepBracket(value: number | null): value is KeepBracket {
  return (
    value === 1 || value === 2 || value === 3 || value === 4 || value === 5
  );
}

/**
 * Reads a margin the way the guide does. Its plain-language summary treats the
 * ±2.0 boundary as clear ("only just a keep (+2.0%)", "leans mulligan (−2.0%)").
 */
function verdictFor(marginPct: number): KeepVerdict {
  if (marginPct >= CLEAR_MARGIN_PCT) return "keep";
  if (marginPct <= -CLEAR_MARGIN_PCT) return "mulligan";
  return "judgment";
}

/**
 * Advises keeping or mulliganing a hand, from the guide's computed tables.
 *
 * @param question - the hand class, the mulligans taken and the deck's bracket
 * @returns the verdict and the rule it comes from
 */
export function adviseKeep(question: KeepQuestion): KeepAdvice {
  const stage = keepStage(question.mulligan);
  if (stage !== "firstSeven" && stage !== "freeSeven") {
    return { kind: "noRule", stage, reason: "smallerHand" };
  }

  // Without the free mulligan the first seven is followed by a six, like a
  // free seven: "the free-seven figure is also the first seven of a
  // one-on-one game".
  const against: KeepAlternative =
    stage === "firstSeven" && question.mulligan.firstMulliganFree
      ? "freshSeven"
      : "six";
  const classKey = `${question.hand.lands}:${rampClass(question.hand.cheapRamp)}`;
  return (
    bracketAdvice(classKey, question.bracket, stage, against) ??
    everyShellAdvice(classKey, stage, against) ?? {
      kind: "noRule",
      stage,
      reason: "uncoveredHand",
    }
  );
}

/**
 * Reads the deck's bracket column of the guide's table.
 *
 * @returns the advice, or null when the bracket is unknown or the cell is "—"
 */
function bracketAdvice(
  classKey: string,
  bracket: number | null,
  stage: SevenCardStage,
  against: KeepAlternative
): KeepAdvice | null {
  if (!isKeepBracket(bracket)) return null;
  const row = ROWS_BY_CLASS.get(classKey);
  const pair = row?.byBracket[bracket - 1] ?? null;
  if (!pair) return null;
  const marginPct = against === "freshSeven" ? pair[0] : pair[1];
  return {
    kind: "bracket",
    verdict: verdictFor(marginPct),
    bracket,
    stage,
    against,
    marginPct,
  };
}

/**
 * Finds what the guide states for every shell about this hand class.
 *
 * @returns the advice, or null when the guide states no every-shell rule
 */
function everyShellAdvice(
  classKey: string,
  stage: SevenCardStage,
  against: KeepAlternative
): KeepAdvice | null {
  const rule = EVERY_SHELL_BY_CLASS.get(`${classKey}:${against}`);
  return rule
    ? { kind: "generic", verdict: rule.verdict, rule: rule.id, stage, against }
    : null;
}
