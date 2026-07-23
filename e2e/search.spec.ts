import { test, expect } from "@playwright/test";

test.describe("Card Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Create a deck and navigate to the builder
    await page.goto("/decks");
  });

  test("home page loads and shows My Decks heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  });

  test("can create a new deck", async ({ page }) => {
    await page.click("text=New Deck");
    // Should navigate to builder
    await expect(page).toHaveURL(/\/builder\//);
  });

  test("search input is visible in builder", async ({ page }) => {
    // Create deck first
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    const searchInput = page.getByTestId("search-input");
    await expect(searchInput).toBeVisible();
  });

  test("typing in search triggers a search", async ({ page }) => {
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

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
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    const searchInput = page.getByTestId("search-input");
    // A nonsense query Scryfall answers with HTTP 404 (valid query, zero matches)
    await searchInput.fill("zzzzznosuchcardzzzzz");

    await expect(page.getByText("No cards found. Try a different search.")).toBeVisible();
    // The raw Scryfall API error must never surface to the user
    await expect(page.getByText(/Scryfall API error/i)).toHaveCount(0);
  });

  test("filter toggle shows and hides filter panel", async ({ page }) => {
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    const toggleBtn = page.getByText("Show filters");
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(page.getByText("Hide filters")).toBeVisible();
    await page.getByText("Hide filters").click();
    await expect(page.getByText("Show filters")).toBeVisible();
  });
});
