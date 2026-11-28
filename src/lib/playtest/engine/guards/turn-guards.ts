/**
 * When a turn move changes nothing today: drawing a card, and stepping through the turn.
 *
 * Context: playtest, the engine's guard table; the guards of the transitions in `turn.ts`,
 * composed with the other concerns' tables by `command-guards.ts`.
 * Not responsible for: applying the moves (`turn.ts`).
 *
 * @module playtest/engine/guards/turn-guards
 */

import {
  guard,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/** The guards of `draw`, `nextPhase` and `nextTurn`. */
export const TURN_GUARDS: PlaytestGuardTable<
  "draw" | "nextPhase" | "nextTurn"
> = {
  draw: [
    whileChoosingBottom,
    guard("draw", "library-empty", (state) => state.library.length === 0),
  ],
  nextPhase: [whileChoosingBottom],
  nextTurn: [whileChoosingBottom],
};
