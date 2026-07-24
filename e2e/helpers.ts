import type { Page } from "@playwright/test";

/** localStorage key the app uses to remember the first-run onboarding was dismissed */
const ONBOARDING_LS_KEY = "mab-onboarding-done";

/**
 * Suppress the first-run onboarding wizard for the whole test.
 *
 * For unauthenticated clients (which is what the e2e harness is — auth is only
 * bypassed server-side) the wizard's "done" flag lives in localStorage. Seeding
 * it before any navigation keeps the wizard — whose backdrop intercepts pointer
 * events — from ever mounting. Must be called before the first `page.goto`.
 */
export async function suppressOnboarding(page: Page): Promise<void> {
  await page.addInitScript(
    ([key]) => {
      try {
        window.localStorage.setItem(key, "true");
      } catch {
        // localStorage may be unavailable — nothing to do
      }
    },
    [ONBOARDING_LS_KEY]
  );
}

/**
 * Create a fresh deck from the header "New Deck" button and land on the builder.
 */
export async function openBuilder(page: Page): Promise<void> {
  await suppressOnboarding(page);
  await page.goto("/decks");
  await page.click("text=New Deck");
  await page.waitForURL(/\/builder\//);
}
