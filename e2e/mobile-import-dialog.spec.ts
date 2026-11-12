/**
 * The header's "Import" on a phone viewport (390×844).
 *
 * Mobile QA is a responsive web check: below the `md` breakpoint the desktop
 * bar is hidden and the deck actions sit in the menu the toggle opens. That
 * menu unmounts on every press, and until fix `mobile-import-dialog` it took
 * the import dialog it had just opened with it. The dialog now lives in the
 * always-mounted desktop instance, whichever button asked for it.
 *
 * @module e2e/mobile-import-dialog
 */
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { suppressOnboarding } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

/** The one import dialog, whichever header instance rendered it. */
function importDialog(page: Page) {
  return page.getByRole("dialog", { name: "Import Decklist" });
}

/** Opens the header menu and taps its "Import". */
async function tapImportInMenu(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Open menu" }).click();
  // `getByRole` skips hidden elements, so this is the menu's button, not the
  // desktop bar's.
  await page.getByRole("button", { name: "Import", exact: true }).click();
}

test.describe("Import from the phone menu", () => {
  test("keeps the dialog open after the menu closes, in the builder", async ({
    page,
  }) => {
    await suppressOnboarding(page);
    // The guest deck needs no account and no API call to open.
    await page.goto("/builder/guest");
    await expect(
      page.getByRole("heading", { name: "Guest Deck" })
    ).toBeVisible();

    await tapImportInMenu(page);

    const dialog = importDialog(page);
    await expect(dialog).toBeVisible();
    // The menu closed: only the desktop bar's navigation element is left in
    // the header. `locator` counts hidden elements, unlike `getByRole`.
    await expect(page.locator("header nav")).toHaveCount(1);
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("creates one deck and opens exactly one dialog, from home", async ({
    page,
    seededDeck,
  }) => {
    await suppressOnboarding(page);
    let deckCreationRequests = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        new URL(request.url()).pathname === "/api/decks"
      ) {
        deckCreationRequests += 1;
      }
    });
    await page.goto("/decks");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();

    const created = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/decks"
    );
    await tapImportInMenu(page);
    const createdDeck: { id: string } = await (await created).json();
    // Created through the header, so the fixture only deletes it.
    seededDeck.adopt(createdDeck.id);

    await expect(importDialog(page)).toBeVisible();
    await expect(importDialog(page)).toHaveCount(1);
    expect(deckCreationRequests).toBe(1);
  });
});
