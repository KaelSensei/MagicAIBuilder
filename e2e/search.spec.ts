import { test, expect } from "@playwright/test";
import { openBuilder, suppressOnboarding } from "./helpers";

test.describe("Card Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto("/decks");
  });

  test("home page loads and shows My Decks heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  });

  test("can create a new deck", async ({ page }) => {
    await page.click("text=New Deck");
    // Should navigate to builder (deck creation can be slow on a cold server)
    await page.waitForURL(/\/builder\//);
    await expect(page).toHaveURL(/\/builder\//);
  });

  test("search input is visible in builder", async ({ page }) => {
    await openBuilder(page);
    await expect(page.getByTestId("search-input")).toBeVisible();
  });

  test("typing in search triggers a search", async ({ page }) => {
    await openBuilder(page);

    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("lightning bolt");

    // Wait for search results to appear (or loading state)
    await page.waitForTimeout(600); // debounce + load time
    // Either results appear or loading indicator shows
    const hasResults =
      (await page.locator("img[alt]").count()) > 0 ||
      (await page.locator("text=Searching...").count()) > 0 ||
      (await page.locator("text=No cards found").count()) > 0;
    expect(hasResults).toBe(true);
  });

  test("a search with no matches shows the empty state, not a raw Scryfall error", async ({
    page,
  }) => {
    await openBuilder(page);

    const searchInput = page.getByTestId("search-input");
    // A nonsense query Scryfall answers with HTTP 404 (valid query, zero matches)
    await searchInput.fill("zzzzznosuchcardzzzzz");

    // Debounce + Scryfall round-trip can be slow on a cold server
    await expect(
      page.getByText("No cards found. Try a different search.")
    ).toBeVisible({ timeout: 15000 });
    // The raw Scryfall API error must never surface to the user
    await expect(page.getByText(/Scryfall API error/i)).toHaveCount(0);
  });

  test("filter toggle shows and hides filter panel", async ({ page }) => {
    await openBuilder(page);

    const toggleBtn = page.getByText("Show filters");
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.getByText("Hide filters")).toBeVisible();
    await page.getByText("Hide filters").click();
    await expect(page.getByText("Show filters")).toBeVisible();
  });
});
