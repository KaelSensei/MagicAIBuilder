import { test, expect } from "@playwright/test";
import { openBuilder } from "./helpers";

/**
 * The deck list, seen by a signed-in user.
 *
 * `decks/page.tsx` returns early unless `sessionStatus === "authenticated"`,
 * and the e2e harness bypasses auth **server-side only** — so for the rest of
 * the suite this screen is permanently "Loading…". The flow below was written
 * against it and then marked `test.skip` for that reason, with a comment saying
 * it "needs a real login / storageState". This project supplies one:
 * `auth.setup.ts` signs in through the app's own form and saves the browser
 * state, and everything ending in `.authed.spec.ts` runs against it.
 *
 * Worth naming, because a skipped test is easy to read as a low-value one: the
 * neighbouring `search.spec.ts` assertions navigate through this same list, so
 * they were only ever shallowly green — they passed on the header's New Deck
 * button, never on the list rendering anything.
 */
test.describe("Deck list (signed in)", () => {
  test("a deck created in the builder appears on the deck list", async ({ page }) => {
    await openBuilder(page);

    await page.goto("/decks");

    // Filtered rather than .first(): the account persists across runs on a warm
    // volume, so the newest deck is not reliably the top row.
    const created = page
      .getByTestId("deck-card")
      .filter({ hasText: "New Deck" });
    await expect(created.first()).toBeVisible();
  });

  test("the list renders rather than sitting on its loading branch", async ({ page }) => {
    await page.goto("/decks");

    // The signed-out branch is what the rest of the suite gets. If the saved
    // session ever stops being applied, this is the assertion that says so
    // instead of the flow above timing out on a selector.
    await expect(page.getByRole("button", { name: "User menu" })).toBeVisible();

    // Deliberately not an assertion on any deck: this must hold on a cold
    // database, where the account owns nothing. What it pins is that the page
    // left its loading branch at all - the subtitle reads "Loading…" until the
    // fetch returns, and never returns without a client session.
    await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
    await expect(page.getByText("Loading...", { exact: true })).toHaveCount(0);

    // Visibility assertions alone cannot see a modal: the onboarding backdrop
    // covers the page without hiding anything, which is how it swallowed the
    // clicks in the first run of this file while every visible-element check
    // still passed. This one names the dialog.
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
