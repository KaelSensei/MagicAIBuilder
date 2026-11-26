/**
 * When a life move changes nothing today: losing life to damage, and gaining it.
 *
 * Context: playtest, the engine's guard table; the guards of the transitions in `life.ts`,
 * composed with the other concerns' tables by `command-guards.ts`.
 * Rules: damage is never negative (CR 107.1b).
 * Not responsible for: applying the moves (`life.ts`), commander damage
 * (`commander-damage-guards.ts`).
 *
 * @module playtest/engine/guards/life-guards
 */

import {
  guard,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";
import { isNegativeAmount } from "@/lib/playtest/engine/life";

/** The guards of `damage` and `heal`. */
export const LIFE_GUARDS: PlaytestGuardTable<"damage" | "heal"> = {
  damage: [
    whileChoosingBottom,
    // CR 107.1b: no one deals negative damage, so it must not become a life gain.
    guard("damage", "negative-damage", (_state, { amount }) =>
      isNegativeAmount(amount)
    ),
  ],
  heal: [whileChoosingBottom],
};
