/**
 * The state of one goldfish game and every move the player can make in it.
 *
 * Context: playtest. This module is the engine's public surface: it re-exports, by name, what
 * the store, the components and the tests use, and nothing else. The code lives in `engine/`,
 * one module per concern: `ports` (randomness and time), `types`, `shuffle`, `initial-state`
 * (the deal), `mulligan`, `turn`, `life`, `battlefield`, `zones`, `dice`, `action-log` and
 * `history` (undo). Each `apply*` transition is a pure function from one readonly
 * `PlaytestEngine` to the next, and returns the same state when the move does not apply.
 * `store.ts` holds the current state for the playtest modal (`components/playtest/`).
 * Undo works by snapshot: a transition stores the state it replaced in `history`.
 *
 * Randomness and time come in through two ports, `RandomSource` and `Clock`, bundled as
 * `PlaytestDeps`. The transitions that shuffle or stamp a time take them as their optional
 * last argument and default to `defaultPlaytestDeps` (Web Crypto and the system clock), so a
 * test can replay a whole game from a seed (`engine-golden.test.ts`).
 *
 * Rules: the London mulligan and the free multiplayer mulligan (CR 103.5, 103.5c), the
 * first-turn draw (CR 103.8a, 103.8c), commanders in the command zone (CR 903.6, 903.9b).
 * Not responsible for: turning deck rows into physical cards (`store.ts`), whether a mulligan
 * is still allowed (`PlaytestModal.tsx`), keep advice (`keep-rules.ts`), draw evidence
 * (`draw-progress-evidence.ts`) or the log export (`action-log-export.ts`).
 *
 * @module playtest/engine
 */

export { defaultPlaytestDeps } from "./engine/ports";
export type { Clock, PlaytestDeps, RandomSource } from "./engine/ports";

export { PHASES } from "./engine/types";
export type {
  BattlefieldCard,
  CardZone,
  DiceRoll,
  LifeHistoryEntry,
  Phase,
  PlaytestActionLogEntry,
  PlaytestEngine,
  PlaytestTokenSpec,
  UndoHistoryEntry,
} from "./engine/types";

export { createPlaytestState } from "./engine/initial-state";

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

export { applyDamage, applyHeal } from "./engine/life";

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
} from "./engine/action-log";

export { applyUndo } from "./engine/history";
