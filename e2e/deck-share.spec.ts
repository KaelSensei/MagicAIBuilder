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
 * The share link is also opened in the light theme, where the header of a
 * deck without commander art is a white surface: its text must take the
 * theme's colours, not white (I-13, design audit S5).
 *
 * @module e2e/deck-share
 */
import type { APIRequestContext, Page } from "@playwright/test";
import { THEME_STORAGE_KEY } from "@/lib/theme/preference";
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

/**
 * The light theme's `--text-secondary` (#5c5470 in `src/styles/globals.css`),
 * as the browser computes it.
 */
const LIGHT_THEME_SECONDARY_TEXT = "rgb(92, 84, 112)";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Opens a share link for the deck through the API, as its owner.
 *
 * @returns the link's token
 */
async function shareTokenFor(
  request: APIRequestContext,
  deckId: string
): Promise<string> {
  const created = await request.post(`/api/decks/${deckId}/share`);
  expect(created.ok(), await created.text()).toBe(true);
  const body: unknown = await created.json();
  const token =
    isRecord(body) && typeof body.shareToken === "string"
      ? body.shareToken
      : "";
  expect(token).not.toBe("");
  return token;
}

/**
 * Stores an explicit light-theme choice before the page loads, the way the
 * theme switch persists it, so the boot script paints `data-theme="light"`.
 */
async function chooseLightTheme(page: Page): Promise<void> {
  await page.addInitScript(
    ([key]) => {
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({ state: { theme: "light", preference: "light" } })
        );
      } catch {
        // localStorage may be unavailable — the page stays dark
      }
    },
    [THEME_STORAGE_KEY]
  );
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

    const token = await shareTokenFor(request, deckId);

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

  test("a share link reads in the light theme: the header writes the format and the card count in the theme's secondary text colour", async ({
    page,
    request,
    seededDeck,
  }) => {
    const deckId = await seededDeck.create(SHARE_DECK);
    const token = await shareTokenFor(request, deckId);

    await suppressOnboarding(page);
    await chooseLightTheme(page);
    await page.goto(`/share/${token}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // The seeded deck has no commander, so no art: the header is the plain
    // surface, white in the light theme (I-13, design audit S5).
    const header = page.getByTestId("share-header");
    const format = header.getByText("commander", { exact: true });
    const cardCount = header.getByText("1 card", { exact: true });
    await expect(format).toBeVisible();
    await expect(format).toHaveCSS("color", LIGHT_THEME_SECONDARY_TEXT);
    await expect(cardCount).toBeVisible();
    await expect(cardCount).toHaveCSS("color", LIGHT_THEME_SECONDARY_TEXT);
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
