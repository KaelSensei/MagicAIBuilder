/**
 * Proxy export UI + print-preview smoke tests.
 *
 * **Requires a reachable Postgres** (`DATABASE_URL`, same as `pnpm dev`). Without it,
 * `POST /api/decks` fails and these tests time out on navigation to `/builder/...`.
 * CI: use `docker-compose.e2e.yml` (migrate + playwright with DB).
 */
import { test, expect, type Page } from "@playwright/test";

/**
 * Avoid first-run onboarding overlay (Radix) blocking clicks on the home page.
 */
async function dismissOnboardingLocalStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("mab-onboarding-done", "true");
    } catch {
      /* ignore */
    }
  });
}

/** Empty state uses "Create Deck"; non-empty grid uses the dashed "New Deck" tile (last match). */
async function createDeckAndOpenBuilder(page: Page): Promise<void> {
  await page.goto("/decks");
  await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();

  const createDeckBtn = page.getByRole("button", { name: "Create Deck" });
  if (await createDeckBtn.isVisible().catch(() => false)) {
    await createDeckBtn.click();
  } else {
    await page.getByRole("button", { name: "New Deck" }).last().click();
  }

  await page.waitForURL(/\/builder\//, { timeout: 60_000 });
}

test.describe("Proxy export (print / PDF)", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboardingLocalStorage(page);
  });

  test("text-only mode enables Print without preload; card art requires preload", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await createDeckAndOpenBuilder(page);

    const search = page.getByTestId("search-input");
    await search.fill("Grizzly Bears");

    const grizzly = page.getByAltText(/^Grizzly Bears$/i).first();
    await expect(grizzly).toBeVisible({ timeout: 15_000 });
    await grizzly.click();

    await expect(page.getByRole("heading", { name: /Grizzly Bears/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Loading printings…")).not.toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /Grizzly Bears —/i }).first().click();

    await page.getByRole("button", { name: "Export", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Export Options" })).toBeVisible();

    await page.getByRole("button", { name: /Export Proxy Sheets/i }).click();
    await expect(page.getByRole("heading", { name: "Export Proxy Sheets" })).toBeVisible();

    const printBtn = page.getByRole("button", { name: "Print / Save PDF" });
    const preloadBtn = page.getByRole("button", { name: "Preload Images" });

    await expect(printBtn).toBeDisabled();
    await expect(preloadBtn).toBeEnabled();

    await page.getByRole("button", { name: "Text only" }).click();

    await expect(printBtn).toBeEnabled();
    await expect(preloadBtn).toBeDisabled();

    await page.getByRole("button", { name: "Card art" }).click();

    await expect(printBtn).toBeDisabled();
    await expect(preloadBtn).toBeEnabled();
  });

  test("text-only print preview document uses fallback layout (no img tags)", async ({
    page,
    context,
  }) => {
    test.setTimeout(120_000);

    await createDeckAndOpenBuilder(page);

    await page.getByTestId("search-input").fill("Grizzly Bears");
    const grizzly = page.getByAltText(/^Grizzly Bears$/i).first();
    await expect(grizzly).toBeVisible({ timeout: 15_000 });
    await grizzly.click();
    await expect(page.getByRole("heading", { name: /Grizzly Bears/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Loading printings…")).not.toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /Grizzly Bears —/i }).first().click();

    await page.getByRole("button", { name: "Export", exact: true }).click();
    await page.getByRole("button", { name: /Export Proxy Sheets/i }).click();
    await page.getByRole("button", { name: "Text only" }).click();

    const popupWait = context.waitForEvent("page", { timeout: 15_000 });
    await page.getByRole("button", { name: "Print / Save PDF" }).click();
    const popup = await popupWait;
    await popup.waitForLoadState("domcontentloaded");

    const bodyHtml = await popup.locator("body").innerHTML();
    expect(bodyHtml).toContain("card-fallback");
    expect(bodyHtml).not.toContain("card-img");

    await popup.close();
  });
});
