/**
 * Playtest Store — Zustand for playtest session state
 * Isolated from main deck store to avoid pollution
 */

import { create } from "zustand";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { getFormatConfig } from "@/lib/deck/formats";
import { randomAlphanumericId, randomIntBelow } from "@/lib/crypto-random";
import type { TokenLibraryEntry } from "@/lib/deck/token-library";
import type { CardZone, PlaytestEngine } from "./engine";
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
  applyBottomCards,
  applyCreateCardCopy,
  applyCreateToken,
  applyRollDie,
  applyAddActionLogEntry,
  applyRecordMana,
  applyEditActionLogEntry,
  applyRemoveActionLogEntry,
} from "./engine";

/** The deck as dealt at the start, so a reset does not depend on live zones. */
interface PlaytestSetup {
  /** One entry per physical card the engine shuffles into the library. */
  readonly cards: readonly DeckCard[];
  /** Commanders, which start in the command zone instead (CR 903.6). */
  readonly commandZone: readonly DeckCard[];
  readonly startingLife: number;
  readonly firstMulliganFree: boolean;
}

/**
 * Turns a deck row into the physical cards it stands for.
 *
 * Zones find, tap and key cards by id, so every copy needs its own: the first
 * keeps the row's id and each further copy gets `<row id>#<copy number>`.
 *
 * @param card - a deck row holding `quantity` copies
 * @returns one single-copy card per physical copy
 */
function physicalCopies(card: DeckCard): readonly DeckCard[] {
  return Array.from({ length: card.quantity }, (_, index) => ({
    ...card,
    id: index === 0 ? card.id : `${card.id}#${index + 1}`,
    quantity: 1,
  }));
}

/**
 * Splits a deck into the library the engine shuffles and the command zone.
 *
 * `deck.cards` also holds the sideboard and the cards being considered; only
 * the main deck is dealt. A format without a command zone shuffles any
 * commander slot into the library, as it always has.
 *
 * @param deck - the deck being playtested
 * @returns the library cards, the commanders and the format's starting rules
 */
function buildSetup(deck: Deck): PlaytestSetup {
  const { hasCommander, startingLife, firstMulliganFree } = getFormatConfig(deck.format);
  const commanders = [deck.commander, deck.partner].filter(
    (card): card is DeckCard => card !== null
  );
  const mainDeck = deck.cards
    .filter((card) => card.zone === "main")
    .flatMap(physicalCopies);

  return hasCommander
    ? { cards: mainDeck, commandZone: commanders, startingLife, firstMulliganFree }
    : { cards: [...commanders, ...mainDeck], commandZone: [], startingLife, firstMulliganFree };
}

/**
 * Deals a fresh game from the retained setup.
 *
 * @param setup - the deck and the format's starting rules
 * @returns a new engine with the format's life total, mulligan rule and command zone
 */
function dealFrom(setup: PlaytestSetup): PlaytestEngine {
  return createPlaytestState(setup.cards, {
    lifeTotal: setup.startingLife,
    firstMulliganFree: setup.firstMulliganFree,
    commandZone: setup.commandZone,
  });
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

export const usePlaytestStore = create<PlaytestStore>((set) => ({
  engine: null,
  isActive: false,
  setup: null,

  startPlaytest: (deck: Deck) => {
    const setup = buildSetup(deck);
    set({ engine: dealFrom(setup), isActive: true, setup });
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

  bottomCards: (cardIds) => {
    set((state) => {
      if (!state.engine) return state;
      return { engine: applyBottomCards(state.engine, cardIds) };
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

  createCardCopy: (cardId: string) => {
    set((state) => {
      if (!state.engine) return state;
      const copyId = `playtest-copy-${randomAlphanumericId(16)}`;
      return { engine: applyCreateCardCopy(state.engine, cardId, copyId) };
    });
  },

  createToken: (token: TokenLibraryEntry) => {
    set((state) => {
      if (!state.engine) return state;
      const tokenId = `playtest-token-${randomAlphanumericId(16)}`;
      return { engine: applyCreateToken(state.engine, token, tokenId) };
    });
  },

  rollDie: (sides: number) => {
    set((state) => {
      if (!state.engine) return state;
      return {
        engine: applyRollDie(state.engine, sides, randomIntBelow(sides) + 1),
      };
    });
  },

  addLogEntry: (description: string) => {
    set((state) =>
      state.engine
        ? { engine: applyAddActionLogEntry(state.engine, description) }
        : state
    );
  },

  recordMana: (amount: number) => {
    set((state) => state.engine
      ? { engine: applyRecordMana(state.engine, amount) }
      : state);
  },

  editLogEntry: (entryId: number, description: string) => {
    set((state) =>
      state.engine
        ? { engine: applyEditActionLogEntry(state.engine, entryId, description) }
        : state
    );
  },

  removeLogEntry: (entryId: number) => {
    set((state) =>
      state.engine
        ? { engine: applyRemoveActionLogEntry(state.engine, entryId) }
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

      return { engine: dealFrom(state.setup) };
    });
  },
}));
