/**
 * The bracket score the builder shows (`useBracketScore`, `BracketIndicator`)
 * and the warnings beside it: a projection of `explainBracket`, which owns the
 * floors, the terms and the estimate (I-77 slice 1). This module adds only the
 * English warnings, unchanged.
 *
 * @module deck/bracket
 */
import type { Deck } from "./types";
import type { DeckStats, BracketScore } from "./analysis-types";
import type { Combo } from "@/modules/combos";
import type { BracketAssessment } from "./bracket-assessment";
import { minimumBracket } from "./bracket-floor";
import { getCompanionDeckWarnings } from "./companion";
import {
  explainBracket,
  heuristicReading,
  termScores,
} from "./explain-bracket";
import { sortedUniqueNames } from "./sorted-unique-names";

function average(values: number[]): number {
  if (values.length === 0) return 1;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** The count of a checked floor row, 0 when the row was not checked. */
function floorCount(
  assessment: BracketAssessment,
  rule: "gameChangers" | "twoCardCombos"
): number {
  const row = assessment.floors.find((floorRow) => floorRow.rule === rule);
  return row?.status === "checked" ? row.count : 0;
}

function warningCardNames(names: readonly string[]): string {
  return sortedUniqueNames(names).join(", ");
}

/** Helper: generate ban/legality warnings */
function getBanWarnings(stats: DeckStats): string[] {
  const warnings: string[] = [];
  if (stats.bannedCards.length > 0) {
    warnings.push(`Banned cards in deck: ${warningCardNames(stats.bannedCards)}`);
  }
  if (stats.colorIdentityViolations.length > 0) {
    warnings.push(`Color identity violations: ${warningCardNames(stats.colorIdentityViolations)}`);
  }
  return warnings;
}

/**
 * Helper: generate combo-related warnings. A list cannot show how early a
 * combo comes up, so the warning states the official turn rule.
 */
function getComboWarnings(twoCardInfiniteCombos: number): string[] {
  if (twoCardInfiniteCombos === 0) return [];
  const floor = minimumBracket({
    gameChangers: 0,
    twoCardCombos: twoCardInfiniteCombos,
  });
  const plural = twoCardInfiniteCombos > 1 ? "s" : "";
  return [
    `${twoCardInfiniteCombos} infinite 2-card combo${plural} detected — Bracket ${floor} minimum: Brackets 1–2 allow none, Bracket 3 none before turn 6`,
  ];
}

/** Helper: generate Game Changers warnings */
function getGameChangersWarnings(gameChangersCount: number, gameChangersList: readonly string[]): string[] {
  if (gameChangersCount === 0) return [];
  const floor = minimumBracket({
    gameChangers: gameChangersCount,
    twoCardCombos: 0,
  });
  // Name the floor once the count passes the first bracket that admits Game Changers.
  if (floor > minimumBracket({ gameChangers: 1, twoCardCombos: 0 })) {
    return [
      `${gameChangersCount} Game Changers detected — deck is Bracket ${floor} minimum`,
    ];
  }
  return [
    `${gameChangersCount} Game Changer(s): ${warningCardNames(gameChangersList)}`,
  ];
}

/** Helper: generate deck composition warnings */
function getCompositionWarnings(stats: DeckStats): string[] {
  const warnings: string[] = [];
  if (stats.ramp < 6) {
    warnings.push(`Low ramp count (${stats.ramp}) — recommend 8–12`);
  }
  if (stats.draw < 5) {
    warnings.push(`Low card draw (${stats.draw}) — recommend 8–12`);
  }
  if (stats.lands < 33) {
    warnings.push(`Low land count (${stats.lands}) — recommend 33–38`);
  }
  if (stats.totalCards < 100) {
    warnings.push(`Deck has only ${stats.totalCards}/100 cards`);
  }
  return warnings;
}

/** Helper: generate bracket mismatch warning */
function getBracketMismatchWarning(
  deck: Deck,
  dimensions: BracketScore["dimensions"]
): string | null {
  if (!deck.targetBracket || !dimensions) return null;
  const overall = Math.round(average(Object.values(dimensions)));
  if (overall > deck.targetBracket) {
    return `Deck scores Bracket ${overall} but target is Bracket ${deck.targetBracket}`;
  }
  return null;
}

function generateWarnings(
  deck: Deck,
  stats: DeckStats,
  dimensions: BracketScore["dimensions"],
  twoCardInfiniteCombos: number
): string[] {
  const bracketWarning = getBracketMismatchWarning(deck, dimensions);
  return [
    ...getBanWarnings(stats),
    ...getComboWarnings(twoCardInfiniteCombos),
    ...getGameChangersWarnings(stats.gameChangersCount, stats.gameChangersList),
    ...getCompositionWarnings(stats),
    ...(bracketWarning ? [bracketWarning] : []),
    ...getCompanionDeckWarnings(deck),
  ];
}

/**
 * Scores a deck: its bracket with the five term scores and the warnings.
 *
 * The projection of `explainBracket` with the combos Spellbook found, so the
 * builder and the audit read one computation. `overall` is the heuristic
 * reading at every deck size: on a list under 60 cards the audit's estimate
 * is the floor alone, a gap slice 2 closes by showing the estimate.
 *
 * @param deck - the deck; only Commander formats are scored
 * @param stats - the stats `computeDeckStats` gives that deck
 * @param combos - the combos Spellbook found; none when the lookup failed
 * @returns the score, or null for a format without bracket scoring
 */
export function scoreBracket(
  deck: Deck,
  stats: DeckStats,
  combos: readonly Combo[] = []
): BracketScore | null {
  const assessment = explainBracket({
    deck,
    stats,
    comboData: { kind: "found", combos, fetchedAt: null },
  });
  if (assessment === null) return null;

  const dimensions = termScores(assessment);
  const twoCardInfiniteCombos = floorCount(assessment, "twoCardCombos");
  return {
    overall: heuristicReading(assessment),
    dimensions,
    gameChangers: floorCount(assessment, "gameChangers"),
    twoCardInfiniteCombos,
    warnings: generateWarnings(deck, stats, dimensions, twoCardInfiniteCombos),
  };
}
