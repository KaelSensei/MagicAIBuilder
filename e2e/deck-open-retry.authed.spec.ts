import { expect, test } from "./fixtures";
import { fixtureCards, suppressOnboarding } from "./helpers";

test("retries a failed individual deck load without showing an incomplete editor", async ({
  page,
  seededDeck,
}) => {
  const deckId = await seededDeck.create({
    name: "Deck Open Retry",
    cards: fixtureCards(1),
  });
  let failedOnce = false;

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
  const deckCard = page.getByRole("button", { name: "Remove Fixture Card 0", exact: true });
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(deckCard).toHaveCount(0);

  await page.getByRole("button", { name: "Try again" }).click();
  await expect(deckCard).toBeVisible();
});
