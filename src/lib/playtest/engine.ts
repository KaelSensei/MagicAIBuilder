/**
 * The state of one goldfish game and every move the player can make in it.
 *
 * Context: playtest. This module is the engine's public surface: it re-exports, by name, what
 * the store, the components and the tests use, and nothing else. The code lives in `engine/`,
 * one module per concern: `ports` (randomness and time), `types`, `shuffle`, `initial-state`
 * (the deal), `mulligan`, `turn`, `shuffle-library` (the player's own shuffle), `life`, `commander-damage`, `designations` (player counters,
 * the monarch, the initiative, the Ring, day and night, the city's blessing), `battlefield`,
 * `zones`, `dice`, `action-log` and `history` (undo). Each `apply*` transition is a pure function from one readonly
 * `PlaytestEngine` to the next, and returns the same state when the move does not apply.
 * `commands` names every move as a `PlaytestCommand` and reduces it to its transition
 * (`reducePlaytest`); `store.ts` dispatches those commands and holds the current state for the
 * playtest modal (`components/playtest/`).
 * Undo works by snapshot: a transition stores the state it replaced in `history`.
 *
 * Randomness and time come in through two ports, `RandomSource` and `Clock`, bundled as
 * `PlaytestDeps`. The transitions that shuffle or stamp a time take them as their optional
 * last argument and default to `defaultPlaytestDeps` (Web Crypto and the system clock), so a
 * test can replay a whole game from a seed (`engine-golden.test.ts`). The probability bench
 * deals from the same kind of seed through `shuffleWithSeed` (`engine/seeded-rng.ts`, I-21).
 * A command adds the id
 * source `newId` (`PlaytestCommandDeps`) for the copies and tokens it creates.
 *
 * Rules: the London mulligan and the free multiplayer mulligan (CR 103.5, 103.5c), the
 * first-turn draw (CR 103.8a, 103.8c), commanders in the command zone (CR 903.6, 903.9b).
 * Not responsible for: turning deck rows into physical cards (`store.ts`), whether a mulligan
 * is still allowed (`PlaytestModal.tsx`), keep advice (`keep-rules.ts`), draw evidence
 * (`draw-progress-evidence.ts`) or the log export (`action-log-export.ts`).
 *
 * @module playtest/engine
 */

export {
  defaultNewId,
  defaultPlaytestCommandDeps,
  defaultPlaytestDeps,
} from "./engine/ports";
export type {
  Clock,
  NewId,
  PlaytestCommandDeps,
  PlaytestDeps,
  RandomSource,
} from "./engine/ports";

export { reducePlaytest } from "./engine/commands";
export type { PlaytestCommand } from "./engine/commands";

export { PHASES } from "./engine/types";
export type {
  BattlefieldCard,
  CardZone,
  CommanderDamageTally,
  DayNight,
  DayOrNight,
  DiceRoll,
  LifeHistoryEntry,
  Phase,
  PlayerCounterKind,
  PlayerDesignations,
  PlaytestActionLogEntry,
  PlaytestEngine,
  PlaytestLogMessage,
  PlaytestTokenSpec,
  ToggledDesignation,
  UndoHistoryEntry,
} from "./engine/types";

export { createPlaytestState } from "./engine/initial-state";
export { createSeededRandom, shuffleWithSeed } from "./engine/seeded-rng";

export {
  applyBottomCards,
  applyMulligan,
  isChoosingBottom,
  keptOpeningHandSize,
  maxMulligans,
  mulliganBottomCount,
} from "./engine/mulligan";
export type { MulliganTally } from "./engine/mulligan";

export { applyDrawCard, applyNextPhase, applyNextTurn } from "./engine/turn";

export { applyShuffleLibrary } from "./engine/shuffle-library";

export { applyDamage, applyHeal, hasLostOnLife } from "./engine/life";

export {
  applyCommanderDamage,
  COMMANDER_DAMAGE_TO_LOSE,
  commanderDamageByOpponent,
  isCommanderDamageAmount,
  MAX_IMAGINED_OPPONENTS,
} from "./engine/commander-damage";
export type {
  CommanderDamageFromCommander,
  CommanderDamageHit,
  OpponentCommanderDamage,
} from "./engine/commander-damage";

export {
  applyGainCitysBlessing,
  applyPlayerCounter,
  applyRingTempts,
  applySetDayNight,
  applyToggleDesignation,
  hasCitysBlessing,
  hasLostOnPoison,
  isAlreadyDayNight,
  NO_DESIGNATIONS,
  POISON_TO_LOSE,
  refusesCounterChange,
} from "./engine/designations";
export type { PlayerCounterChange } from "./engine/designations";

export {
  applyAddCounter,
  applyCreateCardCopy,
  applyCreateToken,
  applyTap,
  applyUntapAll,
} from "./engine/battlefield";

export { applyMoveToZone } from "./engine/zones";

export { applyRollDie } from "./engine/dice";

export {
  applyAddActionLogEntry,
  applyEditActionLogEntry,
  applyRecordMana,
  applyRemoveActionLogEntry,
  noteMessage,
} from "./engine/action-log";

export { applyUndo } from "./engine/history";
