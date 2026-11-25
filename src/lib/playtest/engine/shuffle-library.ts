/**
 * Shuffling the library by hand, for a tutor, a fetch land or any effect that ends with
 * "then shuffle".
 *
 * Context: playtest, the engine. The playtest's `S` key sends the `shuffleLibrary` command
 * (`commands.ts`), which lands here. The order comes from the `RandomSource` port, so a seeded
 * game replays it.
 * Rules (MagicCompRules-20260807.txt): to shuffle a library is to randomize it so that no
 * player knows its order (CR 701.24a). An empty library is still shuffled when told to
 * (CR 701.24c, 701.24d), so the move is logged whatever the library holds.
 * Not responsible for: the shuffle algorithm (`shuffle.ts`), the deal and mulligan shuffles
 * (`initial-state.ts`, `mulligan.ts`), or shuffling a found card into the library, which the
 * player does with a move first.
 *
 * @module playtest/engine/shuffle-library
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import { shuffleCards } from "./shuffle";
import type { PlaytestEngine } from "./types";

/**
 * Shuffles the library and nothing else (CR 701.24a), as one undo step with one log line. The
 * hand, the battlefield, the graveyard, exile and the command zone keep their cards and order.
 *
 * Returns the same state while a bottom choice is pending: taking the mulligan is not finished
 * until then (CR 103.5).
 *
 * @param deps - `random` orders the library; `clock` stamps the undo entry
 */
export function applyShuffleLibrary(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;

  return pushHistory(state, deps.clock, {
    patch: { library: shuffleCards(state.library, deps.random) },
    message: { key: "libraryShuffled" },
  });
}
