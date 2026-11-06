import { test, expect } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";
import { suppressOnboarding } from "./helpers";

const MAIN_CARD_ID = "00000000-0000-4000-8000-000000000201";
const CONSIDERING_CARD_ID = "00000000-0000-4000-8000-000000000202";

interface SeedCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly zone: "main" | "sideboard" | "maybeboard";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readDeckId(value: unknown): string {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new Error("deck create response did not include an id");
  }
  return value.id;
}

function readZones(value: unknown): readonly { readonly name: string; readonly zone: string }[] {
  if (!isRecord(value) || !Array.isArray(value.cards)) return [];
  return value.cards.flatMap((card) => {
    if (!isRecord(card) || typeof card.name !== "string" || typeof card.zone !== "string") return [];
    return [{ name: card.name, zone: card.zone }];
  });
}

async function createDeck(request: APIRequestContext, cards: readonly SeedCard[]): Promise<string> {
  const created = await request.post("/api/decks", {
    data: { name: "Deck Editor Flows", format: "commander" },
  });
  if (!created.ok()) {
    throw new Error(`deck create failed: ${created.status()} ${await created.text()}`);
  }
  const id = readDeckId(await created.json());

  for (const card of cards) {
    const added = await request.post(`/api/decks/${id}/cards`, {
      data: {
        ...card,
        manaCost: "{1}",
        cmc: 1,
        typeLine: "Instant",
        colorIdentity: [],
        category: "instant",
        quantity: 1,
      },
    });
    if (!added.ok()) {
      throw new Error(`card seed failed: ${added.status()} ${await added.text()}`);
    }
  }

  return id;
}

async function openList(page: Page, deckId: string): Promise<void> {
  await suppressOnboarding(page);
  await page.goto(`/builder/${deckId}`);
  await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
  await page.getByTitle("List view").nth(1).click();
}

test.describe("Deck editor add, move, reload and recovery", () => {
  test("keeps a considering card after reload", async ({ page, request }) => {
    const deckId = await createDeck(request, [
      { scryfallId: CONSIDERING_CARD_ID, name: "Flow Considering Card", zone: "maybeboard" },
    ]);

    try {
      await openList(page, deckId);
      await page.getByRole("button", { name: /^Considering\b/ }).click();
      const card = page.locator("span").getByText("Flow Considering Card", { exact: true });
      await expect(card).toBeVisible();

      await page.reload();
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
      await page.getByTitle("List view").nth(1).click();
      await page.getByRole("button", { name: /^Considering\b/ }).click();
      await expect(card).toBeVisible();

      const loaded = await request.get(`/api/decks/${deckId}`);
      expect(loaded.ok()).toBe(true);
      expect(readZones(await loaded.json())).toEqual([
        expect.objectContaining({ name: "Flow Considering Card", zone: "maybeboard" }),
      ]);
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });

  test("moves a main card to considering and keeps that zone after reload", async ({ page, request }) => {
    const deckId = await createDeck(request, [
      { scryfallId: MAIN_CARD_ID, name: "Flow Main Card", zone: "main" },
    ]);

    try {
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

      const loaded = await request.get(`/api/decks/${deckId}`);
      expect(readZones(await loaded.json())).toContainEqual(
        expect.objectContaining({ name: "Flow Main Card", zone: "maybeboard" })
      );
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });

  test("restores a main card when the move to considering fails", async ({ page, request }) => {
    const deckId = await createDeck(request, [
      { scryfallId: MAIN_CARD_ID, name: "Flow Main Card", zone: "main" },
    ]);

    try {
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

      const loaded = await request.get(`/api/decks/${deckId}`);
      expect(readZones(await loaded.json())).toContainEqual(
        expect.objectContaining({ name: "Flow Main Card", zone: "main" })
      );
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });
});
