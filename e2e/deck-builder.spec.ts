import { test, expect } from "@playwright/test";

test.describe("Deck Builder Flow", () => {
  test("can create a deck and see it on home page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    // Navigate back to home
    await page.goto("/");

    // Deck should now appear
    const deckCard = page.getByTestId("deck-card");
    await expect(deckCard).toBeVisible();
    await expect(deckCard.first()).toContainText("New Deck");
  });

  test("builder shows 3-panel layout", async ({ page }) => {
    await page.goto("/");
    await page.click("text=New Deck");
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
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    // Should show card count
    await expect(page.getByText(/\/100/)).toBeVisible();
  });

  test("mana curve section is present in stats", async ({ page }) => {
    await page.goto("/");
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    await expect(page.getByText("Mana Curve")).toBeVisible();
  });

  test("game changers badge is present", async ({ page }) => {
    await page.goto("/");
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    await expect(page.getByText(/Game Changers/)).toBeVisible();
  });

  test("back navigation returns to home", async ({ page }) => {
    await page.goto("/");
    await page.click("text=New Deck");
    await page.waitForURL(/\/builder\//);

    // Click back arrow
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  });
});
