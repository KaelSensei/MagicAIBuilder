/**
 * When a command changes nothing: the conditions each transition checks today, written as data.
 *
 * Context: playtest, the engine. The transitions enforce these conditions and return their state
 * unchanged; this table describes them, in the transition's order, and `commands.test.ts` walks
 * it so the description and the code cannot drift. `playtestCommandBlockReason` is the one walk
 * over the table; a later slice may let the modal disable a button from it. The table also lists
 * the checks the engine does not make today (`PLAYTEST_COMMAND_KNOWN_GAPS`), which a structural
 * change must keep not making until their own fix lands.
 * Collaborators: the table is composed from one table per transition module, in `guards/`
 * (`guards/zone-guards.ts` holds the guards of `zones.ts`, and so on), built from the parts in
 * `guards/shared.ts` (#1857). A new command's guards go in the module of its transition's concern.
 * Rules: each guard cites its Comprehensive Rules number where it is written, in `guards/`.
 * Not responsible for: applying a command (`commands.ts`), any one command's guards (`guards/`).
 *
 * @module playtest/engine/command-guards
 */

import type { PlaytestCommand, PlaytestCommandType } from "./commands";
import { ACTION_LOG_GUARDS } from "./guards/action-log-guards";
import { BATTLEFIELD_GUARDS } from "./guards/battlefield-guards";
import { COMMANDER_DAMAGE_GUARDS } from "./guards/commander-damage-guards";
import { DESIGNATION_GUARDS } from "./guards/designation-guards";
import { DICE_GUARDS } from "./guards/dice-guards";
import { HISTORY_GUARDS } from "./guards/history-guards";
import { LIFE_GUARDS } from "./guards/life-guards";
import { MULLIGAN_GUARDS } from "./guards/mulligan-guards";
import type {
  PlaytestCommandGuard,
  PlaytestGuardReason,
} from "./guards/shared";
import { SHUFFLE_LIBRARY_GUARDS } from "./guards/shuffle-library-guards";
import { TURN_GUARDS } from "./guards/turn-guards";
import { ZONE_GUARDS } from "./guards/zone-guards";
import { defaultPlaytestCommandDeps, type PlaytestCommandDeps } from "./ports";
import type { PlaytestEngine } from "./types";

export type {
  PlaytestCommandGuard,
  PlaytestGuardReason,
} from "./guards/shared";

// ─── The table ────────────────────────────────────────────────────────────
/**
 * When each command is a no-op today, in the order the transition checks the conditions. A list
 * with only the bottom-choice guard means the command otherwise always applies.
 *
 * The `Record` over `PlaytestCommandType` requires every command type, so a command no concern
 * table names does not compile. Each concern table names exactly the commands its type declares
 * (`PlaytestGuardTable`).
 */
export const PLAYTEST_COMMAND_GUARDS: Readonly<
  Record<PlaytestCommandType, readonly PlaytestCommandGuard[]>
> = {
  ...MULLIGAN_GUARDS,
  ...TURN_GUARDS,
  ...SHUFFLE_LIBRARY_GUARDS,
  ...LIFE_GUARDS,
  ...COMMANDER_DAMAGE_GUARDS,
  ...DESIGNATION_GUARDS,
  ...BATTLEFIELD_GUARDS,
  ...ZONE_GUARDS,
  ...DICE_GUARDS,
  ...ACTION_LOG_GUARDS,
  ...HISTORY_GUARDS,
};

/**
 * The first reason, in the transition's order, for which `command` changes nothing today, or null
 * when the reducer would apply it.
 *
 * Reads one id from `deps.newId` for `createCardCopy` and `createToken`, as the reducer would.
 */
export function playtestCommandBlockReason(
  state: PlaytestEngine,
  command: PlaytestCommand,
  deps: PlaytestCommandDeps = defaultPlaytestCommandDeps
): PlaytestGuardReason | null {
  const blocking = PLAYTEST_COMMAND_GUARDS[command.type].find((candidate) =>
    candidate.blocks(state, command, deps)
  );
  return blocking?.reason ?? null;
}

// ─── Known gaps ───────────────────────────────────────────────────────────
/** A check the engine does not make today, kept as is until the fix named in `followUp`. */
export interface PlaytestCommandKnownGap {
  readonly type: PlaytestCommandType;
  readonly behaviour: string;
  readonly followUp: string;
}

/**
 * The checks the engine does not make today, pinned by `commands.test.ts` and
 * `engine.characterization.test.ts`. A structural change keeps them; each has its own fix.
 * Empty today: the last gap, negative damage, became the `negative-damage` guard.
 */
export const PLAYTEST_COMMAND_KNOWN_GAPS: readonly PlaytestCommandKnownGap[] =
  [];
