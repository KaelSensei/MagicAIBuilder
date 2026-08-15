import { test, expect } from "@playwright/test";

test.describe("i18n Locale Routing", () => {
  test("default locale (en) serves pages without prefix", async ({ page }) => {
    await page.goto("/");
    // Should not redirect to /en/
    expect(page.url()).not.toMatch(/\/en\b/);
    // Page should load with lang="en"
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBe("en");
  });

  test("non-default locale uses prefix in URL", async ({ page }) => {
    await page.goto("/fr");
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBe("fr");
  });

  test("non-default locale on nested route", async ({ page }) => {
    const response = await page.goto("/fr/decks");
    // Should not 404
    expect(response?.status()).not.toBe(404);
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBe("fr");
  });

  test("API routes are not affected by locale middleware", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
  });

  test("invalid locale falls back to default", async ({ page }) => {
    await page.goto("/xx");
    // Should redirect or render with default locale
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBe("en");
  });

  // Only en and fr are routed; the other catalogs are dormant until translated.
  // A dormant prefix is no longer a locale, so it resolves as an ordinary
  // unknown path: a 404 rendered in English, never a half-translated page.
  test("a dormant locale prefix is treated as an unknown path", async ({ page }) => {
    const response = await page.goto("/ja");

    expect(response?.status()).toBe(404);
    expect(await page.getAttribute("html", "lang")).toBe("en");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
  });

  test("locale prefix is preserved after navigation", async ({ page }) => {
    await page.goto("/fr");
    // The landing page should have a link to decks
    const myDecksLink = page.getByRole("link", { name: /My Decks|Mes Decks/i });
    if (await myDecksLink.isVisible()) {
      await myDecksLink.click();
      // Web-first assertion: retries until the URL carries the locale prefix,
      // instead of waiting on a network-quiet heuristic.
      await expect(page).toHaveURL(/\/fr\//);
    }
  });
});
