/**
 * How the guard table is composed (#1857): each command's guards come from exactly one concern
 * table. The composed table's type already requires every command type; a command named by two
 * concern tables would still compile, and the later spread would silently replace the earlier
 * list. What each guard refuses is pinned in `commands.test.ts`.
 */

import { describe, expect, it } from "vitest";
import { PLAYTEST_COMMAND_GUARDS } from "./command-guards";
import { ACTION_LOG_GUARDS } from "./guards/action-log-guards";
import { BATTLEFIELD_GUARDS } from "./guards/battlefield-guards";
import { COMMANDER_DAMAGE_GUARDS } from "./guards/commander-damage-guards";
import { DESIGNATION_GUARDS } from "./guards/designation-guards";
import { DICE_GUARDS } from "./guards/dice-guards";
import { HISTORY_GUARDS } from "./guards/history-guards";
import { LIFE_GUARDS } from "./guards/life-guards";
import { MULLIGAN_GUARDS } from "./guards/mulligan-guards";
import { SHUFFLE_LIBRARY_GUARDS } from "./guards/shuffle-library-guards";
import { TURN_GUARDS } from "./guards/turn-guards";
import { ZONE_GUARDS } from "./guards/zone-guards";

const CONCERN_TABLES: readonly object[] = [
  ACTION_LOG_GUARDS,
  BATTLEFIELD_GUARDS,
  COMMANDER_DAMAGE_GUARDS,
  DESIGNATION_GUARDS,
  DICE_GUARDS,
  HISTORY_GUARDS,
  LIFE_GUARDS,
  MULLIGAN_GUARDS,
  SHUFFLE_LIBRARY_GUARDS,
  TURN_GUARDS,
  ZONE_GUARDS,
];

describe("the guard table's concern tables", () => {
  it("name each command type exactly once between them", () => {
    const named = CONCERN_TABLES.flatMap((table) => Object.keys(table));
    const commandTypes = Object.keys(PLAYTEST_COMMAND_GUARDS);

    expect(named).toHaveLength(commandTypes.length);
    expect(new Set(named)).toEqual(new Set(commandTypes));
  });
});
