/**
 * Deck editor zone journeys: a sideboard card moved to Considering, a move the
 * server refuses, a searched card added to the main deck, a main card moved to
 * the sideboard, and the same move made with the keyboard alone.
 *
 * Every control is found by role and accessible name (audit TT-11). The
 * keyboard journey listens to dnd-kit's live region, the same text a screen
 * reader hears, to know which drop target the card is over.
 *
 * @module e2e/deck-editor-zones
 */
import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import {
  deckCardRow,
  getThroughApi,
  openDeckInListView,
  reloadDeckIntoListView,
  type DeckSeed,
} from "./helpers";

const MAIN_CARD_ID = "00000000-0000-4000-8000-000000000101";
const SIDEBOARD_CARD_ID = "00000000-0000-4000-8000-000000000102";

const ONE_MANA_ARTIFACT = {
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  colorIdentity: [],
  category: "artifact",
  quantity: 1,
};

/** One card in the main deck and one in the sideboard. */
const ZONES_DECK: DeckSeed = {
  name: "Deck Editor Zones",
  cards: [
    {
      ...ONE_MANA_ARTIFACT,
      scryfallId: MAIN_CARD_ID,
      name: "Zone Main Card",
      zone: "main",
    },
    {
      ...ONE_MANA_ARTIFACT,
      scryfallId: SIDEBOARD_CARD_ID,
      name: "Zone Sideboard Card",
      zone: "sideboard",
    },
  ],
};

/** The zone tabs; each name carries its count, "Sideboard (1)". */
function sideboardTab(page: Page) {
  return page.getByRole("button", { name: /^Sideboard \(\d+\)$/ });
}
function consideringTab(page: Page) {
  return page.getByRole("button", { name: /^Considering \(\d+\)$/ });
}

/** Rejects every zone save for `deckId` with a 503 and lets the other calls through. */
async function rejectZoneSaves(page: Page, deckId: string): Promise<void> {
  await page.route(`**/api/decks/${deckId}/cards/*`, async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: "{}",
      });
      return;
    }
    await route.continue();
  });
}

function zoneSave(page: Page, deckId: string) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes(`/api/decks/${deckId}/cards/`)
  );
}

/**
 * Presses `key` until dnd-kit announces the dragged card over a drop target
 * matching `target`, or gives up after `maxPresses`.
 *
 * dnd-kit's KeyboardSensor moves to the nearest drop target in the arrow's
 * direction and announces "Draggable item X was moved over droppable area Y"
 * in its live region. A press with no target in that direction announces
 * nothing new, so the wait after each press is short and a miss just presses
 * again.
 */
async function pressUntilOver(
  page: Page,
  key: "ArrowUp" | "ArrowRight",
  target: RegExp,
  maxPresses: number
): Promise<void> {
  const announcement = page
    .getByRole("status")
    .filter({ hasText: /draggable item/i });
  for (let press = 0; press < maxPresses; press += 1) {
    await page.keyboard.press(key);
    try {
      await expect(announcement).toContainText(target, { timeout: 500 });
      return;
    } catch {
      // Not over the target yet: press again.
    }
  }
  throw new Error(
    `${key} pressed ${maxPresses} times without reaching ${target}`
  );
}

test.describe("Deck Editor zones", () => {
  test("loads and persists a secondary-zone move", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(ZONES_DECK);

    await openDeckInListView(page, deckId);
    await expect(sideboardTab(page)).toHaveAccessibleName("Sideboard (1)");
    await sideboardTab(page).click();
    const sideboardCard = deckCardRow(page, "Zone Sideboard Card");
    await expect(sideboardCard).toBeVisible();

    const zoneUpdate = zoneSave(page, deckId);
    await page.getByRole("button", { name: "→ Considering" }).click();
    expect((await zoneUpdate).ok()).toBe(true);

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    const deck = (await loaded.json()) as {
      cards: readonly { name: string; zone: string }[];
    };
    expect(
      deck.cards.find((card) => card.name === "Zone Sideboard Card")?.zone
    ).toBe("maybeboard");

    await reloadDeckIntoListView(page);
    await consideringTab(page).click();
    await expect(sideboardCard).toBeVisible();
  });

  test("restores a card after its zone save fails and a page reload", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(ZONES_DECK);

    await openDeckInListView(page, deckId);
    await sideboardTab(page).click();
    const sideboardCard = deckCardRow(page, "Zone Sideboard Card");
    await expect(sideboardCard).toBeVisible();

    await rejectZoneSaves(page, deckId);
    const rejectedMove = zoneSave(page, deckId);
    await page.getByRole("button", { name: "→ Considering" }).click();
    expect((await rejectedMove).status()).toBe(503);
    await expect(
      page.getByText("Could not move card. Try again.")
    ).toBeVisible();
    await expect(sideboardCard).toBeVisible();

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect(await loaded.json()).toEqual(
      expect.objectContaining({
        cards: expect.arrayContaining([
          expect.objectContaining({
            name: "Zone Sideboard Card",
            zone: "sideboard",
          }),
        ]),
      })
    );

    await reloadDeckIntoListView(page);
    await sideboardTab(page).click();
    await expect(sideboardCard).toBeVisible();
  });

  test("keeps a main card out of the sideboard after a rejected move and reload", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(ZONES_DECK);

    await openDeckInListView(page, deckId);
    const mainCard = deckCardRow(page, "Zone Main Card");
    await expect(mainCard).toBeVisible();

    await rejectZoneSaves(page, deckId);
    await page
      .getByRole("button", { name: "Move Zone Main Card to Sideboard" })
      .click();
    await expect(
      page.getByText("Could not move card. Try again.")
    ).toBeVisible();
    await expect(mainCard).toBeVisible();

    await reloadDeckIntoListView(page);
    await expect(mainCard).toBeVisible();
    await sideboardTab(page).click();
    await expect(mainCard).toHaveCount(0);
  });

  test("keeps a searched card in the main deck after reload", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(ZONES_DECK);

    await openDeckInListView(page, deckId);

    await page.getByTestId("search-input").fill("Grizzly Bears");
    await page
      .getByAltText(/^Grizzly Bears$/i)
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: /Grizzly Bears/i })
    ).toBeVisible();
    await expect(page.getByText("Loading printings…")).not.toBeVisible({
      timeout: 30_000,
    });

    const addedCard = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith(`/api/decks/${deckId}/cards`)
    );
    await page
      .getByRole("button", { name: /Grizzly Bears —/i })
      .first()
      .click();
    expect((await addedCard).ok()).toBe(true);

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    const deck = (await loaded.json()) as {
      cards: readonly { name: string; zone: string }[];
    };
    expect(deck.cards.filter((card) => card.name === "Grizzly Bears")).toEqual([
      expect.objectContaining({ zone: "main" }),
    ]);

    await reloadDeckIntoListView(page);
    await expect(deckCardRow(page, "Grizzly Bears")).toBeVisible();
  });

  test("persists a main-deck move to the sideboard after reload", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(ZONES_DECK);

    await openDeckInListView(page, deckId);
    const mainCard = deckCardRow(page, "Zone Main Card");
    await expect(mainCard).toBeVisible();

    const zoneUpdate = zoneSave(page, deckId);
    await page
      .getByRole("button", { name: "Move Zone Main Card to Sideboard" })
      .click();
    expect((await zoneUpdate).ok()).toBe(true);

    await reloadDeckIntoListView(page);
    await sideboardTab(page).click();
    await expect(mainCard).toBeVisible();
  });

  test("moves a main card to another zone with the keyboard alone", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(ZONES_DECK);

    await openDeckInListView(page, deckId);
    const mainCard = deckCardRow(page, "Zone Main Card");
    await expect(mainCard).toBeVisible();

    // The only main-deck row, so the only drag handle. Space picks it up; a
    // sortable row is its own drop target, so the "picked up" announcement is
    // at once followed by "moved over" itself. Either proves the drag started.
    await page.getByRole("button", { name: "Drag to reorder" }).focus();
    await page.keyboard.press("Space");
    const announcement = page
      .getByRole("status")
      .filter({ hasText: /draggable item/i });
    await expect(announcement).toContainText(/draggable item deck-card-/i);

    // Up out of the list to the zone tabs. Which tab the arrow lands on is
    // dnd-kit's choice, the nearest corner; the Main tab would be a no-op, so
    // from there one press to the right reaches a secondary tab. Walking back
    // left is not an option: the dragged row's own, full-width droppable is
    // then the nearest target. The journey asserts on the zone it reached.
    await pressUntilOver(
      page,
      "ArrowUp",
      /moved over droppable area deck-zone-tab-/,
      8
    );
    if (
      ((await announcement.textContent()) ?? "").includes("deck-zone-tab-main.")
    ) {
      await pressUntilOver(
        page,
        "ArrowRight",
        /moved over droppable area deck-zone-tab-(sideboard|maybeboard)\./,
        2
      );
    }
    const reached = /deck-zone-tab-(sideboard|maybeboard)\./.exec(
      (await announcement.textContent()) ?? ""
    );
    expect(
      reached,
      "the card never reached a secondary zone tab"
    ).not.toBeNull();
    const zone = reached?.[1] === "sideboard" ? "sideboard" : "maybeboard";

    const zoneUpdate = zoneSave(page, deckId);
    await page.keyboard.press("Space");
    expect((await zoneUpdate).ok()).toBe(true);

    const tab =
      zone === "sideboard" ? sideboardTab(page) : consideringTab(page);
    await expect(tab).toHaveAccessibleName(
      zone === "sideboard" ? "Sideboard (2)" : "Considering (1)"
    );
    await tab.click();
    await expect(mainCard).toBeVisible();

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(await loaded.json()).toEqual(
      expect.objectContaining({
        cards: expect.arrayContaining([
          expect.objectContaining({ name: "Zone Main Card", zone }),
        ]),
      })
    );
  });

  test("recovers from a failed searched-card addition and allows retry", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(ZONES_DECK);

    await openDeckInListView(page, deckId);

    await page.getByTestId("search-input").fill("Grizzly Bears");
    await page
      .getByAltText(/^Grizzly Bears$/i)
      .first()
      .click();
    await expect(page.getByText("Loading printings…")).not.toBeVisible({
      timeout: 30_000,
    });

    await page.route(`**/api/decks/${deckId}/cards`, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: "{}",
        });
        return;
      }
      await route.continue();
    });
    const rejectedAdd = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith(`/api/decks/${deckId}/cards`)
    );
    await page
      .getByRole("button", { name: /Grizzly Bears —/i })
      .first()
      .click();
    expect((await rejectedAdd).status()).toBe(503);
    await expect(
      page.getByText("Could not add card. Please retry.")
    ).toBeVisible();
    await expect(deckCardRow(page, "Grizzly Bears")).toHaveCount(0);

    await reloadDeckIntoListView(page);
    await expect(deckCardRow(page, "Grizzly Bears")).toHaveCount(0);

    await page.unroute(`**/api/decks/${deckId}/cards`);
    await page.getByTestId("search-input").fill("Grizzly Bears");
    await page
      .getByAltText(/^Grizzly Bears$/i)
      .first()
      .click();
    await expect(page.getByText("Loading printings…")).not.toBeVisible({
      timeout: 30_000,
    });
    const retriedAdd = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith(`/api/decks/${deckId}/cards`)
    );
    await page
      .getByRole("button", { name: /Grizzly Bears —/i })
      .first()
      .click();
    expect((await retriedAdd).ok()).toBe(true);
    await expect(deckCardRow(page, "Grizzly Bears")).toBeVisible();
  });
});
