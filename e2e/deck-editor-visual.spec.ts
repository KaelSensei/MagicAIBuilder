import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { suppressOnboarding, type DeckSeed } from "./helpers";

const COMMANDER_ID = "00000000-0000-4000-8000-000000000301";
const SPELL_ID = "00000000-0000-4000-8000-000000000302";

const RED_ONE_DROP = {
  manaCost: "{R}",
  cmc: 1,
  quantity: 1,
  imageUri: "https://cards.scryfall.io/normal/front/a/b/visual.jpg",
};

/** A red commander and one red instant, both with an image, so the banner and the preview render. */
const VISUAL_DECK: DeckSeed = {
  name: "Deck Editor Visual",
  cards: [
    {
      ...RED_ONE_DROP,
      scryfallId: COMMANDER_ID,
      name: "Visual Commander",
      zone: "main",
      isCommander: true,
      category: "commander",
      typeLine: "Legendary Creature",
      colorIdentity: ["R"],
    },
    {
      ...RED_ONE_DROP,
      scryfallId: SPELL_ID,
      name: "Visual Spell",
      zone: "main",
      isCommander: false,
      category: "instant",
      typeLine: "Instant",
      colorIdentity: ["R"],
    },
  ],
};

async function openEditor(page: Page, deckId: string): Promise<void> {
  await suppressOnboarding(page);
  await page.goto(`/builder/${deckId}`);
  await page.getByRole("link", { name: "Back to my decks" }).waitFor({ state: "visible" });
  await page.getByTitle("List view").nth(1).click();
}

test.describe("Deck editor visual stability", () => {
  test("keeps the commander banner box stable while warnings open and close", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(VISUAL_DECK);

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
  });

  test("opens a fixed card preview without moving the card row", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(VISUAL_DECK);

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
  });
});
