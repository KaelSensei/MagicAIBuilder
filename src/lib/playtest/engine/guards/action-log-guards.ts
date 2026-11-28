/**
 * When an action-log move changes nothing today: a blank note, mana outside 1 to 100, or a log
 * line that does not exist.
 *
 * Context: playtest, the engine's guard table; the guards of the transitions in
 * `action-log.ts`, composed with the other concerns' tables by `command-guards.ts`.
 * Not responsible for: applying the moves (`action-log.ts`).
 *
 * @module playtest/engine/guards/action-log-guards
 */

import {
  guard,
  inLog,
  isBlank,
  whileChoosingBottom,
  type PlaytestGuardTable,
} from "@/lib/playtest/engine/guards/shared";

/** The guards of `addLogEntry`, `recordMana`, `editLogEntry` and `removeLogEntry`. */
export const ACTION_LOG_GUARDS: PlaytestGuardTable<
  "addLogEntry" | "recordMana" | "editLogEntry" | "removeLogEntry"
> = {
  addLogEntry: [
    whileChoosingBottom,
    guard("addLogEntry", "blank-note", (_state, { description }) =>
      isBlank(description)
    ),
  ],
  recordMana: [
    whileChoosingBottom,
    guard(
      "recordMana",
      "mana-out-of-range",
      (_state, { amount }) =>
        !Number.isInteger(amount) || amount < 1 || amount > 100
    ),
  ],
  editLogEntry: [
    whileChoosingBottom,
    guard(
      "editLogEntry",
      "unknown-log-entry",
      (state, { entryId }) => !inLog(state, entryId)
    ),
    guard("editLogEntry", "blank-note", (_state, { description }) =>
      isBlank(description)
    ),
  ],
  removeLogEntry: [
    whileChoosingBottom,
    guard(
      "removeLogEntry",
      "unknown-log-entry",
      (state, { entryId }) => !inLog(state, entryId)
    ),
  ],
};
