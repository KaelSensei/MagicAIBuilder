/**
 * When a battlefield move changes nothing today: a permanent that is not there, or a new copy or
 * token whose id is already taken.
 *
 * Context: playtest, the engine's guard table; the guards of the transitions in
 * `battlefield.ts`, composed with the other concerns' tables by `command-guards.ts`. The id
 * guards ask `deps.newId` for the id the reducer would give (`nextCopyId`, `nextTokenId` in
 * `commands.ts`).
 * Not responsible for: applying the moves (`battlefield.ts`), moving a card between zones
 * (`zone-guards.ts`).
 *
 * @module playtest/engine/guards/battlefield-guards
 */

import { nextCopyId, nextTokenId } from "@/lib/playtest/engine/commands";
import {
  guard,
  onBattlefield,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/**
 * The guards of `tap`, `untapAll`, `addCounter`, `createCardCopy` and `createToken`. The id
 * guards read one id from `deps.newId`, as the reducer would.
 */
export const BATTLEFIELD_GUARDS: PlaytestGuardTable<
  "tap" | "untapAll" | "addCounter" | "createCardCopy" | "createToken"
> = {
  tap: [
    whileChoosingBottom,
    guard(
      "tap",
      "not-on-battlefield",
      (state, { cardId }) => !onBattlefield(state, cardId)
    ),
  ],
  untapAll: [whileChoosingBottom],
  addCounter: [
    whileChoosingBottom,
    guard(
      "addCounter",
      "not-on-battlefield",
      (state, { cardId }) => !onBattlefield(state, cardId)
    ),
  ],
  createCardCopy: [
    whileChoosingBottom,
    guard("createCardCopy", "id-taken", (state, _command, deps) =>
      onBattlefield(state, nextCopyId(deps))
    ),
    guard(
      "createCardCopy",
      "not-on-battlefield",
      (state, { cardId }) => !onBattlefield(state, cardId)
    ),
  ],
  createToken: [
    whileChoosingBottom,
    guard("createToken", "id-taken", (state, _command, deps) =>
      onBattlefield(state, nextTokenId(deps))
    ),
  ],
};
