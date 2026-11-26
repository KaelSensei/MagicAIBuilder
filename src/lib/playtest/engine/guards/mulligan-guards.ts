/**
 * When a mulligan move changes nothing today: taking a mulligan, and settling its bottom cards.
 *
 * Context: playtest, the engine's guard table; the guards of the transitions in `mulligan.ts`,
 * composed with the other concerns' tables by `command-guards.ts`.
 * Rules: the London mulligan has a limit, and waits for its bottom cards (CR 103.5).
 * Not responsible for: applying the moves (`mulligan.ts`).
 *
 * @module playtest/engine/guards/mulligan-guards
 */

import {
  guard,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";
import { maxMulligans } from "@/lib/playtest/engine/mulligan";

/**
 * The guards of `mulligan` and `bottomCards`. The bottom choice is the move a pending mulligan
 * waits for, so it has no bottom-choice guard of its own.
 */
export const MULLIGAN_GUARDS: PlaytestGuardTable<"mulligan" | "bottomCards"> = {
  mulligan: [
    whileChoosingBottom,
    // CR 103.5: no further mulligan once the opening hand would be zero cards.
    guard(
      "mulligan",
      "mulligan-limit",
      (state) => state.mulliganCount >= maxMulligans(state)
    ),
  ],
  bottomCards: [
    guard(
      "bottomCards",
      "no-bottom-pending",
      (state) => state.cardsToBottom === 0
    ),
    guard(
      "bottomCards",
      "bottom-count-mismatch",
      (state, { cardIds }) => cardIds.length !== state.cardsToBottom
    ),
    guard(
      "bottomCards",
      "bottom-duplicate",
      (_state, { cardIds }) => new Set(cardIds).size !== cardIds.length
    ),
    guard("bottomCards", "bottom-not-in-hand", (state, { cardIds }) => {
      const hand = new Set(state.hand.map((card) => card.id));
      return cardIds.some((id) => !hand.has(id));
    }),
  ],
};
