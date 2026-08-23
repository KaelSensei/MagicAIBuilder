import { test, expect } from "@playwright/test";
import { suppressOnboarding } from "./helpers";

/**
 * The 404 page, in both served locales.
 *
 * Two files answer a 404 and which one you get depends on where the render
 * happens. `app/not-found.tsx` is the server-rendered document: English, no
 * chrome, its own `<html lang="en">`, and the only thing a request that never
 * resolved to a locale segment (a dormant prefix like /ja) can be given.
 * `app/[locale]/not-found.tsx` is what a visitor actually sees after a
 * `notFound()` from a page — Next.js cannot rewind a document it has begun
 * streaming, so it emits the error shell and the localized boundary renders on
 * the client.
 *
 * That split had no coverage, and it is the kind that fails silently: a 404
 * page is a 404 page, and nothing breaks when it is the untranslated one. Read
 * the served HTML alone and the localized file looks dead. These assertions run
 * in a browser for that reason.
 */
test.describe("Not found", () => {
  test.beforeEach(async ({ page }) => {
    await suppressOnboarding(page);
  });

  test("an unknown deck id serves the translated 404 with the app header", async ({
    page,
  }) => {
    const response = await page.goto("/deck/unknown-deck-id");
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to my decks" })).toBeVisible();
  });

  test("the same page in French is in French", async ({ page }) => {
    const response = await page.goto("/fr/deck/unknown-deck-id");
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Retour à mes decks" })).toBeVisible();
  });

  test("an unknown profile serves it too", async ({ page }) => {
    const response = await page.goto("/fr/u/nobody-has-this-username");
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });

  /**
   * A dormant locale prefix never resolves to the `[locale]` segment, so this
   * one is served by the same file with no request locale to read. It falls
   * back to English rather than throwing, and it is the only case that is
   * server-rendered — `notFound()` from a page is recovered on the client.
   */
  test("a dormant locale prefix falls back to English", async ({ page }) => {
    const response = await page.goto("/ja/decks");
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
