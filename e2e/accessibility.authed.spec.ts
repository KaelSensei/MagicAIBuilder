import { test, expect } from "@playwright/test";
import { openBuilder, seedPublicDeck } from "./helpers";

test("rename keeps keyboard focus and persists the deck title", async ({ page }) => {
  await openBuilder(page);
  await page.getByRole("heading", { level: 1 }).locator("..").click();
  const name = page.locator('input[maxlength="200"]');
  await expect(name).toBeFocused();
  await name.fill("Keyboard renamed deck");
  await name.press("Enter");
  await expect(page.getByRole("heading", { name: "Keyboard renamed deck" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Keyboard renamed deck" })).toBeVisible();
});

test("report modal contains keyboard focus and restores it after dismissal", async ({ page, playwright, baseURL }) => {
  // Use a separate anonymous context so the signed-in viewer is not the owner.
  const request = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const fixture = await seedPublicDeck(request, "accessibilityowner");
  await request.dispose();
  await page.goto(`/deck/${fixture.deckId}`);
  const trigger = page.getByRole("button", { name: "Report deck", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.tagName === "DIALOG" && element.matches(":modal"))).toBe(true);
  await dialog.getByRole("button", { name: /close/i }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: /submit report/i })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: /close/i }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
