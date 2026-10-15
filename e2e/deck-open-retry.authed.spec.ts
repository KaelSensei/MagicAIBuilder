import { expect, test } from "@playwright/test";
import { seedDeckWithCards, suppressOnboarding } from "./helpers";

test("retries a failed individual deck load without showing an incomplete editor", async ({ page, request }) => {
  const deckId = await seedDeckWithCards(request, 1);
  let failedOnce = false;

  try {
    await suppressOnboarding(page);
    await page.route(`**/api/decks/${deckId}`, async (route) => {
      if (route.request().method() === "GET" && !failedOnce) {
        failedOnce = true;
        await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"temporarily unavailable"}' });
        return;
      }
      await route.continue();
    });

    await page.goto(`/builder/${deckId}`);
    const deckCard = page.locator("span").getByText("Fixture Card 0", { exact: true });
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(deckCard).toHaveCount(0);

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(deckCard).toBeVisible();
  } finally {
    await request.delete(`/api/decks/${deckId}`);
  }
});
