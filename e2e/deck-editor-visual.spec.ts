import { test, expect } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";
import { suppressOnboarding } from "./helpers";

const COMMANDER_ID = "00000000-0000-4000-8000-000000000301";
const SPELL_ID = "00000000-0000-4000-8000-000000000302";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readDeckId(value: unknown): string {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new Error("deck create response did not include an id");
  }
  return value.id;
}

async function createVisualDeck(request: APIRequestContext): Promise<string> {
  const created = await request.post("/api/decks", {
    data: { name: "Deck Editor Visual", format: "commander" },
  });
  if (!created.ok()) {
    throw new Error(`deck create failed: ${created.status()} ${await created.text()}`);
  }
  const id = readDeckId(await created.json());

  const cards = [
    {
      scryfallId: COMMANDER_ID,
      name: "Visual Commander",
      zone: "main",
      isCommander: true,
      category: "commander",
      typeLine: "Legendary Creature",
      colorIdentity: ["R"],
    },
    {
      scryfallId: SPELL_ID,
      name: "Visual Spell",
      zone: "main",
      isCommander: false,
      category: "instant",
      typeLine: "Instant",
      colorIdentity: ["R"],
    },
  ];

  for (const card of cards) {
    const added = await request.post(`/api/decks/${id}/cards`, {
      data: {
        ...card,
        manaCost: "{R}",
        cmc: 1,
        quantity: 1,
        imageUri: "https://cards.scryfall.io/normal/front/a/b/visual.jpg",
      },
    });
    if (!added.ok()) {
      throw new Error(`card seed failed: ${added.status()} ${await added.text()}`);
    }
  }

  return id;
}

async function openEditor(page: Page, deckId: string): Promise<void> {
  await suppressOnboarding(page);
  await page.goto(`/builder/${deckId}`);
  await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
  await page.getByTitle("List view").nth(1).click();
}

test.describe("Deck editor visual stability", () => {
  test("keeps the commander banner box stable while warnings open and close", async ({ page, request }) => {
    const deckId = await createVisualDeck(request);

    try {
      await openEditor(page, deckId);
      const banner = page.locator("div.h-\\[82px\\]", { hasText: "Visual Commander" });
      await expect(banner).toBeVisible();
      const before = await banner.boundingBox();
      expect(before?.height).toBeCloseTo(82, 0);

      await page.getByRole("button", { name: "Dismiss deck warnings" }).click();
      const dismissed = await banner.boundingBox();
      expect(dismissed?.height).toBeCloseTo(before?.height ?? 0, 0);
      expect(dismissed?.y).toBeCloseTo(before?.y ?? 0, 0);

      await page.getByRole("button", { name: "Toggle deck warnings" }).click();
      const reopened = await banner.boundingBox();
      expect(reopened?.height).toBeCloseTo(before?.height ?? 0, 0);
      expect(reopened?.y).toBeCloseTo(before?.y ?? 0, 0);
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });

  test("opens a fixed card preview without moving the card row", async ({ page, request }) => {
    const deckId = await createVisualDeck(request);

    try {
      await openEditor(page, deckId);
      const row = page.locator("span").getByText("Visual Spell", { exact: true });
      await expect(row).toBeVisible();
      // Measure the settled row, not its entrance translation.
      await expect(row.locator("..")).toHaveCSS("transform", "none");
      const before = await row.boundingBox();

      await row.hover();
      const preview = page.getByRole("img", { name: "Visual Spell" });
      await expect(preview).toBeVisible();
      const position = await preview.evaluate((node) => {
        const parent = node.parentElement;
        return parent ? getComputedStyle(parent).position : "";
      });
      expect(position).toBe("fixed");

      const after = await row.boundingBox();
      expect(after).toEqual(before);
    } finally {
      await request.delete(`/api/decks/${deckId}`);
    }
  });
});
