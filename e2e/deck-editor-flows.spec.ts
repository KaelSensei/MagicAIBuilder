/**
 * Deck editor journeys around the Considering zone and card removal: a card
 * seeded there is still there after a reload, a main card moved there stays
 * moved, a move the server refuses is rolled back on screen and on disk, and a
 * removal the server refuses brings the card back and can be retried.
 *
 * Every control is found by role and accessible name (audit TT-11); the deck
 * is read back through the API after each round trip.
 *
 * @module e2e/deck-editor-flows
 */
import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import {
  deckCardRow,
  getThroughApi,
  openDeckInListView,
  reloadDeckIntoListView,
  type DeckCardSeed,
  type DeckSeed,
} from "./helpers";

const MAIN_CARD_ID = "00000000-0000-4000-8000-000000000201";
const CONSIDERING_CARD_ID = "00000000-0000-4000-8000-000000000202";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readZones(
  value: unknown
): readonly { readonly name: string; readonly zone: string }[] {
  if (!isRecord(value) || !Array.isArray(value.cards)) return [];
  return value.cards.flatMap((card) => {
    if (
      !isRecord(card) ||
      typeof card.name !== "string" ||
      typeof card.zone !== "string"
    )
      return [];
    return [{ name: card.name, zone: card.zone }];
  });
}

/** A deck holding one colorless one-mana instant, placed in the zone the flow starts from. */
function flowsDeck(
  card: Required<Pick<DeckCardSeed, "scryfallId" | "name" | "zone">>
): DeckSeed {
  return {
    name: "Deck Editor Flows",
    cards: [
      {
        ...card,
        manaCost: "{1}",
        cmc: 1,
        typeLine: "Instant",
        colorIdentity: [],
        category: "instant",
        quantity: 1,
      },
    ],
  };
}

/** The zone tab that opens the Considering list; its name carries the count, "Considering (1)". */
function consideringTab(page: Page) {
  return page.getByRole("button", { name: /^Considering \(\d+\)$/ });
}

/** Waits for the server's answer to the next card removal of `deckId`. */
function cardRemoval(page: Page, deckId: string) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().includes(`/api/decks/${deckId}/cards/`)
  );
}

test.describe("Deck editor add, move, reload and recovery", () => {
  test("keeps a considering card after reload", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(
      flowsDeck({
        scryfallId: CONSIDERING_CARD_ID,
        name: "Flow Considering Card",
        zone: "maybeboard",
      })
    );

    await openDeckInListView(page, deckId);
    await consideringTab(page).click();
    const card = deckCardRow(page, "Flow Considering Card");
    await expect(card).toBeVisible();

    await reloadDeckIntoListView(page);
    await consideringTab(page).click();
    await expect(card).toBeVisible();

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect(readZones(await loaded.json())).toEqual([
      expect.objectContaining({
        name: "Flow Considering Card",
        zone: "maybeboard",
      }),
    ]);
  });

  test("moves a main card to considering and keeps that zone after reload", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(
      flowsDeck({
        scryfallId: MAIN_CARD_ID,
        name: "Flow Main Card",
        zone: "main",
      })
    );

    await openDeckInListView(page, deckId);
    const card = deckCardRow(page, "Flow Main Card");
    await expect(card).toBeVisible();

    const zoneUpdate = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes(`/api/decks/${deckId}/cards/`)
    );
    await page
      .getByRole("button", { name: "Move Flow Main Card to Considering" })
      .click();
    expect((await zoneUpdate).ok()).toBe(true);

    await reloadDeckIntoListView(page);
    await consideringTab(page).click();
    await expect(card).toBeVisible();

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(readZones(await loaded.json())).toContainEqual(
      expect.objectContaining({ name: "Flow Main Card", zone: "maybeboard" })
    );
  });

  test("restores a main card when the move to considering fails", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(
      flowsDeck({
        scryfallId: MAIN_CARD_ID,
        name: "Flow Main Card",
        zone: "main",
      })
    );

    await openDeckInListView(page, deckId);
    const card = deckCardRow(page, "Flow Main Card");
    await expect(card).toBeVisible();

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

    const rejectedMove = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes(`/api/decks/${deckId}/cards/`)
    );
    await page
      .getByRole("button", { name: "Move Flow Main Card to Considering" })
      .click();
    expect((await rejectedMove).status()).toBe(503);
    await expect(
      page.getByText("Could not move card. Try again.")
    ).toBeVisible();
    await expect(card).toBeVisible();

    await reloadDeckIntoListView(page);
    await expect(card).toBeVisible();
    await expect(consideringTab(page)).toHaveAccessibleName("Considering (0)");

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(readZones(await loaded.json())).toContainEqual(
      expect.objectContaining({ name: "Flow Main Card", zone: "main" })
    );
  });

  test("brings a card back when its removal fails, keeps it after reload and removes it on retry", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(
      flowsDeck({
        scryfallId: MAIN_CARD_ID,
        name: "Flow Main Card",
        zone: "main",
      })
    );

    await openDeckInListView(page, deckId);
    const card = deckCardRow(page, "Flow Main Card");
    await expect(card).toBeVisible();

    // `removeCard` sends DELETE /api/decks/{deckId}/cards/{cardId}?expectedVersion=n
    // (src/lib/db/deck-api.ts); a glob `*` stops at "/" only, so it takes the query too.
    const cardRoute = `**/api/decks/${deckId}/cards/*`;
    await page.route(cardRoute, async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: "{}",
        });
        return;
      }
      await route.continue();
    });

    const rejectedRemoval = cardRemoval(page, deckId);
    await card.click();
    expect((await rejectedRemoval).status()).toBe(503);
    await expect(
      page.getByText("Could not remove card. Please retry.")
    ).toBeVisible();
    await expect(card).toBeVisible();

    await reloadDeckIntoListView(page);
    await expect(card).toBeVisible();
    const kept = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(readZones(await kept.json())).toContainEqual(
      expect.objectContaining({ name: "Flow Main Card", zone: "main" })
    );

    await page.unroute(cardRoute);
    const retriedRemoval = cardRemoval(page, deckId);
    await card.click();
    expect((await retriedRemoval).ok()).toBe(true);
    await expect(card).toHaveCount(0);

    await reloadDeckIntoListView(page);
    await expect(card).toHaveCount(0);
    const removed = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(readZones(await removed.json())).toEqual([]);
  });
});
