/**
 * Playtest Engine — Pure functions for game state management
 * Zero framework dependencies. All state transitions are immutable and reversible.
 */

import type { DeckCard } from "@/lib/deck/types";
import { randomIntBelow } from "@/lib/crypto-random";

// ─── Constants ─────────────────────────────────────────────────────────────
/** Commander default; per-format totals live in FORMAT_CONFIG.startingLife. */
export const STARTING_LIFE = 40;

/** Opening hand size before any mulligan. */
export const OPENING_HAND_SIZE = 7;

/** Mulliganing past this leaves no playable hand, so the action stops here. */
export const MAX_MULLIGANS = 6;

export const PHASES = [
  "Untap",
  "Upkeep",
  "Draw",
  "Main1",
  "Combat",
  "Main2",
  "End",
] as const;

export type Phase = (typeof PHASES)[number];

/** Library / hand / battlefield / GY / exile zone id (playtest engine). */
export type CardZone = "hand" | "library" | "battlefield" | "graveyard" | "exile";

export interface PlaytestTokenSpec {
  readonly name: string;
  readonly power: string | null;
  readonly colors: readonly string[];
  readonly kind: "token" | "emblem";
}

// ─── Types ────────────────────────────────────────────────────────────────
/**
 * A card on the battlefield with state (tapped, counters).
 */
export interface BattlefieldCard extends DeckCard {
  readonly tapped: boolean;
  readonly counters: number;
  /** True for a playtest-only copy that is not part of the saved deck. */
  readonly isSessionCopy?: boolean;
}

/**
 * A damage event for the life history log.
 */
export interface LifeHistoryEntry {
  readonly turn: number;
  readonly phase: Phase;
  readonly timestamp: number;
  readonly delta: number; // +/- amount
  readonly description: string; // e.g., "3 damage (attack)", "-5 (heal)"
}

export interface DiceRoll {
  readonly sides: number;
  readonly result: number;
}

export interface PlaytestActionLogEntry {
  readonly id: number;
  readonly turn: number;
  readonly phase: Phase;
  readonly description: string;
  readonly kind?: "draw" | "cardSeen" | "mana";
  readonly amount?: number;
}

/**
 * An action for undo/redo.
 */
export interface UndoHistoryEntry {
  readonly timestamp: number;
  readonly state: PlaytestEngine;
}

/**
 * Complete playtest game state.
 */
export interface PlaytestEngine {
  // Turn & phase
  readonly turn: number;
  readonly phase: Phase;

  /** Mulligans taken for the opening hand. */
  readonly mulliganCount: number;

  // Life
  readonly lifeTotal: number;
  readonly lifeHistory: readonly LifeHistoryEntry[];
  readonly isGameOver: boolean;

  // Zones
  readonly hand: readonly DeckCard[];
  readonly library: readonly DeckCard[];
  readonly battlefield: readonly BattlefieldCard[];
  readonly graveyard: readonly DeckCard[];
  readonly exile: readonly DeckCard[];
  readonly diceRolls: readonly DiceRoll[];
  readonly actionLog: readonly PlaytestActionLogEntry[];
  readonly nextActionId: number;

  // Undo
  readonly history: readonly UndoHistoryEntry[];
}

/** Writable patch for immutable engine updates (undo stack). */
type PlaytestEnginePatch = {
  -readonly [K in keyof PlaytestEngine]?: PlaytestEngine[K];
};

// ─── Initial State ────────────────────────────────────────────────────────
/**
 * Create a fresh playtest state: shuffle deck, draw 7 cards.
 */
export function createPlaytestState(
  deckCards: readonly DeckCard[],
  overrides: Partial<PlaytestEngine> = {}
): PlaytestEngine {
  // Fisher-Yates shuffle
  const shuffled = shuffleCards([...deckCards]);

  // Draw 7, rest to library
  const hand = shuffled.slice(0, OPENING_HAND_SIZE);
  const library = shuffled.slice(OPENING_HAND_SIZE);

  return {
    turn: 1,
    phase: "Draw" as const,
    mulliganCount: 0,
    lifeTotal: overrides.lifeTotal ?? STARTING_LIFE,
    lifeHistory: [],
    isGameOver: false,
    hand,
    library,
    battlefield: [],
    graveyard: [],
    exile: [],
    diceRolls: [],
    actionLog: [],
    nextActionId: 1,
    history: [],
    ...overrides,
  };
}

// ─── Shuffle ──────────────────────────────────────────────────────────────
function shuffleCards<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomIntBelow(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Draw card ────────────────────────────────────────────────────────────
export function applyDrawCard(state: PlaytestEngine): PlaytestEngine {
  if (state.library.length === 0) return state;

  const [drawn, ...rest] = state.library;
  return pushHistory(state, {
    hand: [...state.hand, drawn],
    library: rest,
  }, "Drew a card", { kind: "draw" });
}

// ─── Mulligan ─────────────────────────────────────────────────────────────
/**
 * Take a London mulligan: shuffle hand and library back together, then keep
 * one card fewer for each mulligan taken.
 *
 * London formally draws seven and bottoms N chosen cards. Goldfishing offers no
 * opponent and no choice to make, and keeping `7 - N` random cards is the same
 * distribution — so the bottoming step is collapsed rather than shown.
 *
 * @param state - current game state
 * @returns the state with a fresh, smaller opening hand
 */
export function applyMulligan(state: PlaytestEngine): PlaytestEngine {
  if (state.mulliganCount >= MAX_MULLIGANS) return state;

  const mulliganCount = state.mulliganCount + 1;
  const shuffled = shuffleCards([...state.hand, ...state.library]);
  const handSize = OPENING_HAND_SIZE - mulliganCount;

  return pushHistory(state, {
    mulliganCount,
    hand: shuffled.slice(0, handSize),
    library: shuffled.slice(handSize),
  }, `Mulliganed to ${handSize} cards`);
}

// ─── Phase progression ────────────────────────────────────────────────────
export function applyNextPhase(state: PlaytestEngine): PlaytestEngine {
  const currentIndex = PHASES.indexOf(state.phase);
  const isLastPhase = currentIndex === PHASES.length - 1;

  if (isLastPhase) {
    // End → Untap of next turn (+ untap all permanents)
    const untappedBattlefield = state.battlefield.map((p) => ({
      ...p,
      tapped: false,
    }));

    return pushHistory(state, {
      turn: state.turn + 1,
      phase: "Untap" as const,
      battlefield: untappedBattlefield,
    }, `Started turn ${state.turn + 1}`, { turn: state.turn + 1, phase: "Untap" });
  }

  // Advance to next phase
  const nextPhase = PHASES[currentIndex + 1];
  if (nextPhase === undefined) return state;
  return pushHistory(state, { phase: nextPhase }, `Advanced to ${nextPhase}`);
}

// ─── Next turn ────────────────────────────────────────────────────────────
export function applyNextTurn(state: PlaytestEngine): PlaytestEngine {
  // Untap all permanents
  const untappedBattlefield = state.battlefield.map((p) => ({
    ...p,
    tapped: false,
  }));

  // Draw a card if library not empty
  let newHand = state.hand;
  let newLibrary = state.library;

  if (state.library.length > 0) {
    const [drawn, ...rest] = state.library;
    newHand = [...state.hand, drawn];
    newLibrary = rest;
  }

  return pushHistory(state, {
    turn: state.turn + 1,
    phase: "Draw" as const,
    hand: newHand,
    library: newLibrary,
    battlefield: untappedBattlefield,
  }, state.library.length > 0
    ? `Started turn ${state.turn + 1} and drew a card`
    : `Started turn ${state.turn + 1}`, {
    turn: state.turn + 1,
    phase: "Draw",
    ...(state.library.length > 0 ? { kind: "draw" as const } : {}),
  });
}

// ─── Damage / heal ────────────────────────────────────────────────────────
export function applyDamage(
  state: PlaytestEngine,
  amount: number,
  description = "damage"
): PlaytestEngine {
  const newLife = state.lifeTotal - amount;
  const entry: LifeHistoryEntry = {
    turn: state.turn,
    phase: state.phase,
    timestamp: Date.now(),
    delta: -amount,
    description,
  };
  const newHistory = [...state.lifeHistory, entry];

  return pushHistory(state, {
    lifeTotal: newLife,
    lifeHistory: newHistory,
    isGameOver: newLife <= 0,
  }, `Lost ${amount} life: ${description}`);
}

export function applyHeal(
  state: PlaytestEngine,
  amount: number
): PlaytestEngine {
  const newLife = state.lifeTotal + amount;
  const entry: LifeHistoryEntry = {
    turn: state.turn,
    phase: state.phase,
    timestamp: Date.now(),
    delta: amount,
    description: "heal",
  };
  const newHistory = [...state.lifeHistory, entry];

  return pushHistory(state, {
    lifeTotal: newLife,
    lifeHistory: newHistory,
  }, `Gained ${amount} life`);
}

// ─── Tap / untap ──────────────────────────────────────────────────────────
export function applyTap(state: PlaytestEngine, cardId: string): PlaytestEngine {
  const exists = state.battlefield.some((c) => c.id === cardId);
  if (!exists) return state;

  const updated = state.battlefield.map((c) =>
    c.id === cardId ? { ...c, tapped: !c.tapped } : c
  );

  const permanent = state.battlefield.find((card) => card.id === cardId);
  return pushHistory(
    state,
    { battlefield: updated },
    `${permanent?.tapped ? "Untapped" : "Tapped"} ${permanent?.name ?? "card"}`
  );
}

export function applyUntapAll(state: PlaytestEngine): PlaytestEngine {
  const untapped = state.battlefield.map((p) => ({ ...p, tapped: false }));
  return pushHistory(state, { battlefield: untapped }, "Untapped all permanents");
}

// ─── Move to zone ─────────────────────────────────────────────────────────
export function applyMoveToZone(
  state: PlaytestEngine,
  cardId: string,
  from: CardZone,
  to: CardZone
): PlaytestEngine {
  const updates: PlaytestEnginePatch = {};
  let card: DeckCard | BattlefieldCard;

  switch (from) {
    case "hand": {
      const zone = state.hand;
      const cardIndex = zone.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return state;
      card = zone[cardIndex];
      updates.hand = zone.filter((_, i) => i !== cardIndex);
      break;
    }
    case "library": {
      const zone = state.library;
      const cardIndex = zone.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return state;
      card = zone[cardIndex];
      updates.library = zone.filter((_, i) => i !== cardIndex);
      break;
    }
    case "battlefield": {
      const zone = state.battlefield;
      const cardIndex = zone.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return state;
      card = zone[cardIndex];
      updates.battlefield = zone.filter((_, i) => i !== cardIndex);
      break;
    }
    case "graveyard": {
      const zone = state.graveyard;
      const cardIndex = zone.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return state;
      card = zone[cardIndex];
      updates.graveyard = zone.filter((_, i) => i !== cardIndex);
      break;
    }
    case "exile": {
      const zone = state.exile;
      const cardIndex = zone.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return state;
      card = zone[cardIndex];
      updates.exile = zone.filter((_, i) => i !== cardIndex);
      break;
    }
    default: {
      const _exhaustive: never = from;
      return _exhaustive;
    }
  }

  // Copies only exist on the battlefield and cease to exist when they leave it.
  if ("isSessionCopy" in card && card.isSessionCopy === true && to !== "battlefield") {
    return pushHistory(state, updates, `Removed ${card.name} from the battlefield`);
  }

  switch (to) {
    case "hand":
      updates.hand = [...state.hand, toDeckCard(card)];
      break;
    case "library":
      updates.library = [...state.library, toDeckCard(card)];
      break;
    case "battlefield":
      updates.battlefield = [...state.battlefield, toBattlefieldCard(card)];
      break;
    case "graveyard":
      updates.graveyard = [...state.graveyard, toDeckCard(card)];
      break;
    case "exile":
      updates.exile = [...state.exile, toDeckCard(card)];
      break;
    default: {
      const _exhaustive: never = to;
      return _exhaustive;
    }
  }

  return pushHistory(state, updates, `Moved ${card.name} from ${from} to ${to}`,
    from === "library" ? { kind: "cardSeen" } : undefined);
}

// ─── Card copies ─────────────────────────────────────────────────────────
export function applyCreateCardCopy(
  state: PlaytestEngine,
  cardId: string,
  copyId: string
): PlaytestEngine {
  if (state.battlefield.some((card) => card.id === copyId)) return state;

  const source = state.battlefield.find((card) => card.id === cardId);
  if (!source) return state;

  const copy: BattlefieldCard = {
    ...source,
    id: copyId,
    quantity: 1,
    tapped: false,
    counters: 0,
    isSessionCopy: true,
  };

  return pushHistory(
    state,
    { battlefield: [...state.battlefield, copy] },
    `Created a copy of ${source.name}`
  );
}

const TOKEN_COLOR_IDENTITIES: Readonly<Record<string, string>> = {
  white: "W",
  blue: "U",
  black: "B",
  red: "R",
  green: "G",
};

export function applyCreateToken(
  state: PlaytestEngine,
  token: PlaytestTokenSpec,
  tokenId: string
): PlaytestEngine {
  if (state.battlefield.some((card) => card.id === tokenId)) return state;

  const name = [token.power, token.name, token.kind === "token" ? "token" : null]
    .filter(Boolean)
    .join(" ");
  const battlefieldToken: BattlefieldCard = {
    id: tokenId,
    scryfallId: tokenId,
    name,
    manaCost: "",
    cmc: 0,
    typeLine:
      token.kind === "emblem" ? "Emblem" : `Token Creature — ${token.name}`,
    oracleText: "",
    colorIdentity: token.colors
      .map((color) => TOKEN_COLOR_IDENTITIES[color.toLowerCase()])
      .filter((color): color is string => color !== undefined),
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: token.kind === "token" ? "creature" : "other",
    power: token.power?.split("/")[0] ?? null,
    toughness: token.power?.split("/")[1] ?? null,
    quantity: 1,
    zone: "main",
    tapped: false,
    counters: 0,
    isSessionCopy: true,
  };

  return pushHistory(state, {
    battlefield: [...state.battlefield, battlefieldToken],
  }, `Created ${name}`);
}

// ─── Dice ────────────────────────────────────────────────────────────────
export function applyRollDie(
  state: PlaytestEngine,
  sides: number,
  result: number
): PlaytestEngine {
  if (!Number.isInteger(sides) || sides < 2) return state;
  if (!Number.isInteger(result) || result < 1 || result > sides) return state;

  return pushHistory(state, {
    diceRolls: [...state.diceRolls, { sides, result }].slice(-10),
  }, `Rolled d${sides}: ${result}`);
}

// ─── Editable action log ─────────────────────────────────────────────────
export function applyAddActionLogEntry(
  state: PlaytestEngine,
  description: string
): PlaytestEngine {
  const normalized = description.trim();
  if (normalized === "") return state;
  return pushHistory(state, {}, normalized);
}

export function applyRecordMana(state: PlaytestEngine, amount: number): PlaytestEngine {
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) return state;
  return pushHistory(state, {}, `Produced ${amount} mana`, { kind: "mana", amount });
}

export function applyEditActionLogEntry(
  state: PlaytestEngine,
  entryId: number,
  description: string
): PlaytestEngine {
  const normalized = description.trim();
  const exists = state.actionLog.some((entry) => entry.id === entryId);
  if (!exists || normalized === "") return state;
  return pushHistory(state, {
    actionLog: state.actionLog.map((entry) =>
      entry.id === entryId
        ? { ...entry, description: normalized, kind: undefined, amount: undefined }
        : entry
    ),
  });
}

export function applyRemoveActionLogEntry(
  state: PlaytestEngine,
  entryId: number
): PlaytestEngine {
  if (!state.actionLog.some((entry) => entry.id === entryId)) return state;
  return pushHistory(state, {
    actionLog: state.actionLog.filter((entry) => entry.id !== entryId),
  });
}

// ─── Counters ─────────────────────────────────────────────────────────────
export function applyAddCounter(
  state: PlaytestEngine,
  cardId: string,
  amount: number
): PlaytestEngine {
  const permanent = state.battlefield.find((c) => c.id === cardId);
  if (!permanent) return state;

  const newCounters = Math.max(0, permanent.counters + amount);
  const updated = state.battlefield.map((c) =>
    c.id === cardId ? { ...c, counters: newCounters } : c
  );

  return pushHistory(
    state,
    { battlefield: updated },
    `${amount >= 0 ? "Added" : "Removed"} a counter ${amount >= 0 ? "to" : "from"} ${permanent.name}`
  );
}

// ─── Undo ────────────────────────────────────────────────────────────────
export function applyUndo(state: PlaytestEngine): PlaytestEngine {
  if (state.history.length === 0) return state;

  const [previous] = state.history;
  return previous.state;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function toDeckCard(card: DeckCard | BattlefieldCard): DeckCard {
  return card;
}

function toBattlefieldCard(card: DeckCard | BattlefieldCard): BattlefieldCard {
  return { ...card, tapped: false, counters: 0 };
}

/**
 * Create a new state with updates, push old state to undo history (max 10 entries).
 */
function pushHistory(
  state: PlaytestEngine,
  updates: PlaytestEnginePatch,
  actionDescription?: string,
  evidence?: Partial<Pick<PlaytestActionLogEntry, "kind" | "amount" | "turn" | "phase">>
): PlaytestEngine {
  const actionLog = actionDescription
    ? [
        ...state.actionLog,
        {
          id: state.nextActionId,
          turn: evidence?.turn ?? state.turn,
          phase: evidence?.phase ?? state.phase,
          description: actionDescription,
          ...(evidence?.kind ? { kind: evidence.kind } : {}),
          ...(evidence?.amount ? { amount: evidence.amount } : {}),
        },
      ]
    : updates.actionLog;
  const newState: PlaytestEngine = {
    ...state,
    ...updates,
    ...(actionLog ? { actionLog } : {}),
    nextActionId: actionDescription ? state.nextActionId + 1 : state.nextActionId,
  };

  // Push to undo history, limit to 10
  const historyEntry: UndoHistoryEntry = { timestamp: Date.now(), state };
  const newHistory = [historyEntry, ...state.history].slice(0, 10);

  return {
    ...newState,
    history: newHistory,
  };
}
