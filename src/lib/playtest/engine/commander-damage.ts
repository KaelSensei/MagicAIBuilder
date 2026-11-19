/**
 * The commander-damage tally: the combat damage the player's commanders deal to imagined
 * opponents, recorded by the player's own taps, so a goldfish shows the turn a commander would
 * have killed someone.
 *
 * Context: playtest, the engine. `CommanderDamageTally.tsx` reads `commanderDamageByOpponent` and
 * records a hit through the store's `dispatch`; each hit is one undo step and one log line.
 * Rules (MagicCompRules-20260807.txt): a player dealt 21 or more combat damage by the same
 * commander over the game loses it (CR 903.10a, 104.3j); it is a state-based action
 * (CR 704.6c). Each commander counts on its own, so partners never add up. Brawl does not use
 * the rule (CR 903.12h); the deal decides which formats offer the tally (`deal.ts`).
 * The loss is read from the tally, never stored, as `hasLostOnLife` reads the life total.
 * Not responsible for: opponents' life totals (a non-goal), damage the player takes, or the
 * player's own life (`life.ts`): a hit changes neither the life total nor its history.
 *
 * @module playtest/engine/commander-damage
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type { CommanderDamageTally, PlaytestEngine } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────
/** CR 903.10a: 21 or more combat damage from the same commander loses the game. */
export const COMMANDER_DAMAGE_TO_LOSE = 21;

/**
 * The most imagined opponents the tally offers: a multiplayer Commander table of four, the
 * usual pod. The app stores no pod size, so a smaller table leaves seats unused.
 */
export const MAX_IMAGINED_OPPONENTS = 3;

// ─── Types ────────────────────────────────────────────────────────────────
/** One record of combat damage: `amount` from the commander `commanderId` to seat `opponent`. */
export interface CommanderDamageHit {
  readonly opponent: number;
  readonly commanderId: string;
  readonly amount: number;
}

/** What one commander has dealt to one opponent so far. */
export interface CommanderDamageFromCommander {
  readonly commanderId: string;
  /** The commander's card name, or its id when the card is no longer in any zone. */
  readonly commanderName: string;
  readonly damage: number;
}

/** One imagined opponent's tally: one entry per commander, in the game's commander order. */
export interface OpponentCommanderDamage {
  /** The seat, from 1. */
  readonly opponent: number;
  /** True once one commander alone has dealt 21 or more (CR 903.10a, 704.6c). */
  readonly hasLost: boolean;
  readonly fromCommanders: readonly CommanderDamageFromCommander[];
}

// ─── Policies ─────────────────────────────────────────────────────────────
/**
 * True for an amount the tally accepts: a whole number above zero. Zero records nothing, and
 * damage is never negative (CR 107.1b). Pure; the transition, the guard table and the tally's
 * input share it so they cannot disagree.
 */
export function isCommanderDamageAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

/** True when this game offers a tally at all: a Commander game with a commander. */
export function offersCommanderDamage(
  state: Pick<PlaytestEngine, "commanderDamageOpponents" | "commanderIds">
): boolean {
  return state.commanderDamageOpponents > 0 && state.commanderIds.length > 0;
}

/** True when `opponent` is one of the seats the tally offers in this game. */
export function isTallySeat(
  state: Pick<PlaytestEngine, "commanderDamageOpponents">,
  opponent: number
): boolean {
  return (
    Number.isInteger(opponent) &&
    opponent >= 1 &&
    opponent <= state.commanderDamageOpponents
  );
}

// ─── Reading the tally ────────────────────────────────────────────────────
/**
 * The tally the playtest shows: every seat the game offers, each with one entry per commander,
 * including the commanders that have dealt nothing yet. Empty when the game offers no tally.
 *
 * Pure and derived, so an undo, which restores the previous `commanderDamage`, restores the
 * loss mark with it.
 */
export function commanderDamageByOpponent(
  state: PlaytestEngine
): readonly OpponentCommanderDamage[] {
  if (!offersCommanderDamage(state)) return [];

  return seats(state).map((opponent) => {
    const fromCommanders = state.commanderIds.map((commanderId) => ({
      commanderId,
      commanderName: commanderName(state, commanderId),
      damage: damageDealt(state.commanderDamage, { opponent, commanderId }),
    }));
    return {
      opponent,
      // CR 903.10a: one commander must reach 21 alone; partners are not added up.
      hasLost: fromCommanders.some(
        ({ damage }) => damage >= COMMANDER_DAMAGE_TO_LOSE
      ),
      fromCommanders,
    };
  });
}

// ─── Recording a hit ──────────────────────────────────────────────────────
/**
 * Adds one hit to the tally, as one undo step with one log line. The player's life total and
 * life history do not change.
 *
 * Returns the same state while a bottom choice is pending (CR 103.5), when the game offers no
 * tally (CR 903.12h in Brawl; the constructed formats and Oathbreaker), for a seat the game does
 * not offer, for a card that is not one of the game's commanders, and for an amount that is not
 * a whole number above zero.
 *
 * @param hit - the seat, the commander and the combat damage dealt
 * @param deps - `clock` stamps the undo entry
 */
export function applyCommanderDamage(
  state: PlaytestEngine,
  hit: CommanderDamageHit,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (!canRecord(state, hit)) return state;
  const total = damageDealt(state.commanderDamage, hit) + hit.amount;
  const name = commanderName(state, hit.commanderId);

  return pushHistory(state, deps.clock, {
    patch: {
      commanderDamage: withTotal(state.commanderDamage, { ...hit, total }),
    },
    description: `Opponent ${hit.opponent} took ${hit.amount} combat damage from ${name} (${total} in total)`,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────
/** The checks `applyCommanderDamage` makes, in the order the guard table lists them. */
function canRecord(state: PlaytestEngine, hit: CommanderDamageHit): boolean {
  return (
    !isChoosingBottom(state) &&
    offersCommanderDamage(state) &&
    isTallySeat(state, hit.opponent) &&
    state.commanderIds.includes(hit.commanderId) &&
    isCommanderDamageAmount(hit.amount)
  );
}

/** The seats the tally offers, from 1. */
function seats(state: Pick<PlaytestEngine, "commanderDamageOpponents">) {
  return Array.from(
    { length: state.commanderDamageOpponents },
    (_, index) => index + 1
  );
}

type TallyKey = Pick<CommanderDamageTally, "opponent" | "commanderId">;

const isSameTally = (tally: TallyKey, key: TallyKey): boolean =>
  tally.opponent === key.opponent && tally.commanderId === key.commanderId;

/** The damage one commander has dealt to one seat so far; 0 before its first hit. */
function damageDealt(
  tallies: readonly CommanderDamageTally[],
  key: TallyKey
): number {
  return tallies.find((tally) => isSameTally(tally, key))?.damage ?? 0;
}

/** The tally with one seat and commander set to `total`, added when it had no entry yet. */
function withTotal(
  tallies: readonly CommanderDamageTally[],
  next: TallyKey & { readonly total: number }
): readonly CommanderDamageTally[] {
  const entry: CommanderDamageTally = {
    opponent: next.opponent,
    commanderId: next.commanderId,
    damage: next.total,
  };
  if (!tallies.some((tally) => isSameTally(tally, next))) {
    return [...tallies, entry];
  }
  return tallies.map((tally) => (isSameTally(tally, next) ? entry : tally));
}

/**
 * The commander's card name, wherever the card is now: a commander moves between the command
 * zone, the battlefield and the other zones over a game (CR 903.9).
 */
function commanderName(state: PlaytestEngine, commanderId: string): string {
  const zones = [
    state.commandZone,
    state.battlefield,
    state.graveyard,
    state.exile,
    state.hand,
    state.library,
  ];
  for (const zone of zones) {
    const card = zone.find(({ id }) => id === commanderId);
    if (card) return card.name;
  }
  return commanderId;
}
