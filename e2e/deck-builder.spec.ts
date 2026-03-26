import { test, expect } from "@playwright/test";

test.describe("Deck Builder Flow", () => {
  test("can create a deck and see it on home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    // Navigate back to home
    await page.goto("/");

    // Deck should now appear
    const deckCard = page.getByTestId("deck-card");
    await expect(deckCard.first()).toBeVisible({ timeout: 10_000 });
  });

  test("builder shows 3-panel layout", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    // Search panel — has search input
    await expect(page.getByTestId("search-input")).toBeVisible();

    // Deck editor panel — has Commander section
    await expect(page.getByText("Commander")).toBeVisible();

    // Stats panel — has Bracket Score section
    await expect(page.getByText("Bracket Score")).toBeVisible();
  });

  test("deck shows 0/100 initially", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    // Should show card count (e.g. "1 / 100" or "0 / 100")
    await expect(page.getByText(/\/\s*100/)).toBeVisible();
  });

  test("mana curve section is present in stats", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    await expect(page.getByText("Mana Curve")).toBeVisible();
  });

  test("game changers badge is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    await expect(page.getByText(/Game Changers/)).toBeVisible();
  });

  test("back navigation returns to home", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    // Click back arrow (link to /)
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  });

  test("search mode tabs are visible: Name / By Set / By Color", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    // The three search mode tabs should be present
    await expect(page.getByRole("button", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("button", { name: "By Set" })).toBeVisible();
    await expect(page.getByRole("button", { name: "By Color" })).toBeVisible();
  });

  test("can switch to By Set search mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    await page.getByRole("button", { name: "By Set" }).click();
    // Set autocomplete input should appear
    await expect(
      page.getByPlaceholder(/Search set \(e\.g\. dsk/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("Commander mode toggle is visible in name search", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await page.getByRole("button", { name: /New Deck/i }).first().click();
    await page.waitForURL(/\/builder\//);

    // Default is name mode — commander button should be present
    await expect(page.getByRole("button", { name: /Commander/i })).toBeVisible();
  });
});
