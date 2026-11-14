/**
 * I-57 defect 2: a printing swap carries the new printing's price.
 *
 * Deck totals, the shopping lists and the acquisition plan read a row's
 * `price`. A swap used to change the printing and its images but keep the old
 * printing's price, so every total built on that row was wrong. I-57
 * requirement 6.1: "A printing change updates the row's price in the same
 * write" (docs/product/specs/i57-printing-preferences-everywhere.md).
 *
 * Sociable: the store, its single-row PATCH and the in-memory deck API behind
 * the fake deck client run; the fake stores what the PATCH carried, so a test
 * reads the saved deck, not a request. The prices below are illustrative.
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { ApiDeckCard } from "@/lib/db/deck-api";
import { aScryfallCard } from "@/test/builders/scryfall";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

import { useDeckStore } from "./store";

const api = installFakeDeckClient();
const toasts = recordToasts();

const DECK_ID = "deck-1";

/** Sol Ring from Commander 2021, as the server holds the row. */
const SOL_RING_C21: ApiDeckCard = {
  id: "row-sol-ring",
  deckId: DECK_ID,
  scryfallId: "sol-ring-c21",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  colorIdentity: [],
  isGameChanger: true,
  isBanned: false,
  price: 2.5,
  imageUri: "https://img.test/sol-ring-c21-grid.webp",
  artCropUri: "https://img.test/sol-ring-c21-art.webp",
  category: "ramp",
  quantity: 1,
  notes: null,
  isCommander: false,
  isPartner: false,
  zone: "main",
};

/** The printing the player swaps to, with the USD price Scryfall sends. */
const SOL_RING_LTC = aScryfallCard({
  id: "sol-ring-ltc",
  name: "Sol Ring",
  type_line: "Artifact",
  prices: { usd: "4.99", usd_foil: null, eur: null },
  image_uris: {
    grid: "https://img.test/sol-ring-ltc-grid.webp",
    art: "https://img.test/sol-ring-ltc-art.webp",
  },
});

const store = () => useDeckStore.getState();
const heldRow = () =>
  store().decks[DECK_ID]?.cards.find((card) => card.id === SOL_RING_C21.id);
const savedRow = () =>
  api.savedDeck(DECK_ID)?.cards.find((card) => card.id === SOL_RING_C21.id);

beforeEach(async () => {
  api.seedDeck({ ...emptyApiDeck(DECK_ID, "Artifacts"), cards: [SOL_RING_C21] });
  useDeckStore.setState({ decks: {}, activeDeckId: null, undoStack: [] });
  await store().setActiveDeck(DECK_ID);
});

describe("deck store — a printing swap carries the new printing's price (I-57 defect 2)", () => {
  it("gives the row the new printing's USD price, on screen and in the saved deck", async () => {
    await store().swapCardPrinting(SOL_RING_C21.id, SOL_RING_LTC);

    expect(heldRow()).toMatchObject({ scryfallId: "sol-ring-ltc", price: 4.99 });
    expect(savedRow()).toMatchObject({ scryfallId: "sol-ring-ltc", price: 4.99 });
  });

  it("leaves the price unknown when Scryfall has no USD price for the new printing", async () => {
    const unpriced = { ...SOL_RING_LTC, prices: { usd: null, usd_foil: "9.99", eur: "3.10" } };

    await store().swapCardPrinting(SOL_RING_C21.id, unpriced);

    // Unknown is null: not 0, and not the previous printing's 2.50 (AC-57-05).
    expect(heldRow()).toMatchObject({ scryfallId: "sol-ring-ltc", price: null });
    expect(savedRow()).toMatchObject({ scryfallId: "sol-ring-ltc", price: null });
  });

  it("puts the previous printing's price back when the save fails", async () => {
    api.updateCardPrinting.mockRejectedValueOnce(
      new DeckApiRefusal(500, "Failed to update card")
    );

    await store().swapCardPrinting(SOL_RING_C21.id, SOL_RING_LTC);

    expect(heldRow()).toMatchObject({ scryfallId: "sol-ring-c21", price: 2.5 });
    expect(savedRow()).toMatchObject({ scryfallId: "sol-ring-c21", price: 2.5 });
    expect(toasts).toHaveBeenCalledWith(
      "error",
      "Could not save card printing — try again"
    );
  });
});
