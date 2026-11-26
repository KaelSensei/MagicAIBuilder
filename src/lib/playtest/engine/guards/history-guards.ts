/**
 * When undo changes nothing today: no move has been made since the deal.
 *
 * Context: playtest, the engine's guard table; the guards of the transition in `history.ts`,
 * composed with the other concerns' tables by `command-guards.ts`. Undo is the one move besides
 * the bottom choice that a pending mulligan does not stop.
 * Not responsible for: restoring the snapshot (`history.ts`).
 *
 * @module playtest/engine/guards/history-guards
 */

import {
  guard,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/** The guards of `undo`. */
export const HISTORY_GUARDS: PlaytestGuardTable<"undo"> = {
  undo: [
    guard("undo", "nothing-to-undo", (state) => state.history.length === 0),
  ],
};
