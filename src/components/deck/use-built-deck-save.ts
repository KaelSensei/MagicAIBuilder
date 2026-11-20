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
 * Only the creation is retried. Once the deck exists, a retry would create a second deck, so later
 * failures still throw to the wizard.
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
  const [unsavedDeck, setUnsavedDeck] = useState<BuiltDeck | null>(null);

  /** The new deck's id, or null when the server refused it and the deck is now held. */
  const createOrHold = async (deck: BuiltDeck): Promise<string | null> => {
    try {
      return await createDeck(deck.name, { isAIGenerated: true });
    } catch (err) {
      logger.error("Deck create error", "DeckWizard", err);
      setUnsavedDeck(deck);
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

  const save = async (deck: BuiltDeck): Promise<void> => {
    setUnsavedDeck(null);
    const deckId = await createOrHold(deck);
    if (deckId === null) return;
    await fill(deckId, deck.result);
  };

  const retry = (): Promise<void> =>
    unsavedDeck ? save(unsavedDeck) : Promise.resolve();

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
