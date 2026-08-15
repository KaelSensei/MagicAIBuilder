/**
 * Playtest Store — Zustand for playtest session state
 * Isolated from main deck store to avoid pollution
 */

import { create } from "zustand";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { getFormatConfig } from "@/lib/deck/formats";
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
  applyMulligan,
} from "./engine";

/** The deck as dealt at the start, so a reset does not depend on live zones. */
interface PlaytestSetup {
  readonly cards: readonly DeckCard[];
  readonly startingLife: number;
}

/**
 * Flattens a deck into the card pool the engine shuffles.
 *
 * @param deck - the deck being playtested
 * @returns commander, partner and main-deck cards in one list
 */
function buildSetup(deck: Deck): PlaytestSetup {
  const cards: DeckCard[] = [];
  if (deck.commander) cards.push(deck.commander);
  if (deck.partner) cards.push(deck.partner);
  cards.push(...deck.cards);

  return { cards, startingLife: getFormatConfig(deck.format).startingLife };
}

interface PlaytestStore {
  // State
  engine: PlaytestEngine | null;
  isActive: boolean;
  /** Retained so resetPlaytest can deal the original deck again. */
  setup: PlaytestSetup | null;

  // Actions
  startPlaytest: (deck: Deck) => void;
  stopPlaytest: () => void;
  drawCard: () => void;
  mulligan: () => void;
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
  setup: null,

  startPlaytest: (deck: Deck) => {
    const setup = buildSetup(deck);
    const engine = createPlaytestState(setup.cards, {
      lifeTotal: setup.startingLife,
    });
    set({ engine, isActive: true, setup });
  },

  stopPlaytest: () => {
    set({ engine: null, isActive: false, setup: null });
  },

  drawCard: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyDrawCard(state.engine) };
    });
  },

  mulligan: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyMulligan(state.engine) };
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
      // Deal the original deck again. Rebuilding it by concatenating the live
      // zones dropped nothing but carried battlefield state (tapped, counters)
      // back into the library and lost the commander/partner distinction.
      //
      // `engine` is checked too: once a playtest is stopped, resetting must not
      // resurrect it from the retained setup.
      if (!state.setup || !state.engine) return state;

      return {
        engine: createPlaytestState(state.setup.cards, {
          lifeTotal: state.setup.startingLife,
        }),
      };
    });
  },
}));
