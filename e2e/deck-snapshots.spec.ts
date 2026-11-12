/**
 * Deck snapshots: the player saves a named version from the History panel,
 * sees it listed with its card count, restores the deck to it after a cut, and
 * deletes it. The deck is read back through the API after the restore.
 *
 * Every control is found by role and accessible name, except the panel's
 * expand button, which has none (see `expandHistory`). The snapshots go with
 * the deck when the fixture deletes it (`DeckSnapshot.deck` cascades).
 *
 * The panel sits below the fold of the stats column at 1280×720. The column
 * scrolls (566 px tall, 2017 px of content), yet in three gate runs of
 * 2026-11-12 neither Playwright's scroll before a click nor an explicit
 * instant `scrollIntoView` settled on it: the click landed on the column for
 * 30 s. Its controls are therefore activated from the keyboard (`activate`),
 * which focuses and presses with no pointer hit test, as a keyboard user
 * would.
 *
 * The restore journey cuts a card through the API and reloads, not through
 * the row's remove button: that button leaves the builder on "Loading deck…"
 * today (`removeCard` keeps `cardCount`, so `isDeckStub` reads the deck as
 * half loaded; reported with the P1-12/14 PR, to be fixed in its own slice).
 *
 * @module e2e/deck-snapshots
 */
import { test, expect } from "./fixtures";
import type { APIRequestContext, Locator, Page } from "@playwright/test";
import {
  deckCardRow,
  fixtureCards,
  getThroughApi,
  openDeckInListView,
  reloadDeckIntoListView,
  type DeckSeed,
} from "./helpers";

/** Two interchangeable cards: one is cut, the snapshot brings it back. */
const SNAPSHOT_DECK: DeckSeed = {
  name: "Deck Snapshots",
  cards: fixtureCards(2),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** The id of the deck row named `name`, read through the API. */
async function cardIdOf(
  request: APIRequestContext,
  deckId: string,
  name: string
): Promise<string> {
  const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
  const deck: unknown = await loaded.json();
  const row =
    isRecord(deck) && Array.isArray(deck.cards)
      ? deck.cards.find((card) => isRecord(card) && card.name === name)
      : undefined;
  if (!isRecord(row) || typeof row.id !== "string")
    throw new Error(`${name} is not in the deck`);
  return row.id;
}

/** The card names the API reports for a deck, in storage order. */
function readCardNames(value: unknown): readonly string[] {
  if (!isRecord(value) || !Array.isArray(value.cards)) return [];
  return value.cards.flatMap((card) =>
    isRecord(card) && typeof card.name === "string" ? [card.name] : []
  );
}

/**
 * The History panel's header row: its title, its "Save" button and its
 * unnamed expand chevron. Both controls are found inside it, because the
 * builder shows other "Save" buttons and the chevron has no name of its own.
 */
function historyHeader(page: Page): Locator {
  return page.getByText("History", { exact: true }).locator("..");
}

/**
 * Activates a button the way a keyboard user does: focus it, press Enter.
 * No pointer hit test is involved, so it works wherever the button sits.
 */
async function activate(button: Locator): Promise<void> {
  await button.press("Enter");
}

/**
 * Saves a snapshot named `name` through the panel's popover.
 *
 * The header's "Save" button opens the popover, whose own "Save" button then
 * shares its name, so the name is committed with Enter instead.
 */
async function saveSnapshot(
  page: Page,
  deckId: string,
  name: string
): Promise<void> {
  await activate(
    historyHeader(page).getByRole("button", { name: "Save", exact: true })
  );
  const created = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith(`/api/decks/${deckId}/snapshots`)
  );
  await page.getByPlaceholder('e.g. "v1 budget"').fill(name);
  await page.keyboard.press("Enter");
  expect((await created).ok()).toBe(true);
}

/**
 * Opens the snapshot list. The panel's expand button is an unnamed chevron
 * (`SnapshotsPanel.tsx`, a follow-up for DB-49), so it is the last button of
 * the header row, after "Save".
 */
async function expandHistory(page: Page): Promise<void> {
  await activate(historyHeader(page).getByRole("button").last());
}

test.describe("Deck snapshots", () => {
  test("saves a snapshot, lists it with its card count and deletes it", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(SNAPSHOT_DECK);
    await openDeckInListView(page, deckId);

    await saveSnapshot(page, deckId, "v1 before cuts");

    await expandHistory(page);
    const entry = page
      .getByRole("listitem")
      .filter({ hasText: "v1 before cuts" });
    await expect(entry).toBeVisible();
    await expect(entry).toContainText("2 cards");

    const deleted = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes(`/api/decks/${deckId}/snapshots/`)
    );
    await activate(entry.getByRole("button", { name: "Delete snapshot" }));
    await activate(entry.getByRole("button", { name: "Delete?" }));
    expect((await deleted).ok()).toBe(true);
    await expect(
      page.getByText("No snapshots yet. Save one above!")
    ).toBeVisible();
  });

  test("restores the deck to a snapshot after a card was cut", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(SNAPSHOT_DECK);
    await openDeckInListView(page, deckId);
    await saveSnapshot(page, deckId, "both cards");

    const cut = await request.delete(
      `/api/decks/${deckId}/cards/${await cardIdOf(request, deckId, "Fixture Card 1")}`
    );
    expect(cut.ok(), await cut.text()).toBe(true);
    await reloadDeckIntoListView(page);
    await expect(deckCardRow(page, "Fixture Card 1")).toHaveCount(0);

    await expandHistory(page);
    const entry = page.getByRole("listitem").filter({ hasText: "both cards" });
    // The badge compares the snapshot with the deck as it is now: one card fewer.
    await expect(entry).toContainText("-1 cards");

    const restored = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes(`/api/decks/${deckId}/snapshots/`) &&
        response.url().endsWith("/restore")
    );
    await activate(
      entry.getByRole("button", { name: "Restore to this snapshot" })
    );
    await activate(entry.getByRole("button", { name: "Confirm" }));
    expect((await restored).ok()).toBe(true);

    // The builder reloads the deck after a restore, so the cut card is back.
    await expect(deckCardRow(page, "Fixture Card 1")).toBeVisible();
    await expect(deckCardRow(page, "Fixture Card 0")).toBeVisible();

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect([...readCardNames(await loaded.json())].sort()).toEqual([
      "Fixture Card 0",
      "Fixture Card 1",
    ]);
  });
});
