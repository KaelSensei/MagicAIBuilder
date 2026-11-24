/**
 * The bracket estimate of a Commander deck list, with every step that
 * reaches it: the official floors, the heuristic terms, the cards behind each
 * count and who placed them, the badge on each count, and what a list cannot
 * show (I-77 slice 1, `docs/product/specs/i77-a-bracket-estimate-players-can-audit.md`).
 *
 * The estimate is the higher of two readings, capped at Bracket 4:
 * - the floor: the lowest official bracket whose rules admit the deck's Game
 *   Changers and two-card combos (Wizards' bracket text of 2025-10-21,
 *   https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025,
 *   encoded in `BRACKET_DEFINITIONS` and read by `minimumBracket`);
 * - the heuristic: the mean of five product terms (`bracket-terms.ts`).
 *
 * Mass land denial and extra turns get their own floor rows (slice 3), read
 * from Oracle text, but method version 1 leaves them out of the estimate.
 *
 * Brackets are Wizards' format guideline, not Comprehensive Rules. Pure: no
 * clock, no network, no store. Not responsible for wording the audit (slice
 * 2) or the path to a lower bracket (slice 4).
 *
 * @module deck/explain-bracket
 */
import {
  BRACKET_RULES_VERSION,
  parseBracketLevel,
  type BracketLevel,
  type BracketRestriction,
} from "@/lib/constants/brackets";
import { isTwoCardInfiniteCombo, type Combo } from "@/modules/combos";
import type { DeckStats } from "./analysis-types";
import {
  BRACKET_BLIND_SPOTS,
  BRACKET_METHOD_VERSION,
  type BracketAssessment,
  type BracketFloorRow,
  type BracketTermKey,
  type ComboSource,
  type HeuristicPart,
} from "./bracket-assessment";
import {
  minimumBracket,
  restrictionFloor,
  type CountedRestriction,
} from "./bracket-floor";
import {
  extraTurnCards,
  massLandDenialCards,
} from "./bracket-restriction-cards";
import { scoreBracketTerms } from "./bracket-terms";
import { getFormatConfig } from "./formats";
import { playedDeckCards } from "./played-deck-cards";
import { sortedUniqueNames } from "./sorted-unique-names";
import type { Deck } from "./types";

/**
 * The highest bracket a list is estimated at (I-77 1.3). Brackets 4 and 5
 * share one rule set; only the cEDH metagame separates them, and no list
 * signal shows it.
 */
const ESTIMATE_CEILING = 4;

/**
 * Below this many cards the heuristic reads noise, so only the floors set the
 * estimate (I-77 2.6, the cut Nerd Leagues uses).
 */
const HEURISTIC_MINIMUM_CARDS = 60;

/**
 * The combos a deck holds as Commander Spellbook found them, with the fetch
 * date when the caller knows it, or `unavailable` when the lookup failed.
 */
export type ComboData =
  | {
      readonly kind: "found";
      readonly combos: readonly Combo[];
      readonly fetchedAt: string | null;
    }
  | { readonly kind: "unavailable" };

/** What `explainBracket` reads: the deck, its stats and its combo data. */
export interface BracketAssessmentInput {
  readonly deck: Deck;
  /** The stats `computeDeckStats` gives `deck`; every term count comes from them. */
  readonly stats: DeckStats;
  readonly comboData: ComboData;
}

function ruleRef(rule: BracketRestriction): string {
  return `${BRACKET_RULES_VERSION}#${rule}`;
}

/** Game Changers come from Wizards' dated list, through Scryfall: exact (I-77 3.1). */
function gameChangerRow(stats: DeckStats): BracketFloorRow {
  const count = stats.gameChangersCount;
  return {
    status: "checked",
    rule: "gameChangers",
    count,
    certainty: "exact",
    cards: sortedUniqueNames(stats.gameChangersList),
    floor: minimumBracket({ gameChangers: count, twoCardCombos: 0 }),
    ruleRef: ruleRef("gameChangers"),
  };
}

/**
 * The combos come from Spellbook, but which of them are "infinite" and
 * "two-card" is our reading of them, so the count is estimated (I-77 3.1).
 */
function twoCardComboRow(twoCardCombos: readonly Combo[]): BracketFloorRow {
  return {
    status: "checked",
    rule: "twoCardCombos",
    count: twoCardCombos.length,
    certainty: "estimated",
    cards: sortedUniqueNames(twoCardCombos.flatMap((combo) => combo.cards)),
    floor: minimumBracket({
      gameChangers: 0,
      twoCardCombos: twoCardCombos.length,
    }),
    ruleRef: ruleRef("twoCardCombos"),
  };
}

/**
 * Mass land denial and extra turns are read by our Oracle-text rules, so the
 * count is estimated (I-77 3.1). Method version 1 shows the floor the row
 * sets but leaves it out of the estimate (slice 3, "number unchanged").
 */
function countedRestrictionRow(
  rule: CountedRestriction,
  restrictionCards: readonly string[]
): BracketFloorRow {
  return {
    status: "checked",
    rule,
    count: restrictionCards.length,
    certainty: "estimated",
    cards: restrictionCards,
    floor: restrictionFloor(rule, restrictionCards.length),
    ruleRef: ruleRef(rule),
  };
}

function comboDataUnavailableRow(): BracketFloorRow {
  return {
    status: "notChecked",
    rule: "twoCardCombos",
    reason: "comboDataUnavailable",
    ruleRef: ruleRef("twoCardCombos"),
  };
}

function twoCardCombosIn(comboData: ComboData): readonly Combo[] {
  return comboData.kind === "found"
    ? comboData.combos.filter(isTwoCardInfiniteCombo)
    : [];
}

function floorRows(
  deck: Deck,
  stats: DeckStats,
  comboData: ComboData
): readonly BracketFloorRow[] {
  const played = playedDeckCards(deck);
  return [
    gameChangerRow(stats),
    comboData.kind === "found"
      ? twoCardComboRow(twoCardCombosIn(comboData))
      : comboDataUnavailableRow(),
    countedRestrictionRow("massLandDenial", massLandDenialCards(played)),
    countedRestrictionRow("extraTurns", extraTurnCards(played)),
  ];
}

function comboSourceOf(comboData: ComboData): ComboSource {
  if (comboData.kind === "unavailable") return { kind: "unavailable" };
  return {
    kind: "commanderSpellbook",
    fetchedAt: comboData.fetchedAt,
    variantIds: sortedUniqueNames(comboData.combos.map((combo) => combo.id)),
  };
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function heuristicPartOf(deck: Deck, stats: DeckStats): HeuristicPart {
  const terms = scoreBracketTerms(deck, stats);
  return {
    kind: stats.totalCards < HEURISTIC_MINIMUM_CARDS ? "tooFewCards" : "scored",
    // The card count is printed data: exact (I-77 3.1).
    deckSize: { count: stats.totalCards, certainty: "exact" },
    terms,
    heuristic: mean(terms.map((term) => term.score)),
  };
}

/** Rounds a reading to the bracket it stands for, from 1 to the estimate ceiling. */
function toEstimatedBracket(reading: number): BracketLevel {
  const rounded = Math.min(ESTIMATE_CEILING, Math.max(1, Math.round(reading)));
  return parseBracketLevel(rounded) ?? 1;
}

/** Cards no classifier rule gives a role, named so none is dropped (I-77 4.2). */
function unclassifiedCards(deck: Deck): readonly string[] {
  return sortedUniqueNames(
    deck.cards
      .filter((card) => card.zone === "main" && card.category === "other")
      .map((card) => card.name)
  );
}

/**
 * The bracket the floor and the heuristic read together, whatever the deck's
 * size: the higher of the two, rounded and capped at 4. It is the estimate of
 * a list of 60 cards or more; the builder's badge shows it for every list
 * until the audit view (slice 2) switches it to `estimate`.
 *
 * @param assessment - an assessment from `explainBracket`
 * @returns a bracket from 1 to 4
 */
export function heuristicReading(assessment: BracketAssessment): BracketLevel {
  return toEstimatedBracket(
    Math.max(assessment.heuristicPart.heuristic, assessment.floor)
  );
}

/**
 * Each term's score by key, as `BracketScore.dimensions` holds them.
 *
 * @param assessment - an assessment from `explainBracket`
 * @returns the five term scores, 1 to 4
 */
export function termScores(
  assessment: BracketAssessment
): Record<BracketTermKey, number> {
  const scores = { ramp: 1, draw: 1, removal: 1, winSpeed: 1, avgCmc: 1 };
  for (const term of assessment.heuristicPart.terms) {
    scores[term.key] = term.score;
  }
  return scores;
}

/**
 * Explains the bracket estimate of a Commander deck list.
 *
 * The same list, rules version, method version and combo data give the same
 * assessment whatever the card order (I-77 1.5). Combo data that is
 * unavailable leaves the two-card-combo floor unchecked and the assessment
 * incomplete (4.3). A list under 60 cards keeps its terms for the record,
 * but only its floors set the estimate (2.6).
 *
 * @param input - the deck, its stats and the combos Spellbook found for it
 * @returns the assessment, or null for a format without bracket scoring
 */
export function explainBracket(
  input: BracketAssessmentInput
): BracketAssessment | null {
  const { deck, stats, comboData } = input;
  if (!getFormatConfig(deck.format).hasBracketScoring) return null;

  const floor = minimumBracket({
    gameChangers: stats.gameChangersCount,
    twoCardCombos: twoCardCombosIn(comboData).length,
  });
  const heuristicPart = heuristicPartOf(deck, stats);
  const scored = heuristicPart.kind === "scored";
  const decidedByHeuristic = scored && heuristicPart.heuristic > floor;

  return {
    methodVersion: BRACKET_METHOD_VERSION,
    rulesVersionId: BRACKET_RULES_VERSION,
    comboSource: comboSourceOf(comboData),
    floors: floorRows(deck, stats, comboData),
    floor,
    heuristicPart,
    estimate: scored
      ? toEstimatedBracket(Math.max(heuristicPart.heuristic, floor))
      : floor,
    decidedBy: decidedByHeuristic ? "heuristic" : "floor",
    unclassified: unclassifiedCards(deck),
    blindSpots: BRACKET_BLIND_SPOTS,
    complete: comboData.kind === "found",
  };
}
