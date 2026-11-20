/**
 * The designations and player counters the player sets by hand while goldfishing: poison, energy
 * and experience counters, the monarch, the initiative, the Ring's temptations, day and night,
 * and the city's blessing.
 *
 * Context: playtest, the engine. `DesignationsPanel.tsx` reads `designations` and sends one
 * command per tap through the store's `dispatch`; each change is one undo step and one log line.
 * The player sets every value; the engine never infers one from Oracle text.
 * Rules (MagicCompRules-20260807.txt): a counter is a marker placed on a player (CR 122.1); ten
 * or more poison counters lose the game (CR 104.3d, 122.1f), a state-based action (CR 704.5c);
 * one energy counter is the {E} symbol (CR 107.14). The loss is read from the count, never
 * stored, as `hasLostOnLife` reads the life total.
 * Not responsible for: the life total or the commander-damage tally (`life.ts`,
 * `commander-damage.ts`): a change here touches neither, nor the life history. Two-Headed
 * Giant's shared poison (CR 704.6b), opponents' counters and rad counters are out of scope.
 *
 * @module playtest/engine/designations
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type {
  DayNight,
  DayOrNight,
  PlayerCounterKind,
  PlayerDesignations,
  PlaytestEngine,
  ToggledDesignation,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────
/** CR 104.3d, 704.5c: ten or more poison counters lose the game. */
export const POISON_TO_LOSE = 10;

/**
 * Where every game starts: no counters, no designation, and neither day nor night (CR 731.1:
 * "The game starts with neither designation"; CR 725.1, 726.1: no monarch and no initiative
 * until an effect says so).
 */
export const NO_DESIGNATIONS: PlayerDesignations = {
  poison: 0,
  energy: 0,
  experience: 0,
  ringTemptations: 0,
  monarch: false,
  initiative: false,
  dayNight: "neither",
  citysBlessing: false,
};

// ─── Types ────────────────────────────────────────────────────────────────
/** Counters put on (`amount` above zero) or taken off (below zero) the player. */
export interface PlayerCounterChange {
  readonly counter: PlayerCounterKind;
  readonly amount: number;
}

// ─── Policies ─────────────────────────────────────────────────────────────
/**
 * True for a change the engine refuses: zero, a fraction, or one that would leave fewer than
 * zero counters. A player cannot have a negative number of counters (CR 122.1: a counter is a
 * marker, so there is nothing below none). Pure; the transition, the guard table and the panel's
 * disabled buttons share it so they cannot disagree.
 */
export function refusesCounterChange(
  state: Pick<PlaytestEngine, "designations">,
  change: PlayerCounterChange
): boolean {
  return (
    !Number.isInteger(change.amount) ||
    change.amount === 0 ||
    state.designations[change.counter] + change.amount < 0
  );
}

/** True once the player has the city's blessing, which they keep for the game (CR 702.131a). */
export function hasCitysBlessing(
  state: Pick<PlaytestEngine, "designations">
): boolean {
  return state.designations.citysBlessing;
}

/** True when it already is `dayNight`, so making it so again changes nothing (CR 731.1a). */
export function isAlreadyDayNight(
  state: Pick<PlaytestEngine, "designations">,
  target: { readonly dayNight: DayOrNight }
): boolean {
  return state.designations.dayNight === target.dayNight;
}

/**
 * True when the player has lost on poison: ten or more counters (CR 104.3d, 122.1f, 704.5c).
 * Derived from the count alone, so an undo restores the mark with the count.
 */
export function hasLostOnPoison(
  state: Pick<PlaytestEngine, "designations">
): boolean {
  return state.designations.poison >= POISON_TO_LOSE;
}

// ─── Transitions ──────────────────────────────────────────────────────────
/**
 * Puts counters on the player or takes them off, as one undo step with one log line.
 *
 * Returns the same state while a bottom choice is pending (CR 103.5) and for a change
 * `refusesCounterChange` names: zero, a fraction, or a count that would go below zero.
 *
 * @param change - which counter and how many; negative removes
 * @param deps - `clock` stamps the undo entry
 */
export function applyPlayerCounter(
  state: PlaytestEngine,
  change: PlayerCounterChange,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (refusesCounterChange(state, change)) return state;
  const total = state.designations[change.counter] + change.amount;

  return pushHistory(state, deps.clock, {
    patch: {
      designations: { ...state.designations, [change.counter]: total },
    },
    description: counterLine(change, total),
  });
}

/**
 * Gives the player the city's blessing, as one undo step with one log line. Once the player has
 * it, it stays for the rest of the game (CR 702.131a, 702.131b: "for the rest of the game"), so
 * only undo takes it away.
 *
 * Returns the same state while a bottom choice is pending (CR 103.5) and when the player
 * already has it.
 */
export function applyGainCitysBlessing(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state) || hasCitysBlessing(state)) return state;

  return pushHistory(state, deps.clock, {
    patch: { designations: { ...state.designations, citysBlessing: true } },
    description: "Got the city's blessing",
  });
}

/**
 * Makes it day or night, as one undo step with one log line. The game starts with neither and
 * can become day or night (CR 731.1); "day becomes night" and "night becomes day" swap them
 * (CR 731.1a). Nothing makes it neither again, so only undo goes back there.
 *
 * Returns the same state while a bottom choice is pending (CR 103.5) and when it already is
 * `dayNight`.
 */
export function applySetDayNight(
  state: PlaytestEngine,
  dayNight: DayOrNight,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state) || isAlreadyDayNight(state, { dayNight })) {
    return state;
  }
  return pushHistory(state, deps.clock, {
    patch: { designations: { ...state.designations, dayNight } },
    description: dayNightLine(state.designations.dayNight, dayNight),
  });
}

/**
 * Gives the player the monarch or the initiative, or takes it away, as one undo step with one
 * log line. Only one player has either at a time (CR 725.3, 726.3), so an imagined opponent
 * becoming the monarch or taking the initiative is the player switching it off.
 *
 * Returns the same state while a bottom choice is pending (CR 103.5).
 */
export function applyToggleDesignation(
  state: PlaytestEngine,
  designation: ToggledDesignation,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const has = !state.designations[designation];

  return pushHistory(state, deps.clock, {
    patch: { designations: { ...state.designations, [designation]: has } },
    description: TOGGLE_LINES[designation][has ? "taken" : "lost"],
  });
}

/**
 * Records that the Ring tempted the player once more (CR 701.54a), as one undo step with one log
 * line. The count only grows; undo takes a temptation back. Choosing a Ring-bearer is out of
 * scope.
 *
 * Returns the same state while a bottom choice is pending (CR 103.5).
 */
export function applyRingTempts(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const ringTemptations = state.designations.ringTemptations + 1;

  return pushHistory(state, deps.clock, {
    patch: { designations: { ...state.designations, ringTemptations } },
    description: `The Ring tempted you (${ringTemptations} in total)`,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────
/** The log line when the player takes a designation, and when an opponent takes it away. */
const TOGGLE_LINES: Readonly<
  Record<ToggledDesignation, { readonly taken: string; readonly lost: string }>
> = {
  monarch: {
    taken: "Became the monarch",
    lost: "An opponent became the monarch",
  },
  initiative: {
    taken: "Took the initiative",
    lost: "An opponent took the initiative",
  },
};

/** "It became day" from neither; "Night became day" when they swap (CR 731.1, 731.1a). */
function dayNightLine(from: DayNight, to: DayOrNight): string {
  if (from === "neither") return `It became ${to}`;
  return from === "day" ? "Day became night" : "Night became day";
}

/** "Gained 2 poison counters (3 in total)", "Lost 1 energy counter (0 in total)". */
function counterLine(change: PlayerCounterChange, total: number): string {
  const verb = change.amount > 0 ? "Gained" : "Lost";
  const count = Math.abs(change.amount);
  const noun = count === 1 ? "counter" : "counters";
  return `${verb} ${count} ${change.counter} ${noun} (${total} in total)`;
}
