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
  const nextPhase = PHASES[currentIndex + 1] as Phase;
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
  const newHistory = [
    ...state.lifeHistory,
    {
      turn: state.turn,
      phase: state.phase,
      timestamp: Date.now(),
      delta: -amount,
      description,
    } as LifeHistoryEntry,
  ];

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
  const newHistory = [
    ...state.lifeHistory,
    {
      turn: state.turn,
      phase: state.phase,
      timestamp: Date.now(),
      delta: amount,
      description: "heal",
    } as LifeHistoryEntry,
  ];

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
  from: "hand" | "library" | "battlefield" | "graveyard" | "exile",
  to: "hand" | "library" | "battlefield" | "graveyard" | "exile"
): PlaytestEngine {
  // Find card in source zone
  const sourceZone = getZone(state, from);
  const cardIndex = sourceZone.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = sourceZone[cardIndex];

  // Remove from source
  const newFromZone = sourceZone.filter((_, i) => i !== cardIndex);

  // Add to destination (wrap in BattlefieldCard if going to battlefield)
  const newToZone =
    to === "battlefield"
      ? [
          ...getZone(state, to),
          {
            ...(card as DeckCard),
            tapped: false,
            counters: 0,
          } as BattlefieldCard,
        ]
      : [...getZone(state, to), card];

  // Build updates object — handle both from and to zones
  const updates: Record<string, readonly (DeckCard | BattlefieldCard)[]> = {};

  // Remove from source zone
  if (from === "hand") updates.hand = newFromZone;
  if (from === "library") updates.library = newFromZone;
  if (from === "battlefield") updates.battlefield = newFromZone;
  if (from === "graveyard") updates.graveyard = newFromZone;
  if (from === "exile") updates.exile = newFromZone;

  // Add to destination zone
  if (to === "hand") updates.hand = newToZone;
  if (to === "library") updates.library = newToZone;
  if (to === "battlefield") updates.battlefield = newToZone;
  if (to === "graveyard") updates.graveyard = newToZone;
  if (to === "exile") updates.exile = newToZone;

  return pushHistory(state, updates as Partial<PlaytestEngine>);
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
function getZone(
  state: PlaytestEngine,
  zone: "hand" | "library" | "battlefield" | "graveyard" | "exile"
): readonly (DeckCard | BattlefieldCard)[] {
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
  }
}

/**
 * Create a new state with updates, push old state to undo history (max 10 entries).
 */
function pushHistory(
  state: PlaytestEngine,
  updates: Partial<PlaytestEngine>
): PlaytestEngine {
  const newState: PlaytestEngine = {
    ...state,
    ...updates,
  };

  // Push to undo history, limit to 10
  const newHistory = [
    { timestamp: Date.now(), state } as UndoHistoryEntry,
    ...state.history,
  ].slice(0, 10);

  return {
    ...newState,
    history: newHistory,
  };
}
