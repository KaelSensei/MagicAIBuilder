/**
 * The playtest session the modal shows: one Zustand store around the pure engine.
 *
 * Context: playtest. The store deals a deck into a game through `deal.ts` (one card per
 * physical copy, commanders in the command zone, CR 903.6), dispatches each player action as a
 * `PlaytestCommand` to the engine's reducer, and keeps the setup so a reset deals the same deck
 * again. It is separate from the deck store, so a game never changes the saved deck.
 *
 * `dispatch` is the one way a move reaches the engine; the named methods (`drawCard`, `tap`, …)
 * are thin wrappers around it, kept so the components do not change yet. `createPlaytestStore`
 * builds a store whose shuffles, die rolls, timestamps and copy or token ids come from the ports
 * it is given; the app uses `usePlaytestStore`, built with the production ports.
 *
 * @module playtest/store
 */

import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { Deck } from "@/lib/deck/types";
import type { TokenLibraryEntry } from "@/lib/deck/token-library";
import {
  defaultNewId,
  defaultPlaytestCommandDeps,
  reducePlaytest,
  type CardZone,
  type PlaytestCommand,
  type PlaytestCommandDeps,
  type PlaytestDeps,
  type PlaytestEngine,
} from "./engine";
import {
  buildSetup,
  dealFrom,
  type PlaytestOptions,
  type PlaytestSetup,
} from "./deal";

/** The modal's start screen types its choices with this; the type lives with the deal. */
export type { PlaytestOptions } from "./deal";

/**
 * The ports a store is built with. `newId` may be left out by a test that seeds only the shuffle
 * and the clock; the store then names its copies and tokens from Web Crypto, as production does.
 */
export type PlaytestStoreDeps = PlaytestDeps &
  Partial<Pick<PlaytestCommandDeps, "newId">>;

interface PlaytestStore {
  // State
  engine: PlaytestEngine | null;
  isActive: boolean;
  /** Retained so resetPlaytest can deal the original deck again. */
  setup: PlaytestSetup | null;

  // Lifecycle
  /** Deals a new session; the options hold only for this session. */
  startPlaytest: (deck: Deck, options?: PlaytestOptions) => void;
  stopPlaytest: () => void;
  resetPlaytest: () => void;

  // Moves
  /** Applies one move to the current game; nothing happens when no game is running. */
  dispatch: (command: PlaytestCommand) => void;
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
}

/**
 * Creates a playtest store whose games take their randomness, time and ids from `deps`: the
 * deal and mulligan shuffles, die rolls, the life and undo timestamps, and the ids of the copies
 * and tokens the player creates.
 *
 * A test builds its own store with a seeded source to replay a session exactly; each call
 * returns an independent store.
 */
export const createPlaytestStore = (
  deps: PlaytestStoreDeps = defaultPlaytestCommandDeps
): UseBoundStore<StoreApi<PlaytestStore>> => {
  const commandDeps: PlaytestCommandDeps = {
    ...deps,
    newId: deps.newId ?? defaultNewId,
  };

  return create<PlaytestStore>((set, get) => ({
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

    dispatch: (command) => {
      set((state) =>
        state.engine
          ? { engine: reducePlaytest(state.engine, command, commandDeps) }
          : state
      );
    },

    drawCard: () => get().dispatch({ type: "draw" }),
    mulligan: () => get().dispatch({ type: "mulligan" }),
    bottomCards: (cardIds) => get().dispatch({ type: "bottomCards", cardIds }),
    nextPhase: () => get().dispatch({ type: "nextPhase" }),
    nextTurn: () => get().dispatch({ type: "nextTurn" }),
    damage: (amount, description) =>
      get().dispatch({ type: "damage", amount, description }),
    heal: (amount) => get().dispatch({ type: "heal", amount }),
    tap: (cardId) => get().dispatch({ type: "tap", cardId }),
    untapAll: () => get().dispatch({ type: "untapAll" }),
    moveToZone: (cardId, from, to) =>
      get().dispatch({ type: "moveToZone", cardId, from, to }),
    addCounter: (cardId, amount) =>
      get().dispatch({ type: "addCounter", cardId, amount }),
    createCardCopy: (cardId) =>
      get().dispatch({ type: "createCardCopy", cardId }),
    createToken: (token) => get().dispatch({ type: "createToken", token }),
    rollDie: (sides) => get().dispatch({ type: "rollDie", sides }),
    addLogEntry: (description) =>
      get().dispatch({ type: "addLogEntry", description }),
    recordMana: (amount) => get().dispatch({ type: "recordMana", amount }),
    editLogEntry: (entryId, description) =>
      get().dispatch({ type: "editLogEntry", entryId, description }),
    removeLogEntry: (entryId) =>
      get().dispatch({ type: "removeLogEntry", entryId }),
    undo: () => get().dispatch({ type: "undo" }),
  }));
};

/** The app's playtest store: Web Crypto shuffles, dice and ids, and the system clock. */
export const usePlaytestStore = createPlaytestStore();
