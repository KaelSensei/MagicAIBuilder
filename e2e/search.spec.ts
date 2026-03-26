import { test, expect } from "@playwright/test";

test.describe("Card Search Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  });

  test("home page loads and shows My Decks heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  });

  test("can create a new deck", async ({ page }) => {
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    // Should navigate to builder
    await expect(page).toHaveURL(/\/builder\//);
  });

  test("search input is visible in builder", async ({ page }) => {
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    const searchInput = page.getByTestId("search-input");
    await expect(searchInput).toBeVisible();
  });

  test("typing in search triggers a search", async ({ page }) => {
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("lightning bolt");

    // Wait for debounce + search results
    await page.waitForTimeout(800);

    // Either results appear, loading indicator, or no results message
    const hasResults =
      (await page.locator("img[alt]").count()) > 0 ||
      (await page.getByText("Searching...").count()) > 0 ||
      (await page.getByText("No cards found").count()) > 0 ||
      (await page.locator('[data-testid="card-result"]').count()) > 0;
    expect(hasResults).toBe(true);
  });

  test("filter toggle shows and hides filter panel", async ({ page }) => {
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    const showBtn = page.getByText("Show filters");
    await expect(showBtn).toBeVisible();
    await showBtn.click();
    await expect(page.getByText("Hide filters")).toBeVisible();
    await page.getByText("Hide filters").click();
    await expect(page.getByText("Show filters")).toBeVisible();
  });

  test("search mode tabs switch between Name / By Set / By Color", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    // Default: name mode — search input visible
    await expect(page.getByTestId("search-input")).toBeVisible();

    // Switch to By Set
    await page.getByRole("button", { name: "By Set" }).click();
    await expect(
      page.getByPlaceholder(/Search set \(e\.g\. dsk/i)
    ).toBeVisible({ timeout: 5_000 });
    // Search input should no longer be visible
    await expect(page.getByTestId("search-input")).not.toBeVisible();

    // Switch to By Color
    await page.getByRole("button", { name: "By Color" }).click();
    // Color selection UI should appear (no text search input)
    await expect(page.getByTestId("search-input")).not.toBeVisible();

    // Switch back to Name
    await page.getByRole("button", { name: "Name" }).click();
    await expect(page.getByTestId("search-input")).toBeVisible();
  });
});

test.describe("Collection Page", () => {
  test("collection page loads", async ({ page }) => {
    await page.goto("/collection");
    // Should show collection UI — either empty state or cards
    await expect(page).toHaveURL("/collection");
    // Page should not 404
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText(
      "This page could not be found"
    );
  });

  test("collection page has header", async ({ page }) => {
    await page.goto("/collection");
    // Header should be present
    await expect(page.locator("header")).toBeVisible({ timeout: 10_000 });
  });
});
