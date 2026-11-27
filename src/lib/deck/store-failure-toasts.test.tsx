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
import { aScryfallCard } from "@/test/builders/scryfall";
import { DeckApiRefusal, installFakeDeckClient } from "@/test/fake-deck-client";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";

import { useDeckStore, type DeckAction } from "./store";
import type { Deck } from "./types";

const api = installFakeDeckClient();

const DECK_ID = "deck-1";
const CARD_ID = "row-1";
const NETWORK_DOWN = new Error("network down");
const SERVER_ERROR = new DeckApiRefusal(500, "Internal server error");

/** The commander a player picks: Kenrith fits any colour identity (CR 903.5c). */
const KENRITH = aScryfallCard({
  id: "00000000-0000-4000-8000-00000000c0de",
  name: "Kenrith, the Returned King",
  type_line: "Legendary Creature — Human Noble",
  color_identity: ["W", "U", "B", "R", "G"],
});

const SOL_RING = aDeckCard({
  id: CARD_ID,
  name: "Sol Ring",
  typeLine: "Artifact",
});

/** Basic lands, so the player may add one more (CR 903.5b). */
const ISLANDS = aDeckCard({
  id: "row-islands",
  name: "Island",
  typeLine: "Basic Land — Island",
  quantity: 10,
});

const KENRITH_ROW = aDeckCard({
  id: "row-kenrith",
  name: KENRITH.name,
  typeLine: KENRITH.type_line,
  colorIdentity: ["W", "U", "B", "R", "G"],
  category: "commander",
});

const LURRUS_ROW = aDeckCard({
  id: "row-lurrus",
  name: "Lurrus of the Dream-Den",
  typeLine: "Legendary Creature — Cat Nightmare",
  colorIdentity: ["W", "B"],
  category: "companion",
});

const TYMNA = aScryfallCard({
  id: "00000000-0000-4000-8000-0000000071a1",
  name: "Tymna the Weaver",
  type_line: "Legendary Creature — Human Cleric",
  oracle_text:
    "Lifelink\nPartner (You can have two commanders if both have partner.)",
  keywords: ["Lifelink", "Partner"],
  color_identity: ["W", "B"],
});

/** A companion (CR 702.139a) that fits Kenrith's colour identity. */
const JEGANTHA = aScryfallCard({
  id: "00000000-0000-4000-8000-00000000e1c0",
  name: "Jegantha, the Wellspring",
  type_line: "Legendary Creature — Elemental Elk",
  oracle_text:
    "Companion — No card in your starting deck has more than one of the same mana symbol in its mana cost.",
  keywords: ["Companion"],
  color_identity: ["R"],
});

const ARCANE_SIGNET = aScryfallCard({
  id: "00000000-0000-4000-8000-000000005161",
  name: "Arcane Signet",
  type_line: "Artifact",
});

const ARCANE_SIGNET_ROW = aDeckCard({
  id: "row-signet",
  name: ARCANE_SIGNET.name,
  typeLine: ARCANE_SIGNET.type_line,
});

/** Another printing of the Sol Ring the deck holds. */
const SOL_RING_PRINTING = aScryfallCard({
  id: "00000000-0000-4000-8000-0000000050c2",
  name: "Sol Ring",
  type_line: "Artifact",
  set: "c21",
  set_name: "Commander 2021",
});

/** The deck store's actions. */
function store() {
  return useDeckStore.getState();
}

/** Holds one saved deck with Sol Ring and Islands, open in the builder. */
function holdOpenDeck(commandZone: Partial<Deck> = {}): void {
  const deck = aDeck({
    id: DECK_ID,
    cards: [SOL_RING, ISLANDS],
    ...commandZone,
  });
  useDeckStore.setState({ decks: { [DECK_ID]: deck }, activeDeckId: DECK_ID });
}

/** Undoes `change`, the last change made to the open deck. */
function undoChange(change: DeckAction): Promise<void> {
  useDeckStore.setState({ undoStack: [change] });
  return store().undo();
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
  {
    request: "the commander",
    fail: () => api.changeCommandZone.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().setCommander(KENRITH),
    en: "Could not save commander — try again",
    fr: "Impossible d’enregistrer le commandant. Réessayez.",
  },
  {
    request: "the partner",
    fail: () => api.changeCommandZone.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().setPartner(TYMNA),
    en: "Could not save partner — try again",
    fr: "Impossible d’enregistrer le partenaire. Réessayez.",
  },
  {
    request: "the companion",
    fail: () => api.changeCommandZone.mockRejectedValueOnce(SERVER_ERROR),
    run: () => {
      holdOpenDeck({ commander: KENRITH_ROW });
      return store().setCompanion(JEGANTHA);
    },
    en: "Could not save companion — try again",
    fr: "Impossible d’enregistrer le compagnon. Réessayez.",
  },
  {
    request: "the companion's removal",
    fail: () => api.changeCommandZone.mockRejectedValueOnce(SERVER_ERROR),
    run: () => {
      holdOpenDeck({ commander: KENRITH_ROW, companion: LURRUS_ROW });
      return store().setCompanion(null);
    },
    en: "Could not remove companion — try again",
    fr: "Impossible de retirer le compagnon. Réessayez.",
  },
  {
    request: "a card addition",
    fail: () => api.addCard.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().addCard(ARCANE_SIGNET),
    en: "Could not add card. Please retry.",
    fr: "Impossible d’ajouter la carte. Réessayez.",
  },
  {
    request: "the undo of a card addition",
    fail: () => api.removeCard.mockRejectedValueOnce(SERVER_ERROR),
    run: () =>
      undoChange({ type: "ADD_CARD", deckId: DECK_ID, card: SOL_RING }),
    en: "Could not undo card addition. Please retry.",
    fr: "Impossible d’annuler l’ajout de la carte. Réessayez.",
  },
  {
    request: "the undo of a card removal",
    fail: () => api.addCard.mockRejectedValueOnce(SERVER_ERROR),
    run: () =>
      undoChange({
        type: "REMOVE_CARD",
        deckId: DECK_ID,
        card: ARCANE_SIGNET_ROW,
      }),
    en: "Could not undo card removal. Please retry.",
    fr: "Impossible d’annuler le retrait de la carte. Réessayez.",
  },
  {
    request: "a card's category",
    fail: () => api.updateCardCategory.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().updateCardCategory(CARD_ID, "ramp"),
    en: "Could not save card category. Please retry.",
    fr: "Impossible d’enregistrer la catégorie de la carte. Réessayez.",
  },
  {
    request: "a card's quantity",
    fail: () => api.updateCardQuantity.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().updateCardQuantity(ISLANDS.id, 1),
    en: "Could not save card quantity — previous quantity restored.",
    fr: "Impossible d’enregistrer la quantité de la carte. La quantité précédente est rétablie.",
  },
  {
    request: "a card's printing",
    fail: () => api.updateCardPrinting.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().swapCardPrinting(CARD_ID, SOL_RING_PRINTING),
    en: "Could not save card printing — try again",
    fr: "Impossible d’enregistrer l’édition de la carte. Réessayez.",
  },
  {
    request: "a card's notes",
    fail: () => api.updateCardNotes.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().updateCardNotes(CARD_ID, "Tour un"),
    en: "Could not save card notes. Try again.",
    fr: "Impossible d’enregistrer les notes de la carte. Réessayez.",
  },
  {
    request: "a card's move to another zone",
    fail: () => api.updateCardZone.mockRejectedValueOnce(SERVER_ERROR),
    run: () => store().moveCardToZone(CARD_ID, "sideboard"),
    en: "Could not move card. Try again.",
    fr: "Impossible de déplacer la carte. Réessayez.",
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
