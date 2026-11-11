// Bracket scoring engine
import type { Deck, DeckStats, BracketLevel, BracketScore } from "./types";
import type { SpellbookVariant } from "@/lib/combos/spellbook";
import { parseBracketLevel } from "@/lib/constants/brackets";
import { minimumBracket } from "./bracket-floor";
import { getCompanionDeckWarnings } from "./companion";
import { getFormatConfig } from "./formats";
import { sortedUniqueNames } from "./validation";

/**
 * The highest bracket a deck list is scored at. Brackets 4 and 5 share one rule
 * set; only the cEDH metagame separates them, and no list signal shows it.
 */
const ESTIMATE_CEILING = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 1;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Rounds a score to the bracket it reads as, from Bracket 1 to the estimate ceiling. */
function toEstimatedBracket(score: number): BracketLevel {
  return parseBracketLevel(clamp(Math.round(score), 1, ESTIMATE_CEILING)) ?? 1;
}

/** Score 1–4 based on a value and thresholds */
function scoreLinear(
  value: number,
  thresholds: [number, number, number] // bracket 2 threshold, bracket 3 threshold, bracket 4 threshold
): number {
  if (value <= thresholds[0]) return 1;
  if (value <= thresholds[1]) return 2;
  if (value <= thresholds[2]) return 3;
  return 4;
}

function cmcToScore(avgCmc: number): number {
  if (avgCmc <= 2.5) return 4;
  if (avgCmc <= 3) return 3;
  if (avgCmc <= 3.5) return 2;
  return 1;
}

function scoreRamp(rampCount: number, avgCmc: number): number {
  // High ramp + low avg cmc = higher bracket
  const rampScore = scoreLinear(rampCount, [5, 8, 12]);
  return Math.round((rampScore + cmcToScore(avgCmc)) / 2);
}

function scoreDraw(drawCount: number): number {
  return scoreLinear(drawCount, [4, 8, 12]);
}

function scoreRemoval(removalCount: number, boardWipes: number): number {
  const total = removalCount + boardWipes * 1.5;
  return scoreLinear(total, [4, 7, 10]);
}

function scoreWinSpeed(cards: Deck["cards"], avgCmc: number): number {
  const winCons = cards.filter((c) => c.category === "winCondition").length;
  const fastWins = cards.filter((c) => {
    const text = c.oracleText.toLowerCase();
    return (
      text.includes("win the game") ||
      text.includes("storm") ||
      text.includes("infinite") ||
      (c.colorIdentity.length === 0 && c.cmc <= 2 && winCons > 0)
    );
  }).length;

  let speed: number;
  if (fastWins > 3) { speed = 4; }
  else if (fastWins > 1) { speed = 3; }
  else if (winCons > 2) { speed = 2; }
  else { speed = 1; }
  const cmcFactor = avgCmc <= 2.5 ? 1 : 0;
  return Math.min(4, speed + cmcFactor);
}

function scoreCmc(avgCmc: number): number {
  // Lower avg cmc = higher bracket (faster decks)
  if (avgCmc <= 2) return 4;
  if (avgCmc <= 2.5) return 3;
  if (avgCmc <= 3.2) return 2;
  return 1;
}

function countTwoCardInfiniteCombos(combos: SpellbookVariant[]): number {
  return combos.filter((c) => c.isInfinite && c.cards.length === 2).length;
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

/** Score a deck and return its bracket with dimension breakdown */
export function scoreBracket(deck: Deck, stats: DeckStats, combos: SpellbookVariant[] = []): BracketScore | null {
  // Bracket scoring only applies to Commander
  if (!getFormatConfig(deck.format).hasBracketScoring) return null;

  // Only score main-zone cards (sideboard/maybeboard don't affect bracket)
  const mainCards = deck.cards.filter((c) => c.zone === "main");
  // Tutors are not scored: Wizards removed the tutor restriction on 2025-10-21
  // and relies on the Game Changers list to catch the efficient ones.
  const dimensions = {
    ramp: scoreRamp(stats.ramp, stats.avgCmc),
    draw: scoreDraw(stats.draw),
    removal: scoreRemoval(stats.removal, stats.boardWipes),
    winSpeed: scoreWinSpeed(mainCards, stats.avgCmc),
    avgCmc: scoreCmc(stats.avgCmc),
  };

  // The official restrictions set a floor: the lowest bracket whose rules admit
  // the deck's Game Changers and two-card combos.
  const twoCardInfiniteCombos = countTwoCardInfiniteCombos(combos);
  const floor = minimumBracket({
    gameChangers: stats.gameChangersCount,
    twoCardCombos: twoCardInfiniteCombos,
  });

  const warnings = generateWarnings(deck, stats, dimensions, twoCardInfiniteCombos);

  return {
    overall: toEstimatedBracket(
      Math.max(average(Object.values(dimensions)), floor)
    ),
    dimensions,
    gameChangers: stats.gameChangersCount,
    twoCardInfiniteCombos,
    warnings,
  };
}
