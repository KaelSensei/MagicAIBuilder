"use client";

/**
 * The save step of the AI deck wizard: turns a finished build into a stored deck.
 *
 * Deck building context. Kept out of `DeckWizard.tsx` so the wizard holds the questions and the
 * screens, and this hook holds the writes: create the deck, activate it, resolve the commander,
 * import the cards, then either show the build's corrections or open the deck.
 *
 * When the server cannot create the deck, the built deck is held so the player can save it again:
 * a fresh build would cost another AI build from the player's allowance and another model call.
 * Each built deck gets one idempotency key, and every attempt to create it sends that key: when the
 * server stored the deck but its answer was lost, saving again answers the stored deck instead of
 * creating a second one (#1855). Only the creation is retried; later failures still throw to the
 * wizard.
 *
 * @module deck/use-built-deck-save
 */
import { useCallback, useState } from "react";
import { countCopies } from "@/hooks/useAIDeckBuild";
import type { BuildResult } from "@/hooks/useAIDeckBuild";
import { useDeckStore } from "@/lib/deck/store";
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
  /** True while a built deck the server could not create waits for `retry`. */
  readonly saveFailed: boolean;
  /**
   * Stores the built deck, then calls `onComplete` with its id, unless it carries corrections.
   * When the server cannot create the deck, it holds the deck and sets `saveFailed` instead of
   * throwing.
   *
   * @throws When the deck was created but cannot be activated
   */
  readonly save: (deck: BuiltDeck) => Promise<void>;
  /**
   * Saves the held deck again: the same name, cards, commander and corrections, with no new build.
   * Does nothing when no deck is held.
   *
   * @throws As `save` does
   */
  readonly retry: () => Promise<void>;
  /** Forgets the progress, the corrected deck and the held deck, for a fresh build. */
  readonly reset: () => void;
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
  // Importing 99 cards is ~65 serialized round trips; without a counter the
  // dialog looks frozen for the whole minute.
  const [importedCount, setImportedCount] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [correctedDeck, setCorrectedDeck] = useState<CorrectedDeck | null>(
    null
  );
  const [unsavedDeck, setUnsavedDeck] = useState<DeckToCreate | null>(null);

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
    await setActiveDeck(deckId);

    // Read the commander off the build result, not off the build hook's
    // state: the caller's closure holds the render-time snapshot.
    if (result.commander) {
      await tryResolveCommander(result.commander, setCommander);
    }

    setImportTotal(countCopies(result.cards));
    setImportedCount(0);
    await importCardsInBatches(
      collapseEntries(result.cards),
      addDeckCard,
      setImportedCount
    );

    if (result.corrections.length > 0) {
      setCorrectedDeck({ deckId, corrections: result.corrections });
      return;
    }
    onComplete(deckId);
  };

  const store = async (attempt: DeckToCreate): Promise<void> => {
    setUnsavedDeck(null);
    const deckId = await createOrHold(attempt);
    if (deckId === null) return;
    await fill(deckId, attempt.deck.result);
  };

  // A new build is a new deck, so it gets a new key; a retry resends the held one.
  const save = (deck: BuiltDeck): Promise<void> =>
    store({ deck, idempotencyKey: crypto.randomUUID() });

  const retry = (): Promise<void> =>
    unsavedDeck ? store(unsavedDeck) : Promise.resolve();

  const reset = useCallback(() => {
    setImportedCount(0);
    setImportTotal(0);
    setCorrectedDeck(null);
    setUnsavedDeck(null);
  }, []);

  return {
    importedCount,
    importTotal,
    correctedDeck,
    saveFailed: unsavedDeck !== null,
    save,
    retry,
    reset,
  };
}
