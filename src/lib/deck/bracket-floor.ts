// The lowest bracket a deck list can sit in under the official restrictions.
import {
  BRACKET_DEFINITIONS,
  BRACKET_LEVELS,
  type BracketDefinition,
  type BracketLevel,
} from "@/lib/constants/brackets";

/** What a deck list shows against the official restrictions it can be checked for. */
export interface BracketSignals {
  readonly gameChangers: number;
  /** Two-card combos found in the list (Commander Spellbook infinites). */
  readonly twoCardCombos: number;
}

/** Brackets 4 and 5 share one rule set; only the cEDH metagame tells them apart. */
const HIGHEST_RULE_SET: BracketLevel = 4;

function admitsTwoCardCombos(
  definition: BracketDefinition,
  count: number
): boolean {
  // A list cannot show how early a combo comes up, so a bracket that allows
  // combos after a given turn admits it; the warning names the turn.
  return count === 0 || definition.twoCardCombos.kind !== "none";
}

function admits(
  definition: BracketDefinition,
  signals: BracketSignals
): boolean {
  return (
    signals.gameChangers <= definition.maxGameChangers &&
    admitsTwoCardCombos(definition, signals.twoCardCombos)
  );
}

/**
 * Finds the lowest official bracket whose rules admit a deck's Game Changers
 * and two-card combos. Thematic exceptions are not assumed: they are agreed at
 * the table, not read from a list.
 *
 * @param signals - Game Changer and two-card combo counts of the main deck
 * @returns the bracket floor, never above 4
 */
export function minimumBracket(signals: BracketSignals): BracketLevel {
  return (
    BRACKET_LEVELS.find((level) =>
      admits(BRACKET_DEFINITIONS[level], signals)
    ) ?? HIGHEST_RULE_SET
  );
}
