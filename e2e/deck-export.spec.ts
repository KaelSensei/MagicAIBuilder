/**
 * Export formats: from the Export dialog the player copies the deck for
 * Moxfield, MTG Arena and as plain text, and downloads the MTGO `.dek` file.
 * The clipboard and the downloaded file are read back and compared with the
 * seeded deck.
 *
 * Every control is found by role and accessible name. The download buttons
 * are named by their extension, so the MTGO one, the only `.dek`, is the one
 * downloaded; the `.txt` formats are checked through the clipboard.
 *
 * @module e2e/deck-export
 */
import { test, expect } from "./fixtures";
import type { Locator, Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fixtureCards, openDeckInListView, type DeckSeed } from "./helpers";

const COMMANDER_ID = "00000000-0000-4000-8000-000000000501";

/** A commander and two main-deck cards, so every section of each format is exercised. */
const EXPORT_DECK: DeckSeed = {
  name: "Deck Export",
  cards: [
    {
      scryfallId: COMMANDER_ID,
      name: "Export Commander",
      manaCost: "{2}{G}",
      cmc: 3,
      typeLine: "Legendary Creature — Test",
      colorIdentity: ["G"],
      category: "commander",
      quantity: 1,
      zone: "main",
      isCommander: true,
    },
    ...fixtureCards(2),
  ],
};

/** Opens the Export dialog from the builder's title bar. */
async function openExport(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export Options" });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Copies the deck for `format` and returns what landed on the clipboard. */
async function copyFor(
  page: Page,
  dialog: Locator,
  format: string
): Promise<string> {
  await dialog.getByRole("button", { name: `Copy for ${format}` }).click();
  await expect(dialog.getByRole("button", { name: "Copied!" })).toBeVisible();
  return page.evaluate(() => navigator.clipboard.readText());
}

test.describe("Deck export", () => {
  test("previews the plain text list and copies each text format with its own headers", async ({
    page,
    context,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(EXPORT_DECK);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openDeckInListView(page, deckId);

    const dialog = await openExport(page);
    await expect(dialog.getByText("Deck List — 3 cards")).toBeVisible();
    await expect(dialog.getByRole("textbox")).toHaveValue(
      "Commander\n1 Export Commander\n\nDeck\n1 Fixture Card 0\n1 Fixture Card 1"
    );

    expect(await copyFor(page, dialog, "Moxfield")).toBe(
      "// Commander\n1 Export Commander\n\n// Deck\n1 Fixture Card 0\n1 Fixture Card 1"
    );
    expect(await copyFor(page, dialog, "MTG Arena")).toBe(
      "Commander\n1 Export Commander\n\nDeck\n1 Fixture Card 0\n1 Fixture Card 1"
    );
    expect(await copyFor(page, dialog, "Plain Text")).toBe(
      "Commander\n1 Export Commander\n\nDeck\n1 Fixture Card 0\n1 Fixture Card 1"
    );
  });

  test("downloads the MTGO .dek file named after the deck, with one Cards row per card", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(EXPORT_DECK);
    await openDeckInListView(page, deckId);
    const dialog = await openExport(page);

    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: ".dek" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("deck_export.dek");

    const path = await file.path();
    const xml = await readFile(path, "utf8");
    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain(
      '<Cards CatID="0" Quantity="1" Sideboard="false" Name="Export Commander" />'
    );
    expect(xml).toContain(
      '<Cards CatID="0" Quantity="1" Sideboard="false" Name="Fixture Card 0" />'
    );
    expect(xml).toContain(
      '<Cards CatID="0" Quantity="1" Sideboard="false" Name="Fixture Card 1" />'
    );
  });
});
