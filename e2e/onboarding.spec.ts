/**
 * Where a first-time visitor meets the onboarding dialog: never by itself on a
 * public page, and still in the guest builder, whose steps it describes
 * (I-39 functional requirement 1.1,
 * docs/product/specs/i39-first-run-activation-and-measurement.md).
 *
 * No `suppressOnboarding` here: the visitor is new on purpose.
 */
import { expect, test } from "@playwright/test";

/** The dialog's accessible name: the title of its first step. */
const ONBOARDING_DIALOG = { name: "Welcome to MagicAIBuilder" } as const;

test("a first-time visitor reads the landing page without the onboarding dialog and meets it in the guest builder", async ({
  page,
}) => {
  await page.goto("/");
  // The dialog would open from an effect once the page has hydrated, so wait
  // for the page to settle before asserting that it did not.
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("dialog", ONBOARDING_DIALOG)).toHaveCount(0);

  // The click fails if a modal backdrop covers the page.
  await page
    .getByRole("region", { name: "Build the deck you mean, then see it through." })
    .getByRole("link", { name: "Start a guest deck", exact: true })
    .click();

  await expect(page).toHaveURL(/\/builder\/guest$/);
  await expect(page.getByRole("dialog", ONBOARDING_DIALOG)).toBeVisible();
});
