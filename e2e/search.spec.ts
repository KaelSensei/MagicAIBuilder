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
    // A strict role, as in openBuilder: "text=New Deck" is a loose, case-blind
    // substring match, and since #1593 it also resolves to the /decks page's
    // "New deck format" label, which it clicks first.
    await page.getByRole("banner").getByRole("button", { name: "New Deck", exact: true }).click();
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

    // Debounced search then Scryfall round-trip — wait for a result card to render
    await expect(
      page.getByRole("button", { name: /Add .* to deck/i }).first()
    ).toBeVisible({ timeout: 15000 });
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

  test("a search Scryfall cannot answer says card search is unavailable, not a raw Scryfall error", async ({
    page,
  }) => {
    // The browser asks the shared cache first, and the server fills it from
    // Scryfall itself, so the cache must miss for the browser to reach
    // Scryfall: an answer without `data` is a miss (`shared-cache-client.ts`).
    await page.route("**/api/cache/search**", async (route) => {
      await route.fulfill({ json: { hit: false } });
    });
    await page.route(
      "https://api.scryfall.com/cards/search**",
      async (route) => {
        await route.fulfill({
          status: 503,
          json: {
            object: "error",
            status: 503,
            details: "Service Unavailable",
          },
        });
      }
    );
    await openBuilder(page);

    await page.getByTestId("search-input").fill("sol ring");

    // The search retries twice with a back-off before it settles as failed.
    // Filtered: Next.js mounts its own role="alert" route announcer.
    await expect(
      page.getByRole("alert").filter({
        hasText: "Card search is unavailable right now. Try again in a moment.",
      })
    ).toBeVisible({ timeout: 15000 });
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

  test("Collection only tells a signed-out player why nothing is listed", async ({
    page,
  }) => {
    // This project has no client session, so the player is signed out.
    await openBuilder(page);
    await page.getByText("Show filters").click();

    const toggle = page.getByRole("button", { name: "Only cards I own" });
    await toggle.click();

    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText(
        "Sign in and add cards to your collection to see only the cards you own."
      )
    ).toBeVisible();
    await expect(
      page.getByText("No cards found. Try a different search.")
    ).toHaveCount(0);
  });
});
