/**
 * Playtest Store — Zustand for playtest session state
 * Isolated from main deck store to avoid pollution
 */

import { create } from "zustand";
import type { Deck } from "@/lib/deck/types";
import type { PlaytestEngine } from "./engine";
import {
  createPlaytestState,
  applyDrawCard,
  applyNextPhase,
  applyNextTurn,
  applyDamage,
  applyHeal,
  applyTap,
  applyUntapAll,
  applyMoveToZone,
  applyUndo,
  applyAddCounter,
} from "./engine";

interface PlaytestStore {
  // State
  engine: PlaytestEngine | null;
  isActive: boolean;

  // Actions
  startPlaytest: (deck: Deck) => void;
  stopPlaytest: () => void;
  drawCard: () => void;
  nextPhase: () => void;
  nextTurn: () => void;
  damage: (amount: number, description?: string) => void;
  heal: (amount: number) => void;
  tap: (cardId: string) => void;
  untapAll: () => void;
  moveToZone: (
    cardId: string,
    from: "hand" | "library" | "battlefield" | "graveyard" | "exile",
    to: "hand" | "library" | "battlefield" | "graveyard" | "exile"
  ) => void;
  addCounter: (cardId: string, amount: number) => void;
  undo: () => void;
  resetPlaytest: () => void;
}

export const usePlaytestStore = create<PlaytestStore>((set) => ({
  engine: null,
  isActive: false,

  startPlaytest: (deck: Deck) => {
    // Expand deck into flat array of cards
    const cards = [];
    if (deck.commander) cards.push(deck.commander);
    if (deck.partner) cards.push(deck.partner);
    cards.push(...deck.cards);

    const engine = createPlaytestState(cards);
    set({ engine, isActive: true });
  },

  stopPlaytest: () => {
    set({ engine: null, isActive: false });
  },

  drawCard: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyDrawCard(state.engine) };
    });
  },

  nextPhase: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyNextPhase(state.engine) };
    });
  },

  nextTurn: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyNextTurn(state.engine) };
    });
  },

  damage: (amount: number, description = "damage") => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyDamage(state.engine, amount, description) };
    });
  },

  heal: (amount: number) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyHeal(state.engine, amount) };
    });
  },

  tap: (cardId: string) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyTap(state.engine, cardId) };
    });
  },

  untapAll: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyUntapAll(state.engine) };
    });
  },

  moveToZone: (cardId, from, to) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyMoveToZone(state.engine, cardId, from, to) };
    });
  },

  addCounter: (cardId: string, amount: number) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyAddCounter(state.engine, cardId, amount) };
    });
  },

  undo: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyUndo(state.engine) };
    });
  },

  resetPlaytest: () => {
    set((state) => {
      if (!state.engine) return state;
      // Restart with same deck
      const deck = {
        cards: [
          ...state.engine.hand,
          ...state.engine.library,
          ...state.engine.battlefield,
          ...state.engine.graveyard,
          ...state.engine.exile,
        ],
      };
      const engine = createPlaytestState(deck.cards);
      return { engine };
    });
  },
}));
