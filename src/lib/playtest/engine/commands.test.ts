/**
 * The reducer table: every command reaches the same state as the transition it stands for, the
 * store's methods agree with `dispatch`, and the guard table says exactly when a command is a
 * no-op today.
 *
 * The game is dealt in deck order (a random source that never swaps), the clock is fixed and the
 * id source returns one known id, so every expected state can be computed from the same inputs.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import {
  applyAddActionLogEntry,
  applyAddCounter,
  applyBottomCards,
  applyCommanderDamage,
  applyCreateCardCopy,
  applyCreateToken,
  applyDamage,
  applyDrawCard,
  applyEditActionLogEntry,
  applyGainCitysBlessing,
  applyHeal,
  applyMoveToZone,
  applyMulligan,
  applyNextPhase,
  applyNextTurn,
  applyPlayerCounter,
  applyRecordMana,
  applyRemoveActionLogEntry,
  applyRingTempts,
  applyRollDie,
  applySetDayNight,
  applyShuffleLibrary,
  applyTap,
  applyToggleDesignation,
  applyUndo,
  applyUntapAll,
  createPlaytestState,
  hasLostOnLife,
  maxMulligans,
} from "@/lib/playtest/engine";
import type { PlaytestEngine, RandomSource } from "@/lib/playtest/engine";
import { createPlaytestStore } from "@/lib/playtest/store";
import {
  PLAYTEST_COMMAND_GUARDS,
  PLAYTEST_COMMAND_KNOWN_GAPS,
  playtestCommandBlockReason,
} from "./command-guards";
import type { PlaytestGuardReason } from "./command-guards";
import { reducePlaytest } from "./commands";
import type { PlaytestCommand, PlaytestCommandType } from "./commands";
import { defaultNewId, type PlaytestCommandDeps } from "./ports";

// ─── Fixtures ─────────────────────────────────────────────────────────────
const GAME_START = Date.UTC(2026, 10, 12, 20, 0, 0);

/** Always picks the last index, so the Fisher–Yates shuffle swaps nothing. */
const inDeckOrder: RandomSource = {
  intBelow: (upperExclusive) => upperExclusive - 1,
};

const deps: PlaytestCommandDeps = {
  random: inDeckOrder,
  clock: { now: () => GAME_START },
  newId: () => "fixed",
};

/** The same ports, with the production id source: ids as the store generated them before. */
const depsWithProductionIds: PlaytestCommandDeps = {
  ...deps,
  newId: defaultNewId,
};

const makeCard = (id: string, name: string): DeckCard =>
  aDeckCard({
    id,
    name,
    scryfallId: id,
    typeLine: "Creature",
    category: "creature",
  });

const KENRITH = makeCard("kenrith", "Kenrith, the Returned King");
const LIBRARY = Array.from({ length: 20 }, (_, index) =>
  makeCard(`c${index + 1}`, `Card ${index + 1}`)
);
const SOLDIER = {
  name: "Soldier",
  power: "1/1",
  colors: ["white"],
  kind: "token",
} as const;
const KENRITH_HITS_OPPONENT_ONE = {
  type: "commanderDamage",
  opponent: 1,
  commanderId: "kenrith",
  amount: 7,
} as const;

/** A duel just dealt: no move made yet, so nothing to undo. */
function dealtState(): PlaytestEngine {
  return createPlaytestState(
    LIBRARY,
    {
      multiplayer: false,
      firstMulliganFree: false,
      commandZone: [KENRITH],
    },
    { random: inDeckOrder }
  );
}

/** The dealt duel after two moves: a permanent on the battlefield and two log lines. */
function baseState(): PlaytestEngine {
  const withPermanent = applyMoveToZone(
    dealtState(),
    "c1",
    "hand",
    "battlefield",
    deps
  );
  return applyRecordMana(withPermanent, 2, deps);
}

/** The base game at a multiplayer Commander table, which offers the commander-damage tally. */
function tallyState(): PlaytestEngine {
  return { ...baseState(), commanderDamageOpponents: 3 };
}

/** The base game after a mulligan: one card to put on the bottom. */
function choosingState(): PlaytestEngine {
  return applyMulligan(baseState(), deps);
}

const first = <T>(items: readonly T[]): T => {
  const item = items[0];
  if (item === undefined) throw new Error("the fixture expected an item here");
  return item;
};
const handId = (state: PlaytestEngine): string => first(state.hand).id;
const permanentId = (state: PlaytestEngine): string =>
  first(state.battlefield).id;
const lastLogId = (state: PlaytestEngine): number => state.nextActionId - 1;

/** Makes Web Crypto hand out the bytes 0, 1, 2, …, so an id reads "abcdefghijklmnop". */
function stubWebCryptoBytes(): void {
  vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
    if (!(array instanceof Uint8Array)) {
      throw new TypeError("this test fills Uint8Array only");
    }
    for (let index = 0; index < array.length; index++) array[index] = index;
    return array;
  });
}

// ─── The reducer table ────────────────────────────────────────────────────
/** One command and the transition call it must equal. */
interface ReducerRow {
  readonly label: string;
  readonly type: PlaytestCommandType;
  /** The state the command starts from; the base game unless the command needs another. */
  readonly from?: () => PlaytestEngine;
  readonly command: (state: PlaytestEngine) => PlaytestCommand;
  readonly expected: (state: PlaytestEngine) => PlaytestEngine;
}

const ROWS: readonly ReducerRow[] = [
  {
    label: "draw draws the top card",
    type: "draw",
    command: () => ({ type: "draw" }),
    expected: (s) => applyDrawCard(s, deps),
  },
  {
    label: "mulligan takes a London mulligan",
    type: "mulligan",
    command: () => ({ type: "mulligan" }),
    expected: (s) => applyMulligan(s, deps),
  },
  {
    label: "bottomCards settles the pending mulligan",
    type: "bottomCards",
    from: choosingState,
    command: (s) => ({ type: "bottomCards", cardIds: [handId(s)] }),
    expected: (s) => applyBottomCards(s, [handId(s)], deps),
  },
  {
    label: "nextPhase advances one step",
    type: "nextPhase",
    command: () => ({ type: "nextPhase" }),
    expected: (s) => applyNextPhase(s, deps),
  },
  {
    label: "nextTurn starts the next turn",
    type: "nextTurn",
    command: () => ({ type: "nextTurn" }),
    expected: (s) => applyNextTurn(s, deps),
  },
  {
    label: "shuffleLibrary shuffles the library",
    type: "shuffleLibrary",
    command: () => ({ type: "shuffleLibrary" }),
    expected: (s) => applyShuffleLibrary(s, deps),
  },
  {
    label: "damage with a cause loses life for that cause",
    type: "damage",
    command: () => ({ type: "damage", amount: 3, description: "combat" }),
    expected: (s) => applyDamage(s, 3, "combat", deps),
  },
  {
    label: 'damage without a cause is logged as "damage"',
    type: "damage",
    command: () => ({ type: "damage", amount: 3 }),
    expected: (s) => applyDamage(s, 3, "damage", deps),
  },
  {
    label: "heal gains life",
    type: "heal",
    command: () => ({ type: "heal", amount: 2 }),
    expected: (s) => applyHeal(s, 2, deps),
  },
  {
    label: "commanderDamage tallies a commander's combat damage to an opponent",
    type: "commanderDamage",
    from: tallyState,
    command: () => KENRITH_HITS_OPPONENT_ONE,
    expected: (s) => applyCommanderDamage(s, KENRITH_HITS_OPPONENT_ONE, deps),
  },
  {
    label: "playerCounter puts counters on the player",
    type: "playerCounter",
    command: () => ({ type: "playerCounter", counter: "poison", amount: 2 }),
    expected: (s) =>
      applyPlayerCounter(s, { counter: "poison", amount: 2 }, deps),
  },
  {
    label: "gainCitysBlessing gives the player the city's blessing",
    type: "gainCitysBlessing",
    command: () => ({ type: "gainCitysBlessing" }),
    expected: (s) => applyGainCitysBlessing(s, deps),
  },
  {
    label: "setDayNight makes it day",
    type: "setDayNight",
    command: () => ({ type: "setDayNight", dayNight: "day" }),
    expected: (s) => applySetDayNight(s, "day", deps),
  },
  {
    label: "toggleDesignation makes the player the monarch",
    type: "toggleDesignation",
    command: () => ({ type: "toggleDesignation", designation: "monarch" }),
    expected: (s) => applyToggleDesignation(s, "monarch", deps),
  },
  {
    label: "ringTempts counts one more temptation",
    type: "ringTempts",
    command: () => ({ type: "ringTempts" }),
    expected: (s) => applyRingTempts(s, deps),
  },
  {
    label: "tap toggles a permanent",
    type: "tap",
    command: (s) => ({ type: "tap", cardId: permanentId(s) }),
    expected: (s) => applyTap(s, permanentId(s), deps),
  },
  {
    label: "untapAll untaps every permanent",
    type: "untapAll",
    command: () => ({ type: "untapAll" }),
    expected: (s) => applyUntapAll(s, deps),
  },
  {
    label: "moveToZone moves a card between zones",
    type: "moveToZone",
    command: (s) => ({
      type: "moveToZone",
      cardId: handId(s),
      from: "hand",
      to: "graveyard",
    }),
    expected: (s) => applyMoveToZone(s, handId(s), "hand", "graveyard", deps),
  },
  {
    label: "addCounter puts a counter on a permanent",
    type: "addCounter",
    command: (s) => ({ type: "addCounter", cardId: permanentId(s), amount: 1 }),
    expected: (s) => applyAddCounter(s, permanentId(s), 1, deps),
  },
  {
    label: "createCardCopy copies a permanent under a playtest-copy id",
    type: "createCardCopy",
    command: (s) => ({ type: "createCardCopy", cardId: permanentId(s) }),
    expected: (s) =>
      applyCreateCardCopy(s, permanentId(s), "playtest-copy-fixed", deps),
  },
  {
    label: "createToken creates a token under a playtest-token id",
    type: "createToken",
    command: () => ({ type: "createToken", token: SOLDIER }),
    expected: (s) => applyCreateToken(s, SOLDIER, "playtest-token-fixed", deps),
  },
  {
    label: "rollDie rolls what the random port dictates",
    type: "rollDie",
    command: () => ({ type: "rollDie", sides: 20 }),
    expected: (s) => applyRollDie(s, 20, 20, deps),
  },
  {
    label: "addLogEntry adds a trimmed note",
    type: "addLogEntry",
    command: () => ({ type: "addLogEntry", description: " Opponent at 12 " }),
    expected: (s) => applyAddActionLogEntry(s, " Opponent at 12 ", deps),
  },
  {
    label: "recordMana logs the mana produced",
    type: "recordMana",
    command: () => ({ type: "recordMana", amount: 3 }),
    expected: (s) => applyRecordMana(s, 3, deps),
  },
  {
    label: "editLogEntry rewrites a log line",
    type: "editLogEntry",
    command: (s) => ({
      type: "editLogEntry",
      entryId: lastLogId(s),
      description: "Produced two mana",
    }),
    expected: (s) =>
      applyEditActionLogEntry(s, lastLogId(s), "Produced two mana", deps),
  },
  {
    label: "removeLogEntry removes a log line",
    type: "removeLogEntry",
    command: (s) => ({ type: "removeLogEntry", entryId: lastLogId(s) }),
    expected: (s) => applyRemoveActionLogEntry(s, lastLogId(s), deps),
  },
  {
    label: "undo restores the state before the last move",
    type: "undo",
    command: () => ({ type: "undo" }),
    expected: (s) => applyUndo(s),
  },
];

/** The row that drives a command type, for a guard scenario that needs a valid payload. */
function sampleCommand(
  type: PlaytestCommandType,
  state: PlaytestEngine
): PlaytestCommand {
  const row = ROWS.find((candidate) => candidate.type === type);
  if (row === undefined) throw new Error(`no reducer row for ${type}`);
  return row.command(state);
}

describe("reducePlaytest", () => {
  describe.each(ROWS)("$label", (row) => {
    it("reaches the state the transition reaches", () => {
      const state = (row.from ?? baseState)();
      const command = row.command(state);

      const result = reducePlaytest(state, command, deps);

      expect(result).toEqual(row.expected(state));
      expect(result).not.toBe(state);
    });
  });

  it("covers every command variant the guard table names", () => {
    const covered = new Set<string>(ROWS.map((row) => row.type));
    for (const type of Object.keys(PLAYTEST_COMMAND_GUARDS)) {
      expect(covered.has(type), `no reducer row for ${type}`).toBe(true);
    }
  });

  describe("ids from the production source", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("names a copy as the store did before: playtest-copy- and 16 Web Crypto characters", () => {
      stubWebCryptoBytes();
      const state = baseState();

      const result = reducePlaytest(
        state,
        { type: "createCardCopy", cardId: permanentId(state) },
        depsWithProductionIds
      );

      expect(result.battlefield.at(-1)?.id).toBe(
        "playtest-copy-abcdefghijklmnop"
      );
    });

    it("names a token as the store did before: playtest-token- and 16 Web Crypto characters", () => {
      stubWebCryptoBytes();

      const result = reducePlaytest(
        baseState(),
        { type: "createToken", token: SOLDIER },
        depsWithProductionIds
      );

      expect(result.battlefield.at(-1)?.id).toBe(
        "playtest-token-abcdefghijklmnop"
      );
    });
  });
});

// ─── The guard table ──────────────────────────────────────────────────────
interface BlockedScenario {
  readonly state: PlaytestEngine;
  readonly command: PlaytestCommand;
}

/** A game whose battlefield already holds a card under the id the id source will give. */
function withTakenId(id: string): PlaytestEngine {
  const base = baseState();
  const taken = { ...first(base.battlefield), id };
  return { ...base, battlefield: [...base.battlefield, taken] };
}

/** A state and a command of `type` that today's engine leaves unchanged for `reason`. */
function blockedScenario(
  type: PlaytestCommandType,
  reason: PlaytestGuardReason
): BlockedScenario {
  const base = baseState();
  switch (reason) {
    case "choosing-bottom": {
      const state = choosingState();
      return { state, command: sampleCommand(type, state) };
    }
    case "mulligan-limit":
      return {
        state: { ...base, mulliganCount: maxMulligans(base) },
        command: { type: "mulligan" },
      };
    case "no-bottom-pending":
      return {
        state: base,
        command: { type: "bottomCards", cardIds: [handId(base)] },
      };
    case "bottom-count-mismatch": {
      const state = choosingState();
      const [one, two] = state.hand;
      if (one === undefined || two === undefined)
        throw new Error("two hand cards expected");
      return {
        state,
        command: { type: "bottomCards", cardIds: [one.id, two.id] },
      };
    }
    case "bottom-duplicate": {
      const state = { ...choosingState(), cardsToBottom: 2 };
      return {
        state,
        command: {
          type: "bottomCards",
          cardIds: [handId(state), handId(state)],
        },
      };
    }
    case "bottom-not-in-hand":
      return {
        state: choosingState(),
        command: { type: "bottomCards", cardIds: ["not-in-hand"] },
      };
    case "library-empty":
      return { state: { ...base, library: [] }, command: { type: "draw" } };
    case "negative-damage":
      return { state: base, command: { type: "damage", amount: -3 } };
    case "not-on-battlefield":
      return {
        state: base,
        command: notOnBattlefieldCommand(type),
      };
    case "id-taken":
      return type === "createToken"
        ? {
            state: withTakenId("playtest-token-fixed"),
            command: { type: "createToken", token: SOLDIER },
          }
        : {
            state: withTakenId("playtest-copy-fixed"),
            command: { type: "createCardCopy", cardId: permanentId(base) },
          };
    case "not-a-commander":
      return type === "commanderDamage"
        ? {
            state: tallyState(),
            command: { ...KENRITH_HITS_OPPONENT_ONE, commanderId: "c1" },
          }
        : {
            state: base,
            command: {
              type: "moveToZone",
              cardId: handId(base),
              from: "hand",
              to: "command",
            },
          };
    case "no-commander-damage":
      return { state: base, command: KENRITH_HITS_OPPONENT_ONE };
    case "unknown-opponent":
      return {
        state: tallyState(),
        command: { ...KENRITH_HITS_OPPONENT_ONE, opponent: 4 },
      };
    case "bad-commander-damage":
      return {
        state: tallyState(),
        command: { ...KENRITH_HITS_OPPONENT_ONE, amount: 0 },
      };
    case "bad-counter-change":
      return {
        state: base,
        command: { type: "playerCounter", counter: "energy", amount: -1 },
      };
    case "has-citys-blessing":
      return {
        state: applyGainCitysBlessing(base, deps),
        command: { type: "gainCitysBlessing" },
      };
    case "same-day-night":
      return {
        state: applySetDayNight(base, "night", deps),
        command: { type: "setDayNight", dayNight: "night" },
      };
    case "same-zone":
      return {
        state: base,
        command: {
          type: "moveToZone",
          cardId: handId(base),
          from: "hand",
          to: "hand",
        },
      };
    case "not-in-zone":
      return {
        state: base,
        command: {
          type: "moveToZone",
          cardId: "absent",
          from: "hand",
          to: "graveyard",
        },
      };
    case "bad-die":
      return { state: base, command: { type: "rollDie", sides: 1 } };
    case "blank-note":
      return {
        state: base,
        command:
          type === "editLogEntry"
            ? {
                type: "editLogEntry",
                entryId: lastLogId(base),
                description: "   ",
              }
            : { type: "addLogEntry", description: "   " },
      };
    case "mana-out-of-range":
      return { state: base, command: { type: "recordMana", amount: 0 } };
    case "unknown-log-entry":
      return {
        state: base,
        command:
          type === "editLogEntry"
            ? { type: "editLogEntry", entryId: 9999, description: "Edited" }
            : { type: "removeLogEntry", entryId: 9999 },
      };
    case "nothing-to-undo":
      return { state: dealtState(), command: { type: "undo" } };
    default: {
      const exhaustive: never = reason;
      return exhaustive;
    }
  }
}

function notOnBattlefieldCommand(type: PlaytestCommandType): PlaytestCommand {
  switch (type) {
    case "tap":
      return { type: "tap", cardId: "absent" };
    case "addCounter":
      return { type: "addCounter", cardId: "absent", amount: 1 };
    case "createCardCopy":
      return { type: "createCardCopy", cardId: "absent" };
    default:
      throw new Error(`${type} has no not-on-battlefield guard`);
  }
}

describe("the guard table", () => {
  const rows = Object.entries(PLAYTEST_COMMAND_GUARDS).flatMap(
    ([type, guards]) => guards.map((guard) => ({ type, guard }))
  );

  describe.each(rows)(
    "$type is a no-op when $guard.reason",
    ({ type, guard }) => {
      it("blocks, names the reason, and the reducer returns the very same state", () => {
        const { state, command } = blockedScenario(
          command_type(type),
          guard.reason
        );
        expect(command.type).toBe(type);

        expect(guard.blocks(state, command, deps)).toBe(true);
        expect(playtestCommandBlockReason(state, command, deps)).toBe(
          guard.reason
        );
        expect(reducePlaytest(state, command, deps)).toBe(state);
      });
    }
  );

  it("stops every command but the bottom choice and undo while a mulligan waits", () => {
    const waiting = Object.entries(PLAYTEST_COMMAND_GUARDS)
      .filter(([, guards]) =>
        guards.some((guard) => guard.reason === "choosing-bottom")
      )
      .map(([type]) => type)
      .sort();
    const all = Object.keys(PLAYTEST_COMMAND_GUARDS)
      .filter((type) => type !== "bottomCards" && type !== "undo")
      .sort();

    expect(waiting).toEqual(all);
  });

  it("reports no reason for a command the engine applies", () => {
    const state = baseState();
    for (const row of ROWS) {
      const from = (row.from ?? baseState)();
      expect(
        playtestCommandBlockReason(from, row.command(from), deps)
      ).toBeNull();
    }
    expect(state.cardsToBottom).toBe(0);
  });
});

/** Narrows a key of the guard table back to a command type, which is what its keys are. */
function command_type(type: string): PlaytestCommandType {
  const known = ROWS.find((row) => row.type === type);
  if (known === undefined) throw new Error(`unknown command type ${type}`);
  return known.type;
}

// ─── Each command's reasons, pinned ───────────────────────────────────────
/**
 * Every reason each command is refused for today, in the order its transition checks them,
 * written out by hand. The walk above proves each guard the table holds, but a guard lost from
 * the table would leave it green; this pin keeps the guard table's split (#1857) honest.
 */
const PINNED_REASONS: Readonly<
  Record<PlaytestCommandType, readonly PlaytestGuardReason[]>
> = {
  draw: ["choosing-bottom", "library-empty"],
  mulligan: ["choosing-bottom", "mulligan-limit"],
  bottomCards: [
    "no-bottom-pending",
    "bottom-count-mismatch",
    "bottom-duplicate",
    "bottom-not-in-hand",
  ],
  nextPhase: ["choosing-bottom"],
  nextTurn: ["choosing-bottom"],
  shuffleLibrary: ["choosing-bottom"],
  damage: ["choosing-bottom", "negative-damage"],
  heal: ["choosing-bottom"],
  commanderDamage: [
    "choosing-bottom",
    "no-commander-damage",
    "unknown-opponent",
    "not-a-commander",
    "bad-commander-damage",
  ],
  playerCounter: ["choosing-bottom", "bad-counter-change"],
  gainCitysBlessing: ["choosing-bottom", "has-citys-blessing"],
  setDayNight: ["choosing-bottom", "same-day-night"],
  toggleDesignation: ["choosing-bottom"],
  ringTempts: ["choosing-bottom"],
  tap: ["choosing-bottom", "not-on-battlefield"],
  untapAll: ["choosing-bottom"],
  moveToZone: [
    "choosing-bottom",
    "same-zone",
    "not-a-commander",
    "not-in-zone",
  ],
  addCounter: ["choosing-bottom", "not-on-battlefield"],
  createCardCopy: ["choosing-bottom", "id-taken", "not-on-battlefield"],
  createToken: ["choosing-bottom", "id-taken"],
  rollDie: ["choosing-bottom", "bad-die"],
  addLogEntry: ["choosing-bottom", "blank-note"],
  recordMana: ["choosing-bottom", "mana-out-of-range"],
  editLogEntry: ["choosing-bottom", "unknown-log-entry", "blank-note"],
  removeLogEntry: ["choosing-bottom", "unknown-log-entry"],
  undo: ["nothing-to-undo"],
};

describe("each command's refusal reasons (pinned before the split, #1857)", () => {
  it.each(Object.entries(PINNED_REASONS))(
    "%s is refused for exactly the pinned reasons, in its transition's order",
    (type, reasons) => {
      const guards = PLAYTEST_COMMAND_GUARDS[command_type(type)];

      expect(guards.map((guard) => guard.reason)).toEqual(reasons);
    }
  );
});

// ─── Known gaps, pinned ───────────────────────────────────────────────────
describe("known gaps (pinned, not fixed here)", () => {
  it("lists no gap now that negative damage is a guard", () => {
    expect(PLAYTEST_COMMAND_KNOWN_GAPS).toEqual([]);
  });
});

// CR 107.1b: damage is never negative; damage of 0 is still applied as before (CR 120.8).
describe("damage amounts through the reducer", () => {
  it("refuses a negative damage amount: same state, no life gained", () => {
    const state = baseState();

    const result = reducePlaytest(state, { type: "damage", amount: -5 }, deps);

    expect(result).toBe(state);
    expect(
      playtestCommandBlockReason(state, { type: "damage", amount: -5 }, deps)
    ).toBe("negative-damage");
  });

  it("applies damage of 0 as the transition always has", () => {
    const state = baseState();

    const result = reducePlaytest(state, { type: "damage", amount: 0 }, deps);

    expect(result).toEqual(applyDamage(state, 0, "damage", deps));
    expect(
      playtestCommandBlockReason(state, { type: "damage", amount: 0 }, deps)
    ).toBeNull();
  });
});

// CR 400.7: a zone change is a move from one zone to another; #1836 closed the same-zone move.
describe("a move to the zone the card is already in, through the reducer", () => {
  it("returns the very same state, names same-zone, and logs nothing", () => {
    const state = baseState();
    const sameZone: PlaytestCommand = {
      type: "moveToZone",
      cardId: permanentId(state),
      from: "battlefield",
      to: "battlefield",
    };

    const result = reducePlaytest(state, sameZone, deps);

    expect(result).toBe(state);
    expect(result.actionLog).toHaveLength(state.actionLog.length);
    expect(playtestCommandBlockReason(state, sameZone, deps)).toBe("same-zone");
  });
});

// B2-46 closed the heal gap: the loss is read from the life total, never stored.
describe("losing on life through the reducer", () => {
  it("ends the loss when a heal command brings life back above zero (CR 704.5a)", () => {
    const lost = reducePlaytest(
      baseState(),
      { type: "damage", amount: 40 },
      deps
    );
    expect(hasLostOnLife(lost)).toBe(true);

    const healed = reducePlaytest(lost, { type: "heal", amount: 5 }, deps);

    expect(healed.lifeTotal).toBe(5);
    expect(hasLostOnLife(healed)).toBe(false);
  });
});

// ─── The store dispatches ─────────────────────────────────────────────────
type PlaytestStoreApi = ReturnType<typeof createPlaytestStore>;

/** One store method and the command it stands for. */
interface StoreRow {
  readonly label: string;
  readonly from?: () => PlaytestEngine;
  readonly call: (store: PlaytestStoreApi, state: PlaytestEngine) => void;
  readonly command: (state: PlaytestEngine) => PlaytestCommand;
}

const STORE_ROWS: readonly StoreRow[] = [
  {
    label: "drawCard",
    call: (s) => s.getState().drawCard(),
    command: () => ({ type: "draw" }),
  },
  {
    label: "mulligan",
    call: (s) => s.getState().mulligan(),
    command: () => ({ type: "mulligan" }),
  },
  {
    label: "bottomCards",
    from: choosingState,
    call: (s, state) => s.getState().bottomCards([handId(state)]),
    command: (state) => ({ type: "bottomCards", cardIds: [handId(state)] }),
  },
  {
    label: "nextPhase",
    call: (s) => s.getState().nextPhase(),
    command: () => ({ type: "nextPhase" }),
  },
  {
    label: "nextTurn",
    call: (s) => s.getState().nextTurn(),
    command: () => ({ type: "nextTurn" }),
  },
  {
    label: "damage with a cause",
    call: (s) => s.getState().damage(3, "combat"),
    command: () => ({ type: "damage", amount: 3, description: "combat" }),
  },
  {
    label: "damage without a cause",
    call: (s) => s.getState().damage(3),
    command: () => ({ type: "damage", amount: 3 }),
  },
  {
    label: "heal",
    call: (s) => s.getState().heal(2),
    command: () => ({ type: "heal", amount: 2 }),
  },
  {
    label: "tap",
    call: (s, state) => s.getState().tap(permanentId(state)),
    command: (state) => ({ type: "tap", cardId: permanentId(state) }),
  },
  {
    label: "untapAll",
    call: (s) => s.getState().untapAll(),
    command: () => ({ type: "untapAll" }),
  },
  {
    label: "moveToZone",
    call: (s, state) =>
      s.getState().moveToZone(handId(state), "hand", "graveyard"),
    command: (state) => ({
      type: "moveToZone",
      cardId: handId(state),
      from: "hand",
      to: "graveyard",
    }),
  },
  {
    label: "addCounter",
    call: (s, state) => s.getState().addCounter(permanentId(state), 1),
    command: (state) => ({
      type: "addCounter",
      cardId: permanentId(state),
      amount: 1,
    }),
  },
  {
    label: "createCardCopy",
    call: (s, state) => s.getState().createCardCopy(permanentId(state)),
    command: (state) => ({
      type: "createCardCopy",
      cardId: permanentId(state),
    }),
  },
  {
    label: "createToken",
    call: (s) => s.getState().createToken({ ...SOLDIER, count: 1 }),
    command: () => ({ type: "createToken", token: SOLDIER }),
  },
  {
    label: "rollDie",
    call: (s) => s.getState().rollDie(20),
    command: () => ({ type: "rollDie", sides: 20 }),
  },
  {
    label: "addLogEntry",
    call: (s) => s.getState().addLogEntry("Opponent at 12"),
    command: () => ({ type: "addLogEntry", description: "Opponent at 12" }),
  },
  {
    label: "recordMana",
    call: (s) => s.getState().recordMana(3),
    command: () => ({ type: "recordMana", amount: 3 }),
  },
  {
    label: "editLogEntry",
    call: (s, state) => s.getState().editLogEntry(lastLogId(state), "Edited"),
    command: (state) => ({
      type: "editLogEntry",
      entryId: lastLogId(state),
      description: "Edited",
    }),
  },
  {
    label: "removeLogEntry",
    call: (s, state) => s.getState().removeLogEntry(lastLogId(state)),
    command: (state) => ({ type: "removeLogEntry", entryId: lastLogId(state) }),
  },
  {
    label: "undo",
    call: (s) => s.getState().undo(),
    command: () => ({ type: "undo" }),
  },
];

describe("the store's methods and the reducer agree", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe.each(STORE_ROWS)("$label", (row) => {
    it("leaves the store in the state the reducer computes", () => {
      stubWebCryptoBytes();
      const state = (row.from ?? baseState)();
      const store = createPlaytestStore(depsWithProductionIds);
      store.setState({ engine: state, isActive: true });

      row.call(store, state);

      expect(store.getState().engine).toEqual(
        reducePlaytest(state, row.command(state), depsWithProductionIds)
      );
    });
  });

  it("dispatch applies a command to the current game", () => {
    const state = baseState();
    const store = createPlaytestStore(deps);
    store.setState({ engine: state, isActive: true });

    store.getState().dispatch({ type: "heal", amount: 2 });

    expect(store.getState().engine).toEqual(applyHeal(state, 2, deps));
  });

  it("dispatch changes nothing when no game is running", () => {
    const store = createPlaytestStore(deps);

    store.getState().dispatch({ type: "draw" });

    expect(store.getState().engine).toBeNull();
    expect(store.getState().isActive).toBe(false);
  });

  it("generates ids from Web Crypto when the store is built without an id source", () => {
    stubWebCryptoBytes();
    const state = baseState();
    const store = createPlaytestStore({
      random: inDeckOrder,
      clock: deps.clock,
    });
    store.setState({ engine: state, isActive: true });

    store.getState().createToken({ ...SOLDIER, count: 1 });

    expect(store.getState().engine?.battlefield.at(-1)?.id).toBe(
      "playtest-token-abcdefghijklmnop"
    );
  });
});
