import { expect, test } from "@playwright/test";
import { suppressOnboarding } from "./helpers";

test("guest builder reuses its local deck without an API creation request or render loop", async ({
  page,
}) => {
  await suppressOnboarding(page);

  let deckCreationRequests = 0;
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.route("**/api/decks", async (route) => {
    if (route.request().method() === "POST") {
      deckCreationRequests += 1;
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/builder/guest");
  await expect(page.getByRole("heading", { name: "Guest Deck" })).toBeVisible();

  await page
    .getByRole("banner")
    .getByRole("button", { name: "New Deck", exact: true })
    .click();

  await expect(page).toHaveURL(/\/builder\/guest$/);
  expect(deckCreationRequests).toBe(0);
  expect(
    pageErrors.some((error) => error.message.includes("Maximum update depth exceeded"))
  ).toBe(false);
});
