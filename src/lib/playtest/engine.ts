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
  readonly kind?: "draw" | "cardSeen" | "mana" | "life" | "counter";
  readonly amount?: number;
  readonly lifeDelta?: number;
  readonly counterDelta?: number;
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
  }, `Lost ${amount} life: ${description}`, { kind: "life", lifeDelta: -amount });
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
  }, `Gained ${amount} life`, { kind: "life", lifeDelta: amount });
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

/**
 * Pulls one card out of a zone list.
 *
 * @param cards - zone contents
 * @param cardId - card to remove
 * @returns the card and the list without it, or null when it is absent
 */
function takeCard<T extends { readonly id: string }>(
  cards: readonly T[],
  cardId: string
): { readonly card: T; readonly rest: readonly T[] } | null {
  const cardIndex = cards.findIndex((entry) => entry.id === cardId);
  if (cardIndex === -1) return null;
  const card = cards[cardIndex];
  if (card === undefined) return null;
  return { card, rest: cards.filter((_, index) => index !== cardIndex) };
}

/**
 * Removes a card from one playtest zone.
 *
 * @param state - current engine state
 * @param zone - zone the card leaves
 * @param cardId - card to remove
 * @returns the card and a patch of that zone, or null when it is absent
 */
function takeFromZone(
  state: PlaytestEngine,
  zone: CardZone,
  cardId: string
): { readonly card: DeckCard | BattlefieldCard; readonly updates: PlaytestEnginePatch } | null {
  switch (zone) {
    case "hand": {
      const taken = takeCard(state.hand, cardId);
      return taken ? { card: taken.card, updates: { hand: taken.rest } } : null;
    }
    case "library": {
      const taken = takeCard(state.library, cardId);
      return taken ? { card: taken.card, updates: { library: taken.rest } } : null;
    }
    case "battlefield": {
      const taken = takeCard(state.battlefield, cardId);
      return taken ? { card: taken.card, updates: { battlefield: taken.rest } } : null;
    }
    case "graveyard": {
      const taken = takeCard(state.graveyard, cardId);
      return taken ? { card: taken.card, updates: { graveyard: taken.rest } } : null;
    }
    case "exile": {
      const taken = takeCard(state.exile, cardId);
      return taken ? { card: taken.card, updates: { exile: taken.rest } } : null;
    }
    default: {
      const _exhaustive: never = zone;
      return _exhaustive;
    }
  }
}

/**
 * True when a playtest-only copy is leaving the battlefield, where it ceases to exist.
 *
 * @param card - card being moved
 * @param destination - zone it would enter
 * @returns whether the copy should be removed instead of moved
 */
function isSessionCopyLeavingPlay(
  card: DeckCard | BattlefieldCard,
  destination: CardZone
): boolean {
  return "isSessionCopy" in card && card.isSessionCopy === true && destination !== "battlefield";
}

/**
 * Appends a card to a destination zone on the patch.
 *
 * The destination is read from the original state, matching a move that
 * replaces the source list and then appends to the destination list.
 *
 * @param state - state before the move
 * @param updates - patch already holding the source-zone removal
 * @param zone - zone the card enters
 * @param card - card to append
 */
function placeInZone(
  state: PlaytestEngine,
  updates: PlaytestEnginePatch,
  zone: CardZone,
  card: DeckCard | BattlefieldCard
): void {
  switch (zone) {
    case "hand":
      updates.hand = [...state.hand, toDeckCard(card)];
      return;
    case "library":
      updates.library = [...state.library, toDeckCard(card)];
      return;
    case "battlefield":
      updates.battlefield = [...state.battlefield, toBattlefieldCard(card)];
      return;
    case "graveyard":
      updates.graveyard = [...state.graveyard, toDeckCard(card)];
      return;
    case "exile":
      updates.exile = [...state.exile, toDeckCard(card)];
      return;
    default: {
      const _exhaustive: never = zone;
      updates.hand = _exhaustive;
    }
  }
}

/**
 * Moves one card between playtest zones.
 *
 * A session copy that leaves the battlefield is removed instead of relocated.
 * A card taken from the library is recorded as seen.
 *
 * @param state - current engine state
 * @param cardId - card to move
 * @param from - zone the card leaves
 * @param to - zone the card enters
 * @returns the next engine state
 */
export function applyMoveToZone(
  state: PlaytestEngine,
  cardId: string,
  from: CardZone,
  to: CardZone
): PlaytestEngine {
  const removed = takeFromZone(state, from, cardId);
  if (!removed) return state;

  const { card, updates } = removed;
  if (isSessionCopyLeavingPlay(card, to)) {
    return pushHistory(state, updates, `Removed ${card.name} from the battlefield`);
  }

  placeInZone(state, updates, to, card);
  const description = `Moved ${card.name} from ${from} to ${to}`;
  if (from === "library") {
    return pushHistory(state, updates, description, { kind: "cardSeen" });
  }
  return pushHistory(state, updates, description);
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
    actionLog: state.actionLog.map((entry) => {
      if (entry.id !== entryId) return entry;
      return {
        ...entry,
        description: normalized,
        kind: undefined,
        amount: undefined,
        lifeDelta: undefined,
        counterDelta: undefined,
      };
    }),
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
    `${amount >= 0 ? "Added" : "Removed"} a counter ${amount >= 0 ? "to" : "from"} ${permanent.name}`,
    { kind: "counter", counterDelta: amount }
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
  evidence?: Partial<
    Pick<
      PlaytestActionLogEntry,
      "kind" | "amount" | "lifeDelta" | "counterDelta" | "turn" | "phase"
    >
  >
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
          ...(evidence?.lifeDelta !== undefined ? { lifeDelta: evidence.lifeDelta } : {}),
          ...(evidence?.counterDelta !== undefined ? { counterDelta: evidence.counterDelta } : {}),
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
