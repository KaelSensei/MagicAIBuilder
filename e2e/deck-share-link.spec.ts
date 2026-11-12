/**
 * The share link through the builder's own control, as a player uses it.
 *
 * The browser of this project holds no session; outside production the
 * server's test bypass signs it in as the fixed Playwright user, who owns the
 * seeded deck. So the same browser plays both parts: the owner in the builder,
 * and the visitor who opens `/share/{token}`.
 *
 * The journey: open the share popover from the deck actions, switch the link
 * on, copy it, open it, revoke it from the popover, and see the page refuse the
 * link at once. That last step is the point of OD-12: the share page caches the
 * deck for a minute per token, and revoking purges that entry, so the page
 * itself, not only the API behind it, proves the link is closed.
 *
 * `deck-share.spec.ts` (P1-14) covers the API path and the visibility switch.
 *
 * @module e2e/deck-share-link
 */
import { test, expect } from "./fixtures";
import { fixtureCards, suppressOnboarding, type DeckSeed } from "./helpers";

const SHARE_DECK: DeckSeed = {
  name: "Deck Share Link Journey",
  cards: fixtureCards(1),
};

/** The token at the end of a share URL, absolute or relative. */
function tokenOf(shareUrl: string): string {
  const match = /\/share\/([\w-]+)$/.exec(shareUrl);
  return match?.[1] ?? "";
}

test.describe("Deck share link from the builder", () => {
  test("creates a link from the popover, copies it, opens it, and revoking closes the page at once", async ({
    page,
    context,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(SHARE_DECK);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await suppressOnboarding(page);
    await page.goto(`/builder/${deckId}`);
    await page
      .getByRole("link", { name: "Back to my decks" })
      .waitFor({ state: "visible" });

    // Create
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Share deck" });
    await expect(dialog).toBeVisible();
    const created = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith(`/api/decks/${deckId}/share`)
    );
    await dialog.getByRole("switch", { name: "Enable sharing" }).click();
    expect((await created).ok()).toBe(true);
    const link = dialog.getByRole("textbox", { name: "Share link" });
    await expect(link).toBeVisible();
    const shareUrl = await link.inputValue();
    const token = tokenOf(shareUrl);
    expect(token).not.toBe("");

    // Copy
    await dialog.getByRole("button", { name: "Copy link" }).click();
    await expect(dialog.getByRole("button", { name: "Copied!" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      shareUrl
    );

    // Open as a visitor
    await page.goto(`/share/${token}`);
    await expect(page).not.toHaveURL(/\/auth\/signin/);
    await expect(
      page.getByRole("heading", { name: "Deck Share Link Journey" })
    ).toBeVisible();

    // Revoke from the popover: the deck remembers its link is live
    await page.goto(`/builder/${deckId}`);
    await page
      .getByRole("link", { name: "Back to my decks" })
      .waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const revoked = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().endsWith(`/api/decks/${deckId}/share`)
    );
    await page
      .getByRole("dialog", { name: "Share deck" })
      .getByRole("switch", { name: "Disable sharing" })
      .click();
    expect((await revoked).ok()).toBe(true);
    await expect(
      page
        .getByRole("dialog", { name: "Share deck" })
        .getByRole("switch", { name: "Enable sharing" })
    ).toHaveAttribute("aria-checked", "false");

    // The page, not only the API, refuses the link right away (OD-12)
    await page.goto(`/share/${token}`);
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible();
  });
});
