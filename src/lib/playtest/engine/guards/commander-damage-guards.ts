/**
 * When a commander-damage tally changes nothing today: no tally at this table, an unknown
 * opponent, a creature that is not a commander, or an amount the tally refuses.
 *
 * Context: playtest, the engine's guard table; the guards of the transition in
 * `commander-damage.ts`, composed with the other concerns' tables by `command-guards.ts`.
 * Rules: only Commander tallies commander damage (CR 903.10a, 903.12h).
 * Not responsible for: the tally itself (`commander-damage.ts`), the player's own life
 * (`life-guards.ts`).
 *
 * @module playtest/engine/guards/commander-damage-guards
 */

import {
  isCommanderDamageAmount,
  isTallySeat,
  offersCommanderDamage,
} from "@/lib/playtest/engine/commander-damage";
import {
  guard,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/** The guards of `commanderDamage`. */
export const COMMANDER_DAMAGE_GUARDS: PlaytestGuardTable<"commanderDamage"> = {
  commanderDamage: [
    whileChoosingBottom,
    // CR 903.12h: Brawl does not use commander damage; only Commander offers the tally.
    guard(
      "commanderDamage",
      "no-commander-damage",
      (state) => !offersCommanderDamage(state)
    ),
    guard(
      "commanderDamage",
      "unknown-opponent",
      (state, { opponent }) => !isTallySeat(state, opponent)
    ),
    // CR 903.10a counts combat damage dealt by a commander, so only a commander's is tallied.
    guard(
      "commanderDamage",
      "not-a-commander",
      (state, { commanderId }) => !state.commanderIds.includes(commanderId)
    ),
    guard(
      "commanderDamage",
      "bad-commander-damage",
      (_state, { amount }) => !isCommanderDamageAmount(amount)
    ),
  ],
};
