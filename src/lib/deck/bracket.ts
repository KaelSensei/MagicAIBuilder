// Bracket scoring engine
import type { Deck, DeckStats, BracketScore } from "./types";
import type { SpellbookVariant } from "@/lib/combos/spellbook";
import { getCompanionDeckWarnings } from "./companion";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 1;
  return values.reduce((a, b) => a + b, 0) / values.length;
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

function scoreTutors(cards: Deck["cards"]): number {
  const tutors = cards.filter((c) => {
    const text = c.oracleText.toLowerCase();
    return (
      text.includes("search your library") &&
      !text.includes("basic land") &&
      !text.includes("land card")
    );
  }).length;
  return scoreLinear(tutors, [0, 2, 5]);
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

function generateWarnings(
  deck: Deck,
  stats: DeckStats,
  dimensions: BracketScore["dimensions"],
  twoCardInfiniteCombos: number
): string[] {
  const warnings: string[] = [];

  if (stats.bannedCards.length > 0) {
    warnings.push(
      `Banned cards in deck: ${stats.bannedCards.join(", ")}`
    );
  }

  if (stats.colorIdentityViolations.length > 0) {
    warnings.push(
      `Color identity violations: ${stats.colorIdentityViolations.join(", ")}`
    );
  }

  if (twoCardInfiniteCombos > 0) {
    warnings.push(
      `${twoCardInfiniteCombos} infinite 2-card combo${twoCardInfiniteCombos > 1 ? "s" : ""} detected — deck is Bracket 4 (RC rule)`
    );
  }

  if (stats.gameChangersCount > 3) {
    warnings.push(
      `${stats.gameChangersCount} Game Changers detected — deck is Bracket 4 minimum`
    );
  } else if (stats.gameChangersCount > 0) {
    warnings.push(
      `${stats.gameChangersCount} Game Changer(s): ${stats.gameChangersList.join(", ")}`
    );
  }

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
    warnings.push(
      `Deck has only ${stats.totalCards}/100 cards`
    );
  }

  if (deck.targetBracket && dimensions) {
    const overall = Math.round(average(Object.values(dimensions)));
    if (overall > deck.targetBracket) {
      warnings.push(
        `Deck scores Bracket ${overall} but target is Bracket ${deck.targetBracket}`
      );
    }
  }

  for (const line of getCompanionDeckWarnings(deck)) {
    warnings.push(line);
  }

  return warnings;
}

/** Score a deck and return its bracket with dimension breakdown */
export function scoreBracket(deck: Deck, stats: DeckStats, combos: SpellbookVariant[] = []): BracketScore {
  // Only score main-zone cards (sideboard/maybeboard don't affect bracket)
  const mainCards = deck.cards.filter((c) => c.zone === "main");
  const dimensions = {
    ramp: scoreRamp(stats.ramp, stats.avgCmc),
    draw: scoreDraw(stats.draw),
    removal: scoreRemoval(stats.removal, stats.boardWipes),
    tutors: scoreTutors(mainCards),
    winSpeed: scoreWinSpeed(mainCards, stats.avgCmc),
    avgCmc: scoreCmc(stats.avgCmc),
  };

  let overall = Math.round(average(Object.values(dimensions)));

  // 2-card infinite combos → Bracket 4 (RC rule)
  const twoCardInfiniteCombos = countTwoCardInfiniteCombos(combos);
  if (twoCardInfiniteCombos > 0) {
    overall = 4;
  }

  // Game Changers force minimum bracket
  // Bracket 1 & 2: 0 allowed → any GC forces bracket 3
  // Bracket 3: max 3 → more than 3 forces bracket 4
  if (stats.gameChangersCount > 3) {
    overall = Math.max(overall, 4);
  } else if (stats.gameChangersCount > 0) {
    overall = Math.max(overall, 3);
  }

  const warnings = generateWarnings(deck, stats, dimensions, twoCardInfiniteCombos);

  return {
    overall: clamp(overall, 1, 4) as 1 | 2 | 3 | 4,
    dimensions,
    gameChangers: stats.gameChangersCount,
    twoCardInfiniteCombos,
    warnings,
  };
}
