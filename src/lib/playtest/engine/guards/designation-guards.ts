/**
 * When a player designation changes nothing today: player counters, the city's blessing, day and
 * night, the monarch and the initiative, and the Ring.
 *
 * Context: playtest, the engine's guard table; the guards of the transitions in
 * `designations.ts`, composed with the other concerns' tables by `command-guards.ts`.
 * Rules: a player never has fewer than no counters (CR 122.1); the city's blessing is kept for
 * the rest of the game (CR 702.131a); only a change of day or night is a move (CR 731.1a).
 * Not responsible for: applying the moves (`designations.ts`).
 *
 * @module playtest/engine/guards/designation-guards
 */

import {
  hasCitysBlessing,
  isAlreadyDayNight,
  refusesCounterChange,
} from "@/lib/playtest/engine/designations";
import {
  guard,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/**
 * The guards of `playerCounter`, `gainCitysBlessing`, `setDayNight`, `toggleDesignation` and
 * `ringTempts`.
 */
export const DESIGNATION_GUARDS: PlaytestGuardTable<
  | "playerCounter"
  | "gainCitysBlessing"
  | "setDayNight"
  | "toggleDesignation"
  | "ringTempts"
> = {
  playerCounter: [
    whileChoosingBottom,
    // CR 122.1: a counter is a marker, so a player never has fewer than none.
    guard("playerCounter", "bad-counter-change", refusesCounterChange),
  ],
  gainCitysBlessing: [
    whileChoosingBottom,
    // CR 702.131a: the blessing is kept "for the rest of the game"; getting it twice adds nothing.
    guard("gainCitysBlessing", "has-citys-blessing", hasCitysBlessing),
  ],
  setDayNight: [
    whileChoosingBottom,
    // CR 731.1a: only a change of designation is a move; it is already day or night.
    guard("setDayNight", "same-day-night", isAlreadyDayNight),
  ],
  toggleDesignation: [whileChoosingBottom],
  ringTempts: [whileChoosingBottom],
};
