/**
 * Two tabs on one deck: the second tab's write is refused because the first
 * tab changed the deck in between, and the second tab says so and shows the
 * deck as the first tab left it.
 *
 * Why this spec exists: the server has refused stale card writes since #1400,
 * but nothing drove the browser's side of the lock from the screen. Both tabs
 * are pages of one signed-in browser context, so they share the session as two
 * real tabs do. Each change is one row removal from the list view, found by
 * its "Remove {name}" control; the conflict message is the toast the store
 * raises, found by its text.
 *
 * @module e2e/deck-version-conflict
 */
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import {
  deckCardRow,
  fixtureCards,
  getThroughApi,
  openDeckInListView,
  type DeckSeed,
} from "./helpers";

/** Two fixture cards: tab A removes the first, tab B tries to remove the second. */
const SHARED_DECK: DeckSeed = {
  name: "Deck Version Conflict",
  cards: fixtureCards(2),
};

/** The conflict message, as `src/messages/en/deck.json` › `sync.conflictReloaded` reads. */
const CONFLICT_MESSAGE =
  "This deck was changed elsewhere (another tab or device). It has been reloaded; redo your last change if you still want it.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCardNames(value: unknown): readonly string[] {
  if (!isRecord(value) || !Array.isArray(value.cards)) return [];
  return value.cards.flatMap((card) =>
    isRecord(card) && typeof card.name === "string" ? [card.name] : []
  );
}

/** Removes a card from the open deck and waits for the server's answer to that removal. */
async function removeCard(
  page: Page,
  deckId: string,
  name: string
): Promise<number> {
  const answered = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().includes(`/api/decks/${deckId}/cards/`)
  );
  await deckCardRow(page, name).click();
  return (await answered).status();
}

test.describe("Deck version conflict between two tabs", () => {
  test("the second tab's write is refused, the deck is reloaded and the player is told", async ({
    page,
    context,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(SHARED_DECK);
    const tabA = page;
    const tabB = await context.newPage();
    await openDeckInListView(tabA, deckId);
    await openDeckInListView(tabB, deckId);
    await expect(deckCardRow(tabB, "Fixture Card 1")).toBeVisible();

    // Tab A changes the deck: both tabs read the same version, A's write wins.
    expect(await removeCard(tabA, deckId, "Fixture Card 0")).toBe(200);
    await expect(deckCardRow(tabA, "Fixture Card 0")).toHaveCount(0);

    // Tab B still shows the deck it read, and its write carries that version.
    await expect(deckCardRow(tabB, "Fixture Card 0")).toBeVisible();
    expect(await removeCard(tabB, deckId, "Fixture Card 1")).toBe(409);

    await expect(tabB.getByText(CONFLICT_MESSAGE)).toBeVisible();
    // The deck is the one tab A left: Fixture Card 1 is back, Fixture Card 0 is gone.
    await expect(deckCardRow(tabB, "Fixture Card 1")).toBeVisible();
    await expect(deckCardRow(tabB, "Fixture Card 0")).toHaveCount(0);

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect(readCardNames(await loaded.json())).toEqual(["Fixture Card 1"]);

    // Redoing the change on the reloaded deck goes through.
    expect(await removeCard(tabB, deckId, "Fixture Card 1")).toBe(200);
    await expect(deckCardRow(tabB, "Fixture Card 1")).toHaveCount(0);
    await tabB.close();
  });
});
