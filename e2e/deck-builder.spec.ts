import { test, expect } from "@playwright/test";
import { openBuilder } from "./helpers";

test.describe("Deck Builder Flow", () => {
  // The signed-in deck-list flow that used to sit here as a permanent
  // test.skip now lives in deck-list.authed.spec.ts, which runs against a
  // saved session from auth.setup.ts.

  test("builder shows 3-panel layout", async ({ page }) => {
    await openBuilder(page);

    // Search panel — has search input
    await expect(page.getByTestId("search-input")).toBeVisible();

    // Deck editor panel — commander filter control is present.
    // `exact` is required: without it `name` matches as a substring, so once
    // the search panel has loaded its default results this also picks up
    // "Commander's Sphere" and its "Add …" button — three elements, strict
    // mode violation. It only ever passed because the assertion used to run
    // before those cards rendered.
    await expect(
      page.getByRole("button", { name: "Commander", exact: true })
    ).toBeVisible();

    // Stats panel — has Bracket Score section
    await expect(page.getByText("Bracket Score").first()).toBeVisible();
  });

  test("deck shows 0/100 initially", async ({ page }) => {
    await openBuilder(page);

    // Should show card count (rendered as "0 / 100" with spaces)
    await expect(page.getByText(/\/\s*100/).first()).toBeVisible();
  });

  test("mana curve section is present in stats", async ({ page }) => {
    await openBuilder(page);

    await expect(page.getByText("Mana Curve").first()).toBeVisible();
  });

  test("game changers badge is present", async ({ page }) => {
    await openBuilder(page);

    await expect(page.getByText(/Game Changers/).first()).toBeVisible();
  });

  test("back navigation returns to home", async ({ page }) => {
    await openBuilder(page);

    // Target the back arrow by its accessible name. `a[href$="/decks"]` also
    // matches the header's "My Decks" nav link, which comes first in DOM order,
    // so `.first()` clicked that instead — this test never exercised the back
    // arrow it is named after.
    await page.getByRole("link", { name: "Back to my decks" }).click();
    await expect(page).toHaveURL(/\/decks$/);
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  });
});
