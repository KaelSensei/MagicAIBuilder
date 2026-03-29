/**
 * Playtest Engine — Pure functions for game state management
 * Zero framework dependencies. All state transitions are immutable and reversible.
 */

import type { DeckCard } from "@/lib/deck/types";

// ─── Constants ─────────────────────────────────────────────────────────────
export const STARTING_LIFE = 40;

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

// ─── Types ────────────────────────────────────────────────────────────────
/**
 * A card on the battlefield with state (tapped, counters).
 */
export interface BattlefieldCard extends DeckCard {
  readonly tapped: boolean;
  readonly counters: number;
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
  const hand = shuffled.slice(0, 7);
  const library = shuffled.slice(7);

  return {
    turn: 1,
    phase: "Draw" as const,
    lifeTotal: overrides.lifeTotal ?? STARTING_LIFE,
    lifeHistory: [],
    isGameOver: false,
    hand,
    library,
    battlefield: [],
    graveyard: [],
    exile: [],
    history: [],
    ...overrides,
  };
}

// ─── Shuffle ──────────────────────────────────────────────────────────────
function shuffleCards<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
  });
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
    });
  }

  // Advance to next phase
  const nextPhase = PHASES[currentIndex + 1];
  if (nextPhase === undefined) return state;
  return pushHistory(state, { phase: nextPhase });
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
  });
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
  });
}

// ─── Tap / untap ──────────────────────────────────────────────────────────
export function applyTap(state: PlaytestEngine, cardId: string): PlaytestEngine {
  const permanent = state.battlefield.find((c) => c.id === cardId);
  if (!permanent) return state;

  const updated = state.battlefield.map((c) =>
    c.id === cardId ? { ...c, tapped: !c.tapped } : c
  );

  return pushHistory(state, { battlefield: updated });
}

export function applyUntapAll(state: PlaytestEngine): PlaytestEngine {
  const untapped = state.battlefield.map((p) => ({ ...p, tapped: false }));
  return pushHistory(state, { battlefield: untapped });
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

  return pushHistory(state, updates);
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

  return pushHistory(state, { battlefield: updated });
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
  updates: PlaytestEnginePatch
): PlaytestEngine {
  const newState: PlaytestEngine = {
    ...state,
    ...updates,
  };

  // Push to undo history, limit to 10
  const historyEntry: UndoHistoryEntry = { timestamp: Date.now(), state };
  const newHistory = [historyEntry, ...state.history].slice(0, 10);

  return {
    ...newState,
    history: newHistory,
  };
}
