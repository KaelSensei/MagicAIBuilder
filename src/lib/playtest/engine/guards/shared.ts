/**
 * What a command guard is, and the parts every concern's guard table is built from.
 *
 * Context: playtest, the engine's guard table. `command-guards.ts` composes one table per
 * transition module (`guards/<concern>-guards.ts`, #1857); each builds its guards from the
 * `guard` helper, the bottom-choice guard and the state lookups below, and `command-guards.ts`
 * re-exports the two types for its callers.
 * Rules: the London mulligan waits for its bottom cards (CR 103.5).
 * Not responsible for: any one command's guards (the concern modules), applying a command
 * (`commands.ts`).
 *
 * @module playtest/engine/guards/shared
 */

import type {
  CommandOf,
  PlaytestCommand,
  PlaytestCommandType,
} from "@/lib/playtest/engine/commands";
import { isChoosingBottom } from "@/lib/playtest/engine/mulligan";
import type { PlaytestCommandDeps } from "@/lib/playtest/engine/ports";
import type { CardZone, PlaytestEngine } from "@/lib/playtest/engine/types";

// ─── Guards ───────────────────────────────────────────────────────────────
/** Why a command changes nothing today; one name per condition a transition checks. */
export type PlaytestGuardReason =
  | "choosing-bottom"
  | "mulligan-limit"
  | "no-bottom-pending"
  | "bottom-count-mismatch"
  | "bottom-duplicate"
  | "bottom-not-in-hand"
  | "library-empty"
  | "negative-damage"
  | "negative-heal"
  | "no-commander-damage"
  | "unknown-opponent"
  | "bad-commander-damage"
  | "bad-counter-change"
  | "has-citys-blessing"
  | "same-day-night"
  | "not-on-battlefield"
  | "id-taken"
  | "not-a-commander"
  | "same-zone"
  | "not-in-zone"
  | "bad-die"
  | "blank-note"
  | "mana-out-of-range"
  | "unknown-log-entry"
  | "nothing-to-undo";

/** One condition under which a command is a no-op, written as the transition checks it today. */
export interface PlaytestCommandGuard {
  readonly reason: PlaytestGuardReason;
  /**
   * True when the transition would return its state unchanged for this reason. `deps` is read
   * only by the id guards, which ask `newId` for the id the reducer would use.
   */
  readonly blocks: (
    state: PlaytestEngine,
    command: PlaytestCommand,
    deps: PlaytestCommandDeps
  ) => boolean;
}

/**
 * The guards of the commands one concern owns, keyed by command type, each list in the order the
 * transition checks its conditions. The mapped type requires every key of `T` and refuses any
 * other, so a concern table names exactly the commands it declares.
 */
export type PlaytestGuardTable<T extends PlaytestCommandType> = {
  readonly [Type in T]: readonly PlaytestCommandGuard[];
};

function isCommandOf<T extends PlaytestCommandType>(
  command: PlaytestCommand,
  type: T
): command is CommandOf<T> {
  return command.type === type;
}

/** A guard for one command variant, so its check reads the variant's own payload. */
export function guard<T extends PlaytestCommandType>(
  type: T,
  reason: PlaytestGuardReason,
  blocks: (
    state: PlaytestEngine,
    command: CommandOf<T>,
    deps: PlaytestCommandDeps
  ) => boolean
): PlaytestCommandGuard {
  return {
    reason,
    blocks: (state, command, deps) =>
      isCommandOf(command, type) && blocks(state, command, deps),
  };
}

/**
 * Every move but the bottom choice and undo waits while a mulligan waits for its bottom cards:
 * taking the mulligan is not finished until then (CR 103.5).
 */
export const whileChoosingBottom: PlaytestCommandGuard = {
  reason: "choosing-bottom",
  blocks: (state) => isChoosingBottom(state),
};

// ─── State lookups ────────────────────────────────────────────────────────
/** True when a permanent with this id is on the battlefield. */
export const onBattlefield = (state: PlaytestEngine, cardId: string): boolean =>
  state.battlefield.some((card) => card.id === cardId);

/** True when the action log holds a line with this id. */
export const inLog = (state: PlaytestEngine, entryId: number): boolean =>
  state.actionLog.some((entry) => entry.id === entryId);

/** True when a note holds nothing but whitespace. */
export const isBlank = (text: string): boolean => text.trim() === "";

/** The state field that holds each zone's cards; the command zone is the only renamed one. */
const ZONE_FIELD: Readonly<
  Record<
    CardZone,
    "hand" | "library" | "battlefield" | "graveyard" | "exile" | "commandZone"
  >
> = {
  hand: "hand",
  library: "library",
  battlefield: "battlefield",
  graveyard: "graveyard",
  exile: "exile",
  command: "commandZone",
};

/** The cards of one zone, as `applyMoveToZone` looks the moved card up. */
export function zoneCards(
  state: PlaytestEngine,
  zone: CardZone
): readonly { readonly id: string }[] {
  return state[ZONE_FIELD[zone]];
}
