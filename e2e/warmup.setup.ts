import { test, expect } from "@playwright/test";

/**
 * Compiles every route segment the suite navigates, before any test runs.
 *
 * The gate's web server is `next dev`, which compiles routes on demand. A
 * navigation that lands mid-compile can render a client component against a
 * different instance of the next-intl context module than the provider used —
 * the intermittent "context from NextIntlClientProvider was not found" in the
 * web-server log, an aborted navigation in the failing test. Visiting each
 * segment once makes all compilation happen here, so the module graph is
 * stable for the tests that follow (nothing recompiles during a run — the
 * files do not change).
 *
 * Nonexistent ids are deliberate: a 404 still compiles the segment, and the
 * warmup must not depend on seeded data.
 */
const ROUTES = [
  "/",
  "/decks",
  "/builder/warmup-nonexistent-id",
  "/deck/warmup-nonexistent-id",
  "/u/warmup-nonexistent-user",
  "/commanders/warmup-nonexistent/decks",
  "/rules/game-changers",
  "/fr",
  "/fr/decks",
] as const;

test("warm every route segment the suite navigates", async ({ page }) => {
  // Dev-mode compiles are slow and sequential; give the whole sweep room.
  test.setTimeout(300_000);

  for (const route of ROUTES) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    // 404s are expected for the fake ids — only a dead server is a failure.
    expect(response, `no response for ${route}`).not.toBeNull();
  }
});
