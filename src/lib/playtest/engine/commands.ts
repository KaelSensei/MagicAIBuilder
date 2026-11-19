/**
 * Every move a player can make in a goldfish game as one value, and the one function that turns
 * it into the next state.
 *
 * Context: playtest, the engine. `PlaytestCommand` names each action with its payload;
 * `reducePlaytest` switches on it, exhaustively, and delegates to the transition in the module
 * that owns the rule (`mulligan.ts`, `turn.ts`, …) without changing it. The store's `dispatch`
 * (`store.ts`) is its production caller; the store's named methods are thin wrappers around it.
 *
 * The ids of the copies and tokens a command creates come from `deps.newId`, and a die roll takes
 * its result from `deps.random`, so a seeded game replays every move and no transition reads the
 * platform.
 *
 * Not responsible for: when a command is a no-op, which the transitions enforce and
 * `command-guards.ts` describes; the lifecycle of a game (deal, stop, reset), which needs the deck
 * and lives in `store.ts` and `deal.ts`.
 *
 * @module playtest/engine/commands
 */

import {
  applyAddActionLogEntry,
  applyEditActionLogEntry,
  applyRecordMana,
  applyRemoveActionLogEntry,
} from "./action-log";
import {
  applyAddCounter,
  applyCreateCardCopy,
  applyCreateToken,
  applyTap,
  applyUntapAll,
} from "./battlefield";
import {
  applyCommanderDamage,
  type CommanderDamageHit,
} from "./commander-damage";
import { applyRollDie } from "./dice";
import { applyUndo } from "./history";
import { applyDamage, applyHeal } from "./life";
import { applyBottomCards, applyMulligan } from "./mulligan";
import { defaultPlaytestCommandDeps, type PlaytestCommandDeps } from "./ports";
import { applyDrawCard, applyNextPhase, applyNextTurn } from "./turn";
import type { CardZone, PlaytestEngine, PlaytestTokenSpec } from "./types";
import { applyMoveToZone } from "./zones";

// ─── Commands ─────────────────────────────────────────────────────────────
/**
 * One move of the player, with what the move needs. The variants mirror the engine's
 * transitions one to one; the ids a move creates are not part of it (see `reducePlaytest`).
 */
export type PlaytestCommand =
  /** Draw the top card of the library outside the draw step (CR 121.1). */
  | { readonly type: "draw" }
  /** Take a London mulligan: a new seven, then a bottom choice (CR 103.5). */
  | { readonly type: "mulligan" }
  /** Settle the pending mulligan: these hand cards go to the bottom, in this order. */
  | { readonly type: "bottomCards"; readonly cardIds: readonly string[] }
  /** Advance one step of the turn; from the last step, start the next turn (CR 500.1). */
  | { readonly type: "nextPhase" }
  /** Start the next turn in its Draw step: untap and draw (CR 502.3, 504.1). */
  | { readonly type: "nextTurn" }
  /** Lose `amount` life for `description`, "damage" when absent (CR 119.3). */
  | {
      readonly type: "damage";
      readonly amount: number;
      readonly description?: string;
    }
  /** Gain `amount` life (CR 119.3). */
  | { readonly type: "heal"; readonly amount: number }
  /**
   * Record `amount` combat damage from one commander to one imagined opponent (CR 903.10a);
   * the player's own life does not change.
   */
  | ({ readonly type: "commanderDamage" } & CommanderDamageHit)
  /** Toggle one permanent between tapped and untapped. */
  | { readonly type: "tap"; readonly cardId: string }
  /** Untap every permanent at once (CR 502.3). */
  | { readonly type: "untapAll" }
  /** Move one card from one zone to another (CR 903.9 for the command zone). */
  | {
      readonly type: "moveToZone";
      readonly cardId: string;
      readonly from: CardZone;
      readonly to: CardZone;
    }
  /** Add `amount` counters to a permanent, or remove them when negative (CR 122.1). */
  | {
      readonly type: "addCounter";
      readonly cardId: string;
      readonly amount: number;
    }
  /** Put a playtest-only copy of a permanent onto the battlefield (CR 707.1). */
  | { readonly type: "createCardCopy"; readonly cardId: string }
  /** Create a token (CR 111.1) or an emblem (CR 114.1) from its spec. */
  | { readonly type: "createToken"; readonly token: PlaytestTokenSpec }
  /** Roll a die with `sides` sides (CR 706.1); the result comes from the random port. */
  | { readonly type: "rollDie"; readonly sides: number }
  /** Add a free-text note to the action log. */
  | { readonly type: "addLogEntry"; readonly description: string }
  /** Log the mana produced, 1 to 100. */
  | { readonly type: "recordMana"; readonly amount: number }
  /** Rewrite the text of one log line. */
  | {
      readonly type: "editLogEntry";
      readonly entryId: number;
      readonly description: string;
    }
  /** Remove one log line. */
  | { readonly type: "removeLogEntry"; readonly entryId: number }
  /** Restore the state before the last move. */
  | { readonly type: "undo" };

/** The name of a command variant. */
export type PlaytestCommandType = PlaytestCommand["type"];

/** The command variant named `T`. */
export type CommandOf<T extends PlaytestCommandType> = Extract<
  PlaytestCommand,
  { readonly type: T }
>;

// ─── Ids ──────────────────────────────────────────────────────────────────
// A session card's id starts with its kind, so a reader of a saved log or a bug report can tell a
// copy or a token from a deck card at a glance; the body comes from `deps.newId`.
const COPY_ID_PREFIX = "playtest-copy-";
const TOKEN_ID_PREFIX = "playtest-token-";

/** The id the reducer gives the next copy; reads one id from the source. */
export const nextCopyId = (deps: PlaytestCommandDeps): string =>
  `${COPY_ID_PREFIX}${deps.newId()}`;

/** The id the reducer gives the next token; reads one id from the source. */
export const nextTokenId = (deps: PlaytestCommandDeps): string =>
  `${TOKEN_ID_PREFIX}${deps.newId()}`;

// ─── Reducer ──────────────────────────────────────────────────────────────
/**
 * Applies one command to the game: the next state, or the same state when the command does not
 * apply today (`PLAYTEST_COMMAND_GUARDS` in `command-guards.ts`).
 *
 * Each variant delegates to its transition with the command's payload. The reducer adds what the
 * transition needs and the command does not carry: the id of a new copy or token
 * (`deps.newId`, prefixed) and the result of a die roll (`deps.random.intBelow(sides) + 1`), read
 * before the transition runs, as the store did before this module. A `sides` the random port
 * rejects (not a positive integer) therefore throws from the port before `applyRollDie` can
 * refuse it, as it did in the store.
 *
 * @param deps - the ports; production reads Web Crypto and the system clock
 */
// eslint-disable-next-line complexity -- one case per command, each a single delegation: the paths are the commands, not logic
export function reducePlaytest(
  state: PlaytestEngine,
  command: PlaytestCommand,
  deps: PlaytestCommandDeps = defaultPlaytestCommandDeps
): PlaytestEngine {
  switch (command.type) {
    case "draw":
      return applyDrawCard(state, deps);
    case "mulligan":
      return applyMulligan(state, deps);
    case "bottomCards":
      return applyBottomCards(state, command.cardIds, deps);
    case "nextPhase":
      return applyNextPhase(state, deps);
    case "nextTurn":
      return applyNextTurn(state, deps);
    case "damage":
      return applyDamage(state, command.amount, command.description, deps);
    case "heal":
      return applyHeal(state, command.amount, deps);
    case "commanderDamage":
      return applyCommanderDamage(state, command, deps);
    case "tap":
      return applyTap(state, command.cardId, deps);
    case "untapAll":
      return applyUntapAll(state, deps);
    case "moveToZone":
      return applyMoveToZone(
        state,
        command.cardId,
        command.from,
        command.to,
        deps
      );
    case "addCounter":
      return applyAddCounter(state, command.cardId, command.amount, deps);
    case "createCardCopy":
      return applyCreateCardCopy(state, command.cardId, nextCopyId(deps), deps);
    case "createToken":
      return applyCreateToken(state, command.token, nextTokenId(deps), deps);
    case "rollDie":
      return applyRollDie(
        state,
        command.sides,
        deps.random.intBelow(command.sides) + 1,
        deps
      );
    case "addLogEntry":
      return applyAddActionLogEntry(state, command.description, deps);
    case "recordMana":
      return applyRecordMana(state, command.amount, deps);
    case "editLogEntry":
      return applyEditActionLogEntry(
        state,
        command.entryId,
        command.description,
        deps
      );
    case "removeLogEntry":
      return applyRemoveActionLogEntry(state, command.entryId, deps);
    case "undo":
      return applyUndo(state);
    default: {
      const exhaustive: never = command;
      return exhaustive;
    }
  }
}
