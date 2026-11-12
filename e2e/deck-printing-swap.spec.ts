/**
 * Printing swap: from a deck row the player opens the printing selector, picks
 * another printing of the same card, and the row keeps its name, zone and
 * quantity while its printing changes.
 *
 * The printings come from Scryfall, so this spec needs the network, as the
 * search specs do. The seeded printing id is a fixture UUID that matches no
 * real printing, so any printing the player picks is a change.
 *
 * @module e2e/deck-printing-swap
 */
import { test, expect } from "./fixtures";
import { getThroughApi, openDeckInListView, type DeckSeed } from "./helpers";

const SEEDED_PRINTING_ID = "00000000-0000-4000-8000-000000000401";

/** A real card name on a fixture printing, so the selector lists real printings. */
const PRINTING_DECK: DeckSeed = {
  name: "Deck Printing Swap",
  cards: [
    {
      scryfallId: SEEDED_PRINTING_ID,
      name: "Grizzly Bears",
      manaCost: "{1}{G}",
      cmc: 2,
      typeLine: "Creature — Bear",
      colorIdentity: ["G"],
      category: "creature",
      quantity: 1,
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

interface StoredCard {
  readonly name: string;
  readonly scryfallId: string;
  readonly zone: string;
  readonly quantity: number;
}

function readCards(value: unknown): readonly StoredCard[] {
  if (!isRecord(value) || !Array.isArray(value.cards)) return [];
  return value.cards.flatMap((card) => {
    if (
      !isRecord(card) ||
      typeof card.name !== "string" ||
      typeof card.scryfallId !== "string" ||
      typeof card.zone !== "string" ||
      typeof card.quantity !== "number"
    ) {
      return [];
    }
    return [
      {
        name: card.name,
        scryfallId: card.scryfallId,
        zone: card.zone,
        quantity: card.quantity,
      },
    ];
  });
}

test.describe("Deck printing swap", () => {
  test("swaps a row to another printing and keeps the row's name, zone and quantity", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(PRINTING_DECK);
    await openDeckInListView(page, deckId);

    await page
      .getByRole("button", { name: "Change the printing of Grizzly Bears" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Grizzly Bears" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Loading printings…")).not.toBeVisible({
      timeout: 30_000,
    });
    await expect(dialog.getByText(/^\d+ printings? available$/)).toBeVisible();

    const printing = dialog
      .getByRole("button", { name: /^Grizzly Bears — / })
      .first();
    const chosenSet = await printing.getAttribute("aria-label");
    const swapped = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes(`/api/decks/${deckId}/cards/`)
    );
    await printing.click();
    const swapResponse = await swapped;
    expect(swapResponse.ok()).toBe(true);
    const sent: unknown = swapResponse.request().postDataJSON();
    const chosenId =
      isRecord(sent) && typeof sent.scryfallId === "string"
        ? sent.scryfallId
        : "";
    expect(chosenId, `printing ${chosenSet} sent no id`).not.toBe("");
    expect(chosenId).not.toBe(SEEDED_PRINTING_ID);
    await expect(dialog).toHaveCount(0);

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect(readCards(await loaded.json())).toEqual([
      {
        name: "Grizzly Bears",
        scryfallId: chosenId,
        zone: "main",
        quantity: 1,
      },
    ]);
  });
});
