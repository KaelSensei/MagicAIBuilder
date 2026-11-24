/**
 * The bracket assessment: the estimated Commander bracket of a deck list and
 * every step that reaches it, as one immutable value.
 *
 * Deck analysis, I-77 slice 1 (`docs/product/specs/i77-a-bracket-estimate-players-can-audit.md`,
 * "Data model / API"). `explainBracket` builds it; `scoreBracket` projects it
 * onto the older `BracketScore`. It holds no visible text: the audit view
 * (slice 2) words every field through next-intl. Not responsible for: the
 * path to a lower bracket (slice 4), the bench (slice 6) or a stored audit
 * (slice 5).
 *
 * @module deck/bracket-assessment
 */
import type {
  BracketLevel,
  BracketRestriction,
} from "@/lib/constants/brackets";

/**
 * The method version of the estimate: its terms, thresholds, classifier rules
 * and floor rules. Any change to them needs a new version (I-77 9.1).
 */
export const BRACKET_METHOD_VERSION = 1;

/**
 * How far a count can be trusted (I-77 3.1):
 * - `exact`: read from a dated official list or printed card data (Game
 *   Changers, card count, average mana value);
 * - `sourced`: taken from a named dataset on a date;
 * - `estimated`: matched by our Oracle-text rules (ramp, draw, removal,
 *   wipes, win conditions, the "infinite" and "two-card" readings, mass
 *   land denial and extra turns).
 */
export type Certainty = "exact" | "sourced" | "estimated";

/** A count and its badge. Every count in an assessment is one (I-77 3.4). */
export interface BadgedCount {
  readonly count: number;
  readonly certainty: Certainty;
}

/**
 * Where the two-card-combo floor read its combos: Commander Spellbook, with
 * the fetch date when the caller knows it and the variant ids found, or
 * nothing when the lookup failed (I-77 4.3).
 */
export type ComboSource =
  | {
      readonly kind: "commanderSpellbook";
      readonly fetchedAt: string | null;
      readonly variantIds: readonly string[];
    }
  | { readonly kind: "unavailable" };

/**
 * One official restriction of the floor block (I-77 2.1).
 *
 * A `checked` row names its count, the cards behind it and the lowest bracket
 * whose rules admit that count; method version 1 lets only the Game Changer
 * and two-card-combo rows set the estimate (mass land denial waits for slice
 * 10). A `notChecked` row says why it is empty: the combo lookup failed.
 * `ruleRef` names the rules version and the restriction it reads.
 */
export type BracketFloorRow =
  | {
      readonly status: "checked";
      readonly rule: BracketRestriction;
      readonly count: number;
      readonly certainty: Certainty;
      readonly cards: readonly string[];
      readonly floor: BracketLevel;
      readonly ruleRef: string;
    }
  | {
      readonly status: "notChecked";
      readonly rule: BracketRestriction;
      readonly reason: "comboDataUnavailable";
      readonly ruleRef: string;
    };

/** The five heuristic terms of method version 1, in display order. */
export const BRACKET_TERM_KEYS = [
  "ramp",
  "draw",
  "removal",
  "winSpeed",
  "avgCmc",
] as const;

/** One heuristic term. Tutors are none: Wizards dropped that restriction on 2025-10-21. */
export type BracketTermKey = (typeof BRACKET_TERM_KEYS)[number];

/**
 * What a term reads. `weightedRemoval` is removal plus 1.5 per board wipe;
 * `winConditions` and `fastWins` count main-deck rows, not copies.
 */
export type TermMeasure =
  | "ramp"
  | "draw"
  | "removal"
  | "boardWipes"
  | "weightedRemoval"
  | "avgCmc"
  | "winConditions"
  | "fastWins";

/** One counted input of a term, with its badge. */
export interface TermInput extends BadgedCount {
  readonly name: TermMeasure;
}

/**
 * The bounds one measure is scored against. Each bound passed moves the
 * score one step: up for `higherIsStronger`, down for `lowerIsStronger`
 * (a lower average mana value reads as a faster deck).
 */
export interface TermThreshold {
  readonly measure: TermMeasure;
  readonly value: number;
  readonly bounds: readonly number[];
  readonly direction: "higherIsStronger" | "lowerIsStronger";
}

/**
 * A card behind a term, and who put it there (I-77 2.5, 3.2): a classifier
 * rule, named by `ruleId`, or the owner, who placed it in a category the
 * rules would not give its text ("placed by you").
 */
export type TermCard =
  | {
      readonly by: "rule";
      readonly cardId: string;
      readonly name: string;
      readonly ruleId: string;
    }
  | { readonly by: "owner"; readonly cardId: string; readonly name: string };

/** One heuristic term: what it read, the bounds, its score 1–4 and its cards. */
export interface BracketTerm {
  readonly key: BracketTermKey;
  readonly inputs: readonly TermInput[];
  readonly thresholds: readonly TermThreshold[];
  readonly score: number;
  readonly cards: readonly TermCard[];
}

/**
 * The heuristic block (I-77 2.2, 2.6). The terms are always computed, but a
 * list under 60 cards (`tooFewCards`) leaves the estimate to the floors.
 * `heuristic` is the unrounded mean of the five term scores.
 */
export interface HeuristicPart {
  readonly kind: "scored" | "tooFewCards";
  readonly deckSize: BadgedCount;
  readonly terms: readonly BracketTerm[];
  readonly heuristic: number;
}

/**
 * What a list cannot show (I-77 4.1): combos Spellbook does not list or that
 * need three or more cards, how early a combo comes up (Bracket 3's turn-6
 * rule), whether extra turns are chained, thematic exceptions a table
 * agrees, the pilot and the pod, and the cEDH intent that sets Bracket 5 apart.
 */
export const BRACKET_BLIND_SPOTS = [
  "combosSpellbookMisses",
  "comboTurn",
  "extraTurnChaining",
  "thematicExceptions",
  "pilotAndPod",
  "cedhIntent",
] as const;

/** One blind spot of the estimate. */
export type BracketBlindSpot = (typeof BRACKET_BLIND_SPOTS)[number];

/**
 * The bracket estimate and how it is reached.
 *
 * `estimate` is the higher of `floor` and the rounded heuristic, capped at 4
 * (I-77 1.3); `decidedBy` names the block that set it (2.3). `complete` is
 * false when a floor this method checks could not be checked (4.3).
 * `unclassified` names the cards no rule placed in a role (4.2).
 */
export interface BracketAssessment {
  readonly methodVersion: typeof BRACKET_METHOD_VERSION;
  readonly rulesVersionId: string;
  readonly comboSource: ComboSource;
  readonly floors: readonly BracketFloorRow[];
  readonly floor: BracketLevel;
  readonly heuristicPart: HeuristicPart;
  readonly estimate: BracketLevel;
  readonly decidedBy: "floor" | "heuristic";
  readonly unclassified: readonly string[];
  readonly blindSpots: readonly BracketBlindSpot[];
  readonly complete: boolean;
}
