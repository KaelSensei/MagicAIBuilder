/**
 * When a die roll changes nothing today: a die with fewer than two sides, or sides that are not
 * a whole number.
 *
 * Context: playtest, the engine's guard table; the guards of the transition in `dice.ts`,
 * composed with the other concerns' tables by `command-guards.ts`.
 * Not responsible for: the roll itself (`dice.ts`), the random result (`commands.ts` reads it
 * from the random port).
 *
 * @module playtest/engine/guards/dice-guards
 */

import {
  guard,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/**
 * The guards of `rollDie`.
 *
 * `applyRollDie` also refuses a result outside `[1, sides]`; a lawful random port never produces
 * one, so no guard describes it.
 */
export const DICE_GUARDS: PlaytestGuardTable<"rollDie"> = {
  rollDie: [
    whileChoosingBottom,
    guard(
      "rollDie",
      "bad-die",
      (_state, { sides }) => !Number.isInteger(sides) || sides < 2
    ),
  ],
};
