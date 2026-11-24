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
 * An official restriction method version 1 counts on a list but does not let
 * set the estimate: I-77 slice 10 brings mass land denial in through the
 * method-change gate.
 */
export type CountedRestriction = "massLandDenial" | "extraTurns";

/**
 * Finds the lowest official bracket whose rules admit this many cards under
 * one restriction. A bracket that allows extra turns but not their chaining
 * admits them: a list cannot show chaining, a blind spot of the estimate.
 *
 * @param rule - mass land denial or extra turns
 * @param count - the cards of the deck under that restriction, 0 or more
 * @returns the floor that restriction alone sets, never above 4
 */
export function restrictionFloor(
  rule: CountedRestriction,
  count: number
): BracketLevel {
  return (
    BRACKET_LEVELS.find(
      (level) => count === 0 || BRACKET_DEFINITIONS[level][rule] !== "none"
    ) ?? HIGHEST_RULE_SET
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
