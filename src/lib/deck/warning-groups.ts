export interface DeckWarningGroups {
  readonly legality: readonly string[];
  readonly strategy: readonly string[];
  readonly advice: readonly string[];
}

const LEGALITY_MARKERS = [
  "banned",
  "color identity",
  "deck has only",
  "not legal",
  "cannot be",
  "companion requirement",
];

const STRATEGY_MARKERS = [
  "low ramp",
  "low card draw",
  "low land",
  "combo",
  "target is bracket",
  "bracket mismatch",
];

/**
 * Group deterministic deck warnings by the action they require.
 *
 * @param warnings - warning messages produced by deck analysis
 * @returns warnings partitioned without dropping unknown messages
 */
export function groupDeckWarnings(
  warnings: readonly string[]
): DeckWarningGroups {
  const legality: string[] = [];
  const strategy: string[] = [];
  const advice: string[] = [];

  for (const warning of warnings) {
    const normalized = warning.toLowerCase();
    if (LEGALITY_MARKERS.some((marker) => normalized.includes(marker))) {
      legality.push(warning);
    } else if (STRATEGY_MARKERS.some((marker) => normalized.includes(marker))) {
      strategy.push(warning);
    } else {
      advice.push(warning);
    }
  }

  return { legality, strategy, advice };
}
