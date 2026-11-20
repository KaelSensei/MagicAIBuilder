"use client";

/**
 * The save step of the AI deck wizard: turns a finished build into a stored deck.
 *
 * Deck building context. Kept out of `DeckWizard.tsx` so the wizard holds the questions and the
 * screens, and this hook holds the writes: create the deck, activate it, resolve the commander,
 * import the cards, then either show the build's corrections or open the deck.
 *
 * @module deck/use-built-deck-save
 */
import { useCallback, useState } from "react";
import { countCopies } from "@/hooks/useAIDeckBuild";
import type { BuildResult } from "@/hooks/useAIDeckBuild";
import { useDeckStore } from "@/lib/deck/store";
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
  /**
   * Stores the built deck, then calls `onComplete` with its id, unless it carries corrections.
   *
   * @throws When the deck cannot be created or activated
   */
  readonly save: (deck: BuiltDeck) => Promise<void>;
  /** Forgets the progress and the corrected deck, for a fresh wizard run. */
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

  const save = async ({ name, result }: BuiltDeck): Promise<void> => {
    const deckId = await createDeck(name, { isAIGenerated: true });
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

  const reset = useCallback(() => {
    setImportedCount(0);
    setImportTotal(0);
    setCorrectedDeck(null);
  }, []);

  return { importedCount, importTotal, correctedDeck, save, reset };
}
