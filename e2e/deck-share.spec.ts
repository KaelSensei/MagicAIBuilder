/**
 * Sharing a deck with someone who is not signed in. The browser of this
 * project holds no session, so every page it opens is what a visitor with the
 * link sees; the API calls run as the deck's owner through the server-side
 * test bypass.
 *
 * Two doors are covered: the visibility switch, which makes `/deck/{id}`
 * public or private, and the share link `/share/{token}`, created and revoked
 * through the API. The builder mounts no control for the share link
 * (`SharePopover` is unmounted, audit §6.1), so the API is the only way to
 * create one today; that is reported as a follow-up.
 *
 * @module e2e/deck-share
 */
import { test, expect } from "./fixtures";
import {
  fixtureCards,
  getThroughApi,
  openDeckInListView,
  suppressOnboarding,
  waitForBuilder,
  type DeckSeed,
} from "./helpers";

const SHARE_DECK: DeckSeed = {
  name: "Deck Share Journey",
  cards: fixtureCards(1),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

test.describe("Deck sharing with a signed-out visitor", () => {
  test("the visibility switch opens the public page and closes it again", async ({
    page,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(SHARE_DECK);
    await openDeckInListView(page, deckId);

    const published = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().endsWith(`/api/decks/${deckId}`)
    );
    await page.getByRole("switch", { name: "Make deck public" }).click();
    expect((await published).ok()).toBe(true);
    const makePrivate = page.getByRole("switch", { name: "Make deck private" });
    await expect(makePrivate).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("link", { name: "View", exact: true })
    ).toHaveAttribute("href", new RegExp(`/deck/${deckId}$`));

    await page.goto(`/deck/${deckId}`);
    await expect(page).not.toHaveURL(/\/auth\/signin/);
    await expect(page.getByText("Deck Share Journey").first()).toBeVisible();

    await page.goto(`/builder/${deckId}`);
    await waitForBuilder(page);
    const unpublished = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().endsWith(`/api/decks/${deckId}`)
    );
    await page.getByRole("switch", { name: "Make deck private" }).click();
    expect((await unpublished).ok()).toBe(true);
    await expect(
      page.getByRole("switch", { name: "Make deck public" })
    ).toHaveAttribute("aria-checked", "false");

    await page.goto(`/deck/${deckId}`);
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible();
  });

  test("a share link opens a private deck, and revoking it closes the API behind the page", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(SHARE_DECK);

    const created = await request.post(`/api/decks/${deckId}/share`);
    expect(created.ok(), await created.text()).toBe(true);
    const body: unknown = await created.json();
    const token =
      isRecord(body) && typeof body.shareToken === "string"
        ? body.shareToken
        : "";
    expect(token).not.toBe("");

    await suppressOnboarding(page);
    await page.goto(`/share/${token}`);
    await expect(page).not.toHaveURL(/\/auth\/signin/);
    await expect(
      page.getByRole("heading", { name: "Deck Share Journey" })
    ).toBeVisible();

    const revoked = await request.delete(`/api/decks/${deckId}/share`);
    expect(revoked.ok(), await revoked.text()).toBe(true);
    // The page reads the deck through this route and caches the answer for 60 s
    // (`share/[token]/page.tsx`, `revalidate: 60`), so the route, not the page,
    // is what proves the link is closed right away.
    const closed = await getThroughApi(request, `/api/share/${token}`);
    expect(closed.status()).toBe(404);
  });

  test("a token that was never issued is a not-found page", async ({
    page,
  }) => {
    await suppressOnboarding(page);
    await page.goto("/share/never-issued-token");
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible();
  });
});
