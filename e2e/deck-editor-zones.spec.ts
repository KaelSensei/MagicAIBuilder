import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { suppressOnboarding } from "./helpers";

const MAIN_CARD_ID = "00000000-0000-4000-8000-000000000101";
const SIDEBOARD_CARD_ID = "00000000-0000-4000-8000-000000000102";

async function createDeckWithZones(request: APIRequestContext): Promise<string> {
  const created = await request.post("/api/decks", {
    data: { name: "Deck Editor Zones", format: "commander" },
  });
  if (!created.ok()) {
    throw new Error(`deck create failed: ${created.status()} ${await created.text()}`);
  }
  const { id } = (await created.json()) as { id: string };

  for (const card of [
    { scryfallId: MAIN_CARD_ID, name: "Zone Main Card", zone: "main" },
    { scryfallId: SIDEBOARD_CARD_ID, name: "Zone Sideboard Card", zone: "sideboard" },
  ]) {
    const added = await request.post(`/api/decks/${id}/cards`, {
      data: {
        ...card,
        manaCost: "{1}",
        cmc: 1,
        typeLine: "Artifact",
        colorIdentity: [],
        category: "artifact",
        quantity: 1,
      },
    });
    if (!added.ok()) {
      throw new Error(`card seed failed: ${added.status()} ${await added.text()}`);
    }
  }

  return id;
}

test.describe("Deck Editor zones", () => {
  test("loads and persists a secondary-zone move", async ({ page, request }) => {
    const deckId = await createDeckWithZones(request);

    try {
      await suppressOnboarding(page);
      await page.goto(`/builder/${deckId}`);
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });

      const sideboardTab = page.getByRole("button", { name: /^Sideboard\b/ });
      await expect(sideboardTab).toHaveText(/1/);
      await sideboardTab.click();
      const sideboardCard = page.locator("span").getByText("Zone Sideboard Card", { exact: true });
      await expect(sideboardCard).toBeVisible();

      const zoneUpdate = page.waitForResponse(
        (response) =>
          response.request().method() === "PATCH" &&
          response.url().includes(`/api/decks/${deckId}/cards/`)
      );
      await page.getByTitle("Move to Considering").click();
      expect((await zoneUpdate).ok()).toBe(true);

      const loaded = await request.get(`/api/decks/${deckId}`);
      expect(loaded.ok()).toBe(true);
      const deck = (await loaded.json()) as {
        cards: readonly { name: string; zone: string }[];
      };
      expect(deck.cards.find((card) => card.name === "Zone Sideboard Card")?.zone).toBe("maybeboard");

      await page.reload();
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: /^Considering\b/ }).click();
      await expect(sideboardCard).toBeVisible();
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });

  test("restores a card after its zone save fails and a page reload", async ({ page, request }) => {
    const deckId = await createDeckWithZones(request);

    try {
      await suppressOnboarding(page);
      await page.goto(`/builder/${deckId}`);
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });

      const sideboardTab = page.getByRole("button", { name: /^Sideboard\b/ });
      await sideboardTab.click();
      const sideboardCard = page.locator("span").getByText("Zone Sideboard Card", { exact: true });
      await expect(sideboardCard).toBeVisible();

      await page.route(`**/api/decks/${deckId}/cards/*`, async (route) => {
        if (route.request().method() === "PATCH") {
          await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
          return;
        }
        await route.continue();
      });

      const rejectedMove = page.waitForResponse(
        (response) => response.request().method() === "PATCH" &&
          response.url().includes(`/api/decks/${deckId}/cards/`)
      );
      await page.getByTitle("Move to Considering").click();
      expect((await rejectedMove).status()).toBe(503);
      await expect(page.getByText("Could not move card. Try again.")).toBeVisible();
      await expect(sideboardCard).toBeVisible();

      const loaded = await request.get(`/api/decks/${deckId}`);
      expect(loaded.ok()).toBe(true);
      expect(await loaded.json()).toEqual(expect.objectContaining({
        cards: expect.arrayContaining([
          expect.objectContaining({ name: "Zone Sideboard Card", zone: "sideboard" }),
        ]),
      }));

      await page.reload();
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
      await sideboardTab.click();
      await expect(sideboardCard).toBeVisible();
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });

  test("keeps a searched card in the main deck after reload", async ({ page, request }) => {
    const deckId = await createDeckWithZones(request);

    try {
      await suppressOnboarding(page);
      await page.goto(`/builder/${deckId}`);
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });

      await page.getByTestId("search-input").fill("Grizzly Bears");
      await page.getByAltText(/^Grizzly Bears$/i).first().click();
      await expect(page.getByRole("heading", { name: /Grizzly Bears/i })).toBeVisible();
      await expect(page.getByText("Loading printings…")).not.toBeVisible({ timeout: 30_000 });

      const addedCard = page.waitForResponse(
        (response) => response.request().method() === "POST" &&
          response.url().endsWith(`/api/decks/${deckId}/cards`)
      );
      await page.getByRole("button", { name: /Grizzly Bears —/i }).first().click();
      expect((await addedCard).ok()).toBe(true);

      const loaded = await request.get(`/api/decks/${deckId}`);
      expect(loaded.ok()).toBe(true);
      const deck = (await loaded.json()) as {
        cards: readonly { name: string; zone: string }[];
      };
      expect(deck.cards.filter((card) => card.name === "Grizzly Bears")).toEqual([
        expect.objectContaining({ zone: "main" }),
      ]);

      await page.reload();
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
      await expect(page.locator("span").getByText("Grizzly Bears", { exact: true })).toBeVisible();
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });

  test("recovers from a failed searched-card addition and allows retry", async ({ page, request }) => {
    const deckId = await createDeckWithZones(request);

    try {
      await suppressOnboarding(page);
      await page.goto(`/builder/${deckId}`);
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });

      await page.getByTestId("search-input").fill("Grizzly Bears");
      await page.getByAltText(/^Grizzly Bears$/i).first().click();
      await expect(page.getByText("Loading printings…")).not.toBeVisible({ timeout: 30_000 });

      await page.route(`**/api/decks/${deckId}/cards`, async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
          return;
        }
        await route.continue();
      });
      const rejectedAdd = page.waitForResponse(
        (response) => response.request().method() === "POST" &&
          response.url().endsWith(`/api/decks/${deckId}/cards`)
      );
      await page.getByRole("button", { name: /Grizzly Bears —/i }).first().click();
      expect((await rejectedAdd).status()).toBe(503);
      await expect(page.getByText("Could not add card. Please retry.")).toBeVisible();
      await expect(page.locator("span").getByText("Grizzly Bears", { exact: true })).toHaveCount(0);

      await page.reload();
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
      await expect(page.locator("span").getByText("Grizzly Bears", { exact: true })).toHaveCount(0);

      await page.unroute(`**/api/decks/${deckId}/cards`);
      await page.getByTestId("search-input").fill("Grizzly Bears");
      await page.getByAltText(/^Grizzly Bears$/i).first().click();
      await expect(page.getByText("Loading printings…")).not.toBeVisible({ timeout: 30_000 });
      const retriedAdd = page.waitForResponse(
        (response) => response.request().method() === "POST" &&
          response.url().endsWith(`/api/decks/${deckId}/cards`)
      );
      await page.getByRole("button", { name: /Grizzly Bears —/i }).first().click();
      expect((await retriedAdd).ok()).toBe(true);
      await expect(page.locator("span").getByText("Grizzly Bears", { exact: true })).toBeVisible();
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });
});
