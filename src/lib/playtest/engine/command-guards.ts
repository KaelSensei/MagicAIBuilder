/**
 * When a command changes nothing: the conditions each transition checks today, written as data.
 *
 * Context: playtest, the engine. The transitions enforce these conditions and return their state
 * unchanged; this table describes them, in the transition's order, and `commands.test.ts` walks
 * it so the description and the code cannot drift. `playtestCommandBlockReason` is the one walk
 * over the table; a later slice may let the modal disable a button from it. The table also lists
 * the checks the engine does not make today (`PLAYTEST_COMMAND_KNOWN_GAPS`), which a structural
 * change must keep not making until their own fix lands.
 * Rules: the London mulligan waits for its bottom cards (CR 103.5) and has a limit (CR 103.5);
 * only a commander enters the command zone (CR 903.9).
 * Not responsible for: applying a command (`commands.ts`).
 *
 * @module playtest/engine/command-guards
 */

import {
  nextCopyId,
  nextTokenId,
  type CommandOf,
  type PlaytestCommand,
  type PlaytestCommandType,
} from "./commands";
import { isChoosingBottom, maxMulligans } from "./mulligan";
import { defaultPlaytestCommandDeps, type PlaytestCommandDeps } from "./ports";
import type { CardZone, PlaytestEngine } from "./types";

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
  | "not-on-battlefield"
  | "id-taken"
  | "not-a-commander"
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

function isCommandOf<T extends PlaytestCommandType>(
  command: PlaytestCommand,
  type: T
): command is CommandOf<T> {
  return command.type === type;
}

/** A guard for one command variant, so its check reads the variant's own payload. */
function guard<T extends PlaytestCommandType>(
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
const whileChoosingBottom: PlaytestCommandGuard = {
  reason: "choosing-bottom",
  blocks: (state) => isChoosingBottom(state),
};

const onBattlefield = (state: PlaytestEngine, cardId: string): boolean =>
  state.battlefield.some((card) => card.id === cardId);
const inLog = (state: PlaytestEngine, entryId: number): boolean =>
  state.actionLog.some((entry) => entry.id === entryId);
const isBlank = (text: string): boolean => text.trim() === "";

/** The cards of one zone, as `applyMoveToZone` looks the moved card up. */
function zoneCards(
  state: PlaytestEngine,
  zone: CardZone
): readonly { readonly id: string }[] {
  switch (zone) {
    case "hand":
      return state.hand;
    case "library":
      return state.library;
    case "battlefield":
      return state.battlefield;
    case "graveyard":
      return state.graveyard;
    case "exile":
      return state.exile;
    case "command":
      return state.commandZone;
    default: {
      const exhaustive: never = zone;
      return exhaustive;
    }
  }
}

// ─── The table ────────────────────────────────────────────────────────────
/**
 * When each command is a no-op today, in the order the transition checks the conditions. A list
 * with only the bottom-choice guard means the command otherwise always applies.
 *
 * `rollDie` also refuses a result outside `[1, sides]` in `applyRollDie`; a lawful random port
 * never produces one, so no row describes it.
 */
export const PLAYTEST_COMMAND_GUARDS: Readonly<
  Record<PlaytestCommandType, readonly PlaytestCommandGuard[]>
> = {
  draw: [
    whileChoosingBottom,
    guard("draw", "library-empty", (state) => state.library.length === 0),
  ],
  mulligan: [
    whileChoosingBottom,
    // CR 103.5: no further mulligan once the opening hand would be zero cards.
    guard(
      "mulligan",
      "mulligan-limit",
      (state) => state.mulliganCount >= maxMulligans(state)
    ),
  ],
  bottomCards: [
    guard(
      "bottomCards",
      "no-bottom-pending",
      (state) => state.cardsToBottom === 0
    ),
    guard(
      "bottomCards",
      "bottom-count-mismatch",
      (state, { cardIds }) => cardIds.length !== state.cardsToBottom
    ),
    guard(
      "bottomCards",
      "bottom-duplicate",
      (_state, { cardIds }) => new Set(cardIds).size !== cardIds.length
    ),
    guard("bottomCards", "bottom-not-in-hand", (state, { cardIds }) => {
      const hand = new Set(state.hand.map((card) => card.id));
      return cardIds.some((id) => !hand.has(id));
    }),
  ],
  nextPhase: [whileChoosingBottom],
  nextTurn: [whileChoosingBottom],
  damage: [whileChoosingBottom],
  heal: [whileChoosingBottom],
  tap: [
    whileChoosingBottom,
    guard(
      "tap",
      "not-on-battlefield",
      (state, { cardId }) => !onBattlefield(state, cardId)
    ),
  ],
  untapAll: [whileChoosingBottom],
  moveToZone: [
    whileChoosingBottom,
    // CR 903.9: only a commander may enter the command zone.
    guard(
      "moveToZone",
      "not-a-commander",
      (state, { cardId, to }) =>
        to === "command" && !state.commanderIds.includes(cardId)
    ),
    guard(
      "moveToZone",
      "not-in-zone",
      (state, { cardId, from }) =>
        !zoneCards(state, from).some((card) => card.id === cardId)
    ),
  ],
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
  rollDie: [
    whileChoosingBottom,
    guard(
      "rollDie",
      "bad-die",
      (_state, { sides }) => !Number.isInteger(sides) || sides < 2
    ),
  ],
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
  undo: [
    guard("undo", "nothing-to-undo", (state) => state.history.length === 0),
  ],
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
 */
export const PLAYTEST_COMMAND_KNOWN_GAPS: readonly PlaytestCommandKnownGap[] = [
  {
    type: "damage",
    behaviour:
      "a negative amount is accepted and gains life; CR 119.3 knows no negative loss",
    followUp: "validate the amount in its own fix (noted by PT-03)",
  },
];
