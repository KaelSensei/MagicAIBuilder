/**
 * A deck save or load that fails tells the player in their own language: the
 * deck store has no locale of its own, so it raises each failure toast by its
 * catalogue key and the toast container translates it (I-01, #1738). English
 * reads word for word as the store used to hard-code it.
 *
 * A deck the server does not have (404) raises no toast at all: a retry cannot
 * bring it back, and the builder's "Deck not found" state is the only message.
 *
 * Sociable: the real deck store, the real deck client over the in-memory deck
 * API, the real toast store, the real toast container and the real catalogs.
 * Only the deck API's answers are steered.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, screen } from "@testing-library/react";
import { ToastContainer } from "@/components/ui/Toast";
import { useToastStore } from "@/hooks/useToast";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { DeckApiRefusal, installFakeDeckClient } from "@/test/fake-deck-client";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";

import { useDeckStore } from "./store";

const api = installFakeDeckClient();

const DECK_ID = "deck-1";
const CARD_ID = "row-1";
const NETWORK_DOWN = new Error("network down");

/** The deck store's actions. */
function store() {
  return useDeckStore.getState();
}

/** Holds one saved deck with one card, open in the builder. */
function holdOpenDeck(): void {
  const deck = aDeck({
    id: DECK_ID,
    cards: [aDeckCard({ id: CARD_ID, name: "Sol Ring" })],
  });
  useDeckStore.setState({ decks: { [DECK_ID]: deck }, activeDeckId: DECK_ID });
}

/** Opens the deck by its id, as a bookmark does, before the store holds it. */
function openUnheldDeck(): Promise<void> {
  useDeckStore.setState({ decks: {}, activeDeckId: null });
  return store().setActiveDeck(DECK_ID);
}

/** Shows the toast container under the player's locale. */
function showToasts(locale: TestLocale): void {
  renderWithIntl(<ToastContainer />, { locale });
}

/** Runs a store action, with React's updates flushed. */
async function perform(action: () => Promise<unknown>): Promise<void> {
  await act(async () => {
    await action();
  });
}

/** One deck save or load that fails, and the toast it raises in each locale. */
interface FailedDeckRequest {
  readonly request: string;
  readonly fail: () => void;
  readonly run: () => Promise<unknown>;
  readonly en: string;
  readonly fr: string;
}

const FAILED_REQUESTS: readonly FailedDeckRequest[] = [
  {
    request: "a rename",
    fail: () => api.updateDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().renameDeck(DECK_ID, "Nouveau nom"),
    en: "Could not rename deck. Please retry.",
    fr: "Impossible de renommer le deck. Réessayez.",
  },
  {
    request: "the description",
    fail: () => api.updateDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().updateDeckDescription(DECK_ID, "Tokens et sacrifices"),
    en: "Could not save deck description. Please retry.",
    fr: "Impossible d’enregistrer la description du deck. Réessayez.",
  },
  {
    request: "the tags",
    fail: () => api.updateDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().addTag(DECK_ID, "tokens"),
    en: "Could not save deck tags. Please retry.",
    fr: "Impossible d’enregistrer les étiquettes du deck. Réessayez.",
  },
  {
    request: "the target bracket",
    fail: () => api.updateDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().setTargetBracket(4),
    en: "Could not save target bracket. Please retry.",
    fr: "Impossible d’enregistrer le bracket cible. Réessayez.",
  },
  {
    request: "the manual bracket",
    fail: () => api.updateDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().setManualBracket(4),
    en: "Could not save manual bracket. Please retry.",
    fr: "Impossible d’enregistrer le bracket manuel. Réessayez.",
  },
  {
    request: "the budget",
    fail: () => api.updateDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().setBudget(150),
    en: "Could not save deck budget. Please retry.",
    fr: "Impossible d’enregistrer le budget du deck. Réessayez.",
  },
  {
    request: "a refresh",
    fail: () => api.fetchDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().reloadActiveDeck(),
    en: "Could not refresh deck. Please retry.",
    fr: "Impossible d’actualiser le deck. Réessayez.",
  },
  {
    request: "the refresh after a forced save",
    fail: () => api.fetchDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().forceSave(),
    en: "Could not refresh deck. Please retry.",
    fr: "Impossible d’actualiser le deck. Réessayez.",
  },
  {
    request: "an open the server failed",
    fail: () =>
      api.fetchDeck.mockRejectedValueOnce(
        new DeckApiRefusal(500, "Failed to load deck")
      ),
    run: openUnheldDeck,
    en: "Could not open deck. Please try again.",
    fr: "Impossible d’ouvrir le deck. Réessayez.",
  },
  {
    request: "an open with no network",
    fail: () => api.fetchDeck.mockRejectedValueOnce(NETWORK_DOWN),
    run: openUnheldDeck,
    en: "Could not open deck. Please try again.",
    fr: "Impossible d’ouvrir le deck. Réessayez.",
  },
  {
    request: "a card removal",
    fail: () => api.removeCard.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().removeCard(CARD_ID),
    en: "Could not remove card. Please retry.",
    fr: "Impossible de retirer la carte. Réessayez.",
  },
  {
    request: "a bulk card removal",
    fail: () => api.removeCard.mockRejectedValueOnce(NETWORK_DOWN),
    run: () => store().bulkRemoveCards([CARD_ID]),
    en: "Could not remove card. Please retry.",
    fr: "Impossible de retirer la carte. Réessayez.",
  },
];

const LOCALES: readonly TestLocale[] = ["fr", "en"];

beforeEach(() => {
  holdOpenDeck();
});

afterEach(() => {
  const { toasts, remove } = useToastStore.getState();
  for (const toast of toasts) remove(toast.id);
  useDeckStore.setState({
    decks: {},
    activeDeckId: null,
    deckOpenError: null,
    undoStack: [],
  });
});

describe("a failed deck save or load", () => {
  it.each(
    FAILED_REQUESTS.flatMap((failure) =>
      LOCALES.map((locale) => ({ ...failure, locale, text: failure[locale] }))
    )
  )(
    "says $request failed in the player's language ($locale)",
    async ({ fail, run, locale, text }) => {
      fail();
      showToasts(locale);

      await perform(run);

      expect(screen.getByText(text)).toBeInTheDocument();
      expect(useToastStore.getState().toasts).toHaveLength(1);
    }
  );
});

describe("opening a deck the server does not have", () => {
  it("raises no toast: the builder's not-found state is the only message", async () => {
    api.fetchDeck.mockRejectedValueOnce(
      new DeckApiRefusal(404, "Deck not found")
    );
    showToasts("fr");

    await perform(openUnheldDeck);

    expect(store().deckOpenError).toMatchObject({
      deckId: DECK_ID,
      kind: "not-found",
    });
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
