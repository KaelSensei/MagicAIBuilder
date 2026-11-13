/**
 * The playtest session the modal shows: one Zustand store around the pure engine.
 *
 * Context: playtest. The store deals a deck into a game through `deal.ts` (one card per
 * physical copy, commanders in the command zone, CR 903.6), forwards each player action to its
 * engine transition, and keeps the setup so a reset deals the same deck again. It is separate
 * from the deck store, so a game never changes the saved deck.
 *
 * `createPlaytestStore` builds a store whose shuffles, die rolls and timestamps come from the
 * ports it is given; the app uses `usePlaytestStore`, built with the production ports. Copy and
 * token ids come from Web Crypto either way, and never reach the action log.
 *
 * @module playtest/store
 */

import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { Deck } from "@/lib/deck/types";
import { randomAlphanumericId } from "@/lib/crypto-random";
import type { TokenLibraryEntry } from "@/lib/deck/token-library";
import type { CardZone, PlaytestDeps, PlaytestEngine } from "./engine";
import { buildSetup, dealFrom, type PlaytestOptions, type PlaytestSetup } from "./deal";
import {
  defaultPlaytestDeps,
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
  applyBottomCards,
  applyCreateCardCopy,
  applyCreateToken,
  applyRollDie,
  applyAddActionLogEntry,
  applyRecordMana,
  applyEditActionLogEntry,
  applyRemoveActionLogEntry,
} from "./engine";

/** The modal's start screen types its choices with this; the type lives with the deal. */
export type { PlaytestOptions } from "./deal";

interface PlaytestStore {
  // State
  engine: PlaytestEngine | null;
  isActive: boolean;
  /** Retained so resetPlaytest can deal the original deck again. */
  setup: PlaytestSetup | null;

  // Actions
  /** Deals a new session; the options hold only for this session. */
  startPlaytest: (deck: Deck, options?: PlaytestOptions) => void;
  stopPlaytest: () => void;
  drawCard: () => void;
  mulligan: () => void;
  /** Settles a pending mulligan by bottoming these hand cards, in order. */
  bottomCards: (cardIds: readonly string[]) => void;
  nextPhase: () => void;
  nextTurn: () => void;
  damage: (amount: number, description?: string) => void;
  heal: (amount: number) => void;
  tap: (cardId: string) => void;
  untapAll: () => void;
  moveToZone: (cardId: string, from: CardZone, to: CardZone) => void;
  addCounter: (cardId: string, amount: number) => void;
  createCardCopy: (cardId: string) => void;
  createToken: (token: TokenLibraryEntry) => void;
  rollDie: (sides: number) => void;
  addLogEntry: (description: string) => void;
  recordMana: (amount: number) => void;
  editLogEntry: (entryId: number, description: string) => void;
  removeLogEntry: (entryId: number) => void;
  undo: () => void;
  resetPlaytest: () => void;
}

/**
 * Creates a playtest store whose games take their randomness and time from `deps`: the deal
 * and mulligan shuffles, die rolls, and the life and undo timestamps.
 *
 * A test builds its own store with a seeded source to replay a session exactly; each call
 * returns an independent store.
 */
export const createPlaytestStore = (
  deps: PlaytestDeps = defaultPlaytestDeps
): UseBoundStore<StoreApi<PlaytestStore>> => create<PlaytestStore>((set) => ({
  engine: null,
  isActive: false,
  setup: null,

  startPlaytest: (deck: Deck, options: PlaytestOptions = {}) => {
    const setup = buildSetup(deck, options);
    set({ engine: dealFrom(setup, deps), isActive: true, setup });
  },

  stopPlaytest: () => {
    set({ engine: null, isActive: false, setup: null });
  },

  drawCard: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyDrawCard(state.engine, deps) };
    });
  },

  mulligan: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyMulligan(state.engine, deps) };
    });
  },

  bottomCards: (cardIds) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyBottomCards(state.engine, cardIds, deps) };
    });
  },

  nextPhase: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyNextPhase(state.engine, deps) };
    });
  },

  nextTurn: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyNextTurn(state.engine, deps) };
    });
  },

  damage: (amount: number, description = "damage") => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyDamage(state.engine, amount, description, deps) };
    });
  },

  heal: (amount: number) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyHeal(state.engine, amount, deps) };
    });
  },

  tap: (cardId: string) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyTap(state.engine, cardId, deps) };
    });
  },

  untapAll: () => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyUntapAll(state.engine, deps) };
    });
  },

  moveToZone: (cardId, from, to) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyMoveToZone(state.engine, cardId, from, to, deps) };
    });
  },

  addCounter: (cardId: string, amount: number) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyAddCounter(state.engine, cardId, amount, deps) };
    });
  },

  createCardCopy: (cardId: string) => {
    set((state) => {
      if (!state.engine) return state;
      const copyId = `playtest-copy-${randomAlphanumericId(16)}`;
      return { engine: applyCreateCardCopy(state.engine, cardId, copyId, deps) };
    });
  },

  createToken: (token: TokenLibraryEntry) => {
    set((state) => {
      if (!state.engine) return state;
      const tokenId = `playtest-token-${randomAlphanumericId(16)}`;
      return { engine: applyCreateToken(state.engine, token, tokenId, deps) };
    });
  },

  rollDie: (sides: number) => {
    set((state) => {
      if (!state.engine) return state;
      return {
        engine: applyRollDie(
          state.engine,
          sides,
          deps.random.intBelow(sides) + 1,
          deps
        ),
      };
    });
  },

  addLogEntry: (description: string) => {
    set((state) =>
      state.engine
        ? { engine: applyAddActionLogEntry(state.engine, description, deps) }
        : state
    );
  },

  recordMana: (amount: number) => {
    set((state) => state.engine
      ? { engine: applyRecordMana(state.engine, amount, deps) }
      : state);
  },

  editLogEntry: (entryId: number, description: string) => {
    set((state) =>
      state.engine
        ? { engine: applyEditActionLogEntry(state.engine, entryId, description, deps) }
        : state
    );
  },

  removeLogEntry: (entryId: number) => {
    set((state) =>
      state.engine
        ? { engine: applyRemoveActionLogEntry(state.engine, entryId, deps) }
        : state
    );
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

      return { engine: dealFrom(state.setup, deps) };
    });
  },
}));

/** The app's playtest store: Web Crypto shuffles and dice, and the system clock. */
export const usePlaytestStore = createPlaytestStore();
