/**
 * Bulk edit: the player rewrites the deck as text. A list that cuts one card
 * and adds a real one is saved as one change; a list naming a card Scryfall
 * does not know is refused whole, and the deck is untouched.
 *
 * The browser looks the added card up on Scryfall's collection endpoint. In
 * the E2E stack the Scryfall stand-in answers (`scryfall-stand-in.ts`): Sol
 * Ring is a recorded card and the misspelt name is not, so the spec needs no
 * network. Every control is found by role and accessible name.
 *
 * @module e2e/deck-bulk-edit
 */
import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";
import {
  deckCardRow,
  fixtureCards,
  getThroughApi,
  openDeckInListView,
  type DeckSeed,
} from "./helpers";

/** Two fixture cards; the edit keeps the first and replaces the second. */
const BULK_EDIT_DECK: DeckSeed = {
  name: "Deck Bulk Edit",
  cards: fixtureCards(2),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCardNames(value: unknown): readonly string[] {
  if (!isRecord(value) || !Array.isArray(value.cards)) return [];
  return value.cards.flatMap((card) =>
    isRecord(card) && typeof card.name === "string" ? [card.name] : []
  );
}

/** Opens the Bulk Edit dialog and returns it, with its decklist prefilled. */
async function openBulkEdit(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "Bulk Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: /^Bulk Edit — Deck Bulk Edit$/,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox")).toHaveValue(
    "Deck\n1 Fixture Card 0\n1 Fixture Card 1"
  );
  return dialog;
}

test.describe("Deck bulk edit", () => {
  test("saves a rewritten list as one change: a card cut and a card added", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(BULK_EDIT_DECK);
    await openDeckInListView(page, deckId);

    const dialog = await openBulkEdit(page);
    await dialog
      .getByRole("textbox")
      .fill("Deck\n1 Fixture Card 0\n1 Sol Ring");
    // The counter counts every non-empty line, the "Deck" header included.
    await expect(dialog.getByText("3 lines")).toBeVisible();

    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().endsWith(`/api/decks/${deckId}/cards`)
    );
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    expect((await saved).ok()).toBe(true);
    await expect(dialog.getByRole("status")).toHaveText(
      "Saved 2 cards successfully."
    );
    // The dialog closes itself once the save is confirmed.
    await expect(dialog).toHaveCount(0);

    await expect(deckCardRow(page, "Sol Ring")).toBeVisible();
    await expect(deckCardRow(page, "Fixture Card 0")).toBeVisible();
    await expect(deckCardRow(page, "Fixture Card 1")).toHaveCount(0);

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect([...readCardNames(await loaded.json())].sort()).toEqual([
      "Fixture Card 0",
      "Sol Ring",
    ]);
  });

  test("refuses the whole list when a card is unknown and leaves the deck as it was", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(BULK_EDIT_DECK);
    await openDeckInListView(page, deckId);

    const dialog = await openBulkEdit(page);
    await dialog
      .getByRole("textbox")
      .fill("Deck\n1 Fixture Card 0\n1 Zzyzx Card That Does Not Exist");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();

    await expect(dialog.getByRole("alert")).toHaveText(
      "Nothing was saved — no card found for: Zzyzx Card That Does Not Exist"
    );
    await expect(dialog).toBeVisible();

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect([...readCardNames(await loaded.json())].sort()).toEqual([
      "Fixture Card 0",
      "Fixture Card 1",
    ]);
  });
});
