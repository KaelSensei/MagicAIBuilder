"use client";

/**
 * The save step of the AI deck wizard: turns a finished build into a stored deck.
 *
 * Deck building context. Kept out of `DeckWizard.tsx` so the wizard holds the questions and the
 * screens, and this hook holds the writes: create the deck, activate it, resolve the commander,
 * import the cards, then show what could not be added, or the build's corrections, or open the
 * deck.
 *
 * When the server cannot create the deck, the built deck is held so the player can save it again:
 * a fresh build would cost another AI build from the player's allowance and another model call.
 * Each built deck gets one idempotency key, and every attempt to create it sends that key: when the
 * server stored the deck but its answer was lost, saving again answers the stored deck instead of
 * creating a second one (#1855). Only the creation is retried. A failure once the deck exists stops
 * on that deck instead (`unfinishedDeck`): the player opens it to finish it by hand, and nothing
 * offers a save that would store a second deck (I-02).
 *
 * @module deck/use-built-deck-save
 */
import { useCallback, useState } from "react";
import { countCopies } from "@/hooks/useAIDeckBuild";
import type { BuildResult } from "@/hooks/useAIDeckBuild";
import { useDeckStore, type DeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
import {
  collapseEntries,
  importCardsInBatches,
  tryResolveCommander,
} from "./built-deck-import";

/** A finished build and the name its deck is stored under. */
export interface BuiltDeck {
  readonly name: string;
  readonly result: BuildResult;
}

/** A stored deck the server's card-data check changed: the player reads the changes before it opens. */
export interface CorrectedDeck {
  readonly deckId: string;
  readonly corrections: BuildResult["corrections"];
}

/**
 * A stored deck the save step could not finish: the player opens it and completes it by hand.
 * Offered instead of a new save, which would store a second deck.
 */
export interface UnfinishedDeck {
  readonly deckId: string;
  /** Copies the import could not add, or null when a step threw before they could be counted. */
  readonly cardsNotAdded: number | null;
}

/** A built deck and the idempotency key every attempt to create it sends. */
interface DeckToCreate {
  readonly deck: BuiltDeck;
  readonly idempotencyKey: string;
}

/** What the wizard reads from, and asks of, the save step. */
export interface BuiltDeckSave {
  /** Copies written to the deck so far. */
  readonly importedCount: number;
  /** Copies the import will write; 0 until the import starts. */
  readonly importTotal: number;
  /** Set once a corrected deck is stored; the wizard shows its corrections. */
  readonly correctedDeck: CorrectedDeck | null;
  /** Set once a stored deck could not be filled; the wizard offers to open it. */
  readonly unfinishedDeck: UnfinishedDeck | null;
  /** True while a built deck the server could not create waits for `retry`. */
  readonly saveFailed: boolean;
  /**
   * Stores the built deck, then calls `onComplete` with its id, unless it carries corrections or
   * could not be filled. Never throws. When the server cannot create the deck, it holds the deck
   * and sets `saveFailed`; when the deck was created but a later step failed, it sets
   * `unfinishedDeck`.
   */
  readonly save: (deck: BuiltDeck) => Promise<void>;
  /**
   * Saves the held deck again: the same name, cards, commander and corrections, with no new build.
   * Does nothing when no deck is held. Never throws, as `save`.
   */
  readonly retry: () => Promise<void>;
  /** Forgets the progress and the corrected, unfinished and held decks, for a fresh build. */
  readonly reset: () => void;
}

/** Copies an import has written, of the copies it will write. */
interface ImportProgress {
  readonly importedCount: number;
  /** 0 until an import starts. */
  readonly importTotal: number;
  /** Counts a new import of `total` copies from zero; `start(0)` clears the count. */
  readonly start: (total: number) => void;
  readonly setImportedCount: (count: number) => void;
}

/**
 * Counts the copies of the import. Importing 99 cards is ~65 serialized round trips; without a
 * counter the dialog looks frozen for the whole minute. `start` keeps one identity, so the save
 * step's `reset` does too: the wizard resets on open, once.
 */
function useImportProgress(): ImportProgress {
  const [importedCount, setImportedCount] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const start = useCallback((total: number) => {
    setImportTotal(total);
    setImportedCount(0);
  }, []);
  return { importedCount, importTotal, start, setImportedCount };
}

/** The deck store's actions that fill a created deck, and the counter of its import. */
interface DeckFill extends Pick<
  DeckStore,
  "setActiveDeck" | "setCommander" | "addDeckCard"
> {
  readonly progress: ImportProgress;
}

/**
 * Fills a created deck: opens it, sets the build's commander, then imports its cards.
 *
 * @returns the copies the import could not add
 * @throws what a store action throws; a commander that cannot be set and a card batch that fails
 * are caught by `built-deck-import.ts` instead
 */
async function fillCreatedDeck(
  deckId: string,
  result: BuildResult,
  { setActiveDeck, setCommander, addDeckCard, progress }: DeckFill
): Promise<number> {
  await setActiveDeck(deckId);

  // Read the commander off the build result, not off the build hook's
  // state: the caller's closure holds the render-time snapshot.
  if (result.commander) {
    await tryResolveCommander(result.commander, setCommander);
  }

  progress.start(countCopies(result.cards));
  const { copiesNotAdded } = await importCardsInBatches(
    collapseEntries(result.cards),
    addDeckCard,
    progress.setImportedCount
  );
  return copiesNotAdded;
}

/**
 * Holds the save step's progress and runs it.
 *
 * @param onComplete - Opens the stored deck
 */
export function useBuiltDeckSave(
  onComplete: (deckId: string) => void
): BuiltDeckSave {
  const { createDeck, setActiveDeck, addDeckCard, setCommander } =
    useDeckStore();
  const progress = useImportProgress();
  const { start: startImport } = progress;
  const [correctedDeck, setCorrectedDeck] = useState<CorrectedDeck | null>(
    null
  );
  const [unsavedDeck, setUnsavedDeck] = useState<DeckToCreate | null>(null);
  const [unfinishedDeck, setUnfinishedDeck] = useState<UnfinishedDeck | null>(
    null
  );

  /** The new deck's id, or null when the server refused it and the deck is now held. */
  const createOrHold = async (
    attempt: DeckToCreate
  ): Promise<string | null> => {
    try {
      return await createDeck(attempt.deck.name, {
        isAIGenerated: true,
        idempotencyKey: attempt.idempotencyKey,
      });
    } catch (err) {
      logger.error("Deck create error", "DeckWizard", err);
      setUnsavedDeck(attempt);
      return null;
    }
  };

  const fill = async (deckId: string, result: BuildResult): Promise<void> => {
    const copiesNotAdded = await fillCreatedDeck(deckId, result, {
      setActiveDeck,
      setCommander,
      addDeckCard,
      progress,
    });

    // An incomplete deck says so before its corrections: the player has cards to add by hand.
    if (copiesNotAdded > 0) {
      setUnfinishedDeck({ deckId, cardsNotAdded: copiesNotAdded });
    } else if (result.corrections.length > 0) {
      setCorrectedDeck({ deckId, corrections: result.corrections });
    } else {
      onComplete(deckId);
    }
  };

  const store = async (attempt: DeckToCreate): Promise<void> => {
    setUnsavedDeck(null);
    const deckId = await createOrHold(attempt);
    if (deckId === null) return;
    // The deck exists from here on, so no failure may reach the wizard's "Try
    // again": a new build would store a second deck. The error stays in the log.
    try {
      await fill(deckId, attempt.deck.result);
    } catch (err) {
      logger.error("Built deck fill error", "DeckWizard", err);
      setUnfinishedDeck({ deckId, cardsNotAdded: null });
    }
  };

  // A new build is a new deck, so it gets a new key; a retry resends the held one.
  const save = (deck: BuiltDeck): Promise<void> =>
    store({ deck, idempotencyKey: crypto.randomUUID() });

  const retry = (): Promise<void> =>
    unsavedDeck ? store(unsavedDeck) : Promise.resolve();

  const reset = useCallback(() => {
    startImport(0);
    setCorrectedDeck(null);
    setUnsavedDeck(null);
    setUnfinishedDeck(null);
  }, [startImport]);

  return {
    importedCount: progress.importedCount,
    importTotal: progress.importTotal,
    correctedDeck,
    unfinishedDeck,
    saveFailed: unsavedDeck !== null,
    save,
    retry,
    reset,
  };
}
