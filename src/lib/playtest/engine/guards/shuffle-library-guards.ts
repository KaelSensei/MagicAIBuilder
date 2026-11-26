/**
 * When the player's own shuffle changes nothing today: only while a mulligan waits.
 *
 * Context: playtest, the engine's guard table; the guards of the transition in
 * `shuffle-library.ts`, composed with the other concerns' tables by `command-guards.ts`.
 * Rules: an empty library is still shuffled (CR 701.24c, 701.24d).
 * Not responsible for: the shuffle itself (`shuffle-library.ts`).
 *
 * @module playtest/engine/guards/shuffle-library-guards
 */

import {
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/** The guards of `shuffleLibrary`. */
export const SHUFFLE_LIBRARY_GUARDS: PlaytestGuardTable<"shuffleLibrary"> = {
  // CR 701.24c, 701.24d: an empty library is still shuffled, so only the bottom choice blocks.
  shuffleLibrary: [whileChoosingBottom],
};
