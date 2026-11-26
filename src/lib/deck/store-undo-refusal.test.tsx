/**
 * An undo the store cannot apply yet tells the player why, in their own
 * language. The last change belongs to a deck the store no longer holds, so
 * the store keeps the change on the stack and asks the player to open that
 * deck first. The store has no locale of its own, so it raises the toast by
 * its catalogue key and the toast container translates it; the toast used to
 * be hard-coded in English (I-04).
 *
 * Sociable: the real deck store, the real toast store, the real toast
 * container and the real catalogs.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastStore } from "@/hooks/useToast";
import { aDeckCard } from "@/test/builders/card";
import { renderWithIntl } from "@/test/render-with-intl";

import { useDeckStore } from "./store";

/** The last change on the undo stack added a card to this deck. */
const CHANGE = {
  type: "ADD_CARD",
  deckId: "deck-closed",
  card: aDeckCard({ id: "row-1", name: "Sol Ring" }),
} as const;

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  // The deck the change was made in is no longer held by the store.
  useDeckStore.setState({ decks: {}, activeDeckId: null, undoStack: [CHANGE] });
});

afterEach(() => {
  useDeckStore.setState({ decks: {}, activeDeckId: null, undoStack: [] });
  useToastStore.setState({ toasts: [] });
});

/** Asks the store to undo the last change, with React's updates flushed. */
async function undo(): Promise<void> {
  await act(async () => {
    await useDeckStore.getState().undo();
  });
}

describe("an undo whose deck is not open", () => {
  it("asks a player using French to open the deck first, in French", async () => {
    renderWithIntl(<ToastContainer />, { locale: "fr" });

    await undo();

    expect(
      await screen.findByText(
        "Ouvrez le deck d’origine avant de réessayer d’annuler."
      )
    ).toBeInTheDocument();
  });

  it("asks a player using English to open the deck first, in English", async () => {
    renderWithIntl(<ToastContainer />, { locale: "en" });

    await undo();

    expect(
      await screen.findByText("Open the original deck before retrying undo.")
    ).toBeInTheDocument();
  });

  it("keeps the change on the undo stack, so the player can undo it once the deck is open", async () => {
    renderWithIntl(<ToastContainer />, { locale: "en" });

    await undo();

    expect(useDeckStore.getState().undoStack).toEqual([CHANGE]);
  });
});
