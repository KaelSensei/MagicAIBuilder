import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import {
  getThroughApi,
  suppressOnboarding,
  type DeckCardSeed,
  type DeckSeed,
} from "./helpers";

const MAIN_CARD_ID = "00000000-0000-4000-8000-000000000201";
const CONSIDERING_CARD_ID = "00000000-0000-4000-8000-000000000202";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readZones(value: unknown): readonly { readonly name: string; readonly zone: string }[] {
  if (!isRecord(value) || !Array.isArray(value.cards)) return [];
  return value.cards.flatMap((card) => {
    if (!isRecord(card) || typeof card.name !== "string" || typeof card.zone !== "string") return [];
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

async function openList(page: Page, deckId: string): Promise<void> {
  await suppressOnboarding(page);
  await page.goto(`/builder/${deckId}`);
  await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
  await page.getByTitle("List view").nth(1).click();
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

    await openList(page, deckId);
    await page.getByRole("button", { name: /^Considering\b/ }).click();
    const card = page.locator("span").getByText("Flow Considering Card", { exact: true });
    await expect(card).toBeVisible();

    await page.reload();
    await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
    await page.getByTitle("List view").nth(1).click();
    await page.getByRole("button", { name: /^Considering\b/ }).click();
    await expect(card).toBeVisible();

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(loaded.ok()).toBe(true);
    expect(readZones(await loaded.json())).toEqual([
      expect.objectContaining({ name: "Flow Considering Card", zone: "maybeboard" }),
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

    await openList(page, deckId);
    const card = page.locator("span").getByText("Flow Main Card", { exact: true });
    await expect(card).toBeVisible();

    const zoneUpdate = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes(`/api/decks/${deckId}/cards/`)
    );
    await page.getByTitle("Move to Considering").click();
    expect((await zoneUpdate).ok()).toBe(true);

    await page.reload();
    await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
    await page.getByTitle("List view").nth(1).click();
    await page.getByRole("button", { name: /^Considering\b/ }).click();
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

    await openList(page, deckId);
    const card = page.locator("span").getByText("Flow Main Card", { exact: true });
    await expect(card).toBeVisible();

    await page.route(`**/api/decks/${deckId}/cards/*`, async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
        return;
      }
      await route.continue();
    });

    const rejectedMove = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes(`/api/decks/${deckId}/cards/`)
    );
    await page.getByTitle("Move to Considering").click();
    expect((await rejectedMove).status()).toBe(503);
    await expect(page.getByText("Could not move card. Try again.")).toBeVisible();
    await expect(card).toBeVisible();

    await page.reload();
    await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
    await page.getByTitle("List view").nth(1).click();
    await expect(card).toBeVisible();
    await expect(page.getByRole("button", { name: /^Considering\b/ })).toHaveText(/0/);

    const loaded = await getThroughApi(request, `/api/decks/${deckId}`);
    expect(readZones(await loaded.json())).toContainEqual(
      expect.objectContaining({ name: "Flow Main Card", zone: "main" })
    );
  });
});
