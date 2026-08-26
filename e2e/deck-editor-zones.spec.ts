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

      const sideboardTab = page.getByRole("button", { name: /Sideboard/ });
      await expect(sideboardTab).toHaveText(/1/);
      await sideboardTab.click();
      await expect(page.getByText("Zone Sideboard Card")).toBeVisible();

      await page.getByTitle("Move to Considering").click();

      const loaded = await request.get(`/api/decks/${deckId}`);
      expect(loaded.ok()).toBe(true);
      const deck = (await loaded.json()) as {
        cards: readonly { name: string; zone: string }[];
      };
      expect(deck.cards.find((card) => card.name === "Zone Sideboard Card")?.zone).toBe("maybeboard");

      await page.reload();
      await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: /Considering/ }).click();
      await expect(page.getByText("Zone Sideboard Card")).toBeVisible();
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });
});
