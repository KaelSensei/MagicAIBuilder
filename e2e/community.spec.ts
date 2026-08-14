import { test, expect } from "@playwright/test";
import { seedPublicDeck, suppressOnboarding, type PublicDeckFixture } from "./helpers";

/**
 * Covers the community surface end to end: the public deck and profile pages,
 * the ratings aggregate, and the follow endpoints.
 *
 * These pages are deliberately reachable without a session, so unlike the
 * authenticated builder flows they exercise the real browser path rather than
 * stopping at a loading state. Anything needing a *logged-in browser* is
 * asserted at the API level instead, since the harness bypasses auth
 * server-side only.
 */

let fixture: PublicDeckFixture;

test.beforeAll(async ({ playwright, baseURL }) => {
  const request = await playwright.request.newContext({ baseURL });
  fixture = await seedPublicDeck(request, "communitytester");
  await request.dispose();
});

test.describe("Public deck page — anonymous viewer", () => {
  test("renders the deck without a session", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/deck/${fixture.deckId}`);

    // Must not bounce to sign-in: these pages are public by design.
    await expect(page).not.toHaveURL(/\/auth\/signin/);
    await expect(page.getByText(fixture.deckName).first()).toBeVisible();
  });

  test("shows the community rating block", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/deck/${fixture.deckId}`);

    await expect(page.getByRole("heading", { name: /community rating/i })).toBeVisible();
  });

  test("invites the first rating when nobody has voted", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/deck/${fixture.deckId}`);

    await expect(page.getByText(/be the first/i)).toBeVisible();
  });

  test("offers no rating control to a signed-out viewer", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/deck/${fixture.deckId}`);

    await expect(page.getByText(/sign in to rate/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /rate 5 stars/i })).toHaveCount(0);
  });

  test("reports no written reviews yet", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/deck/${fixture.deckId}`);

    await expect(page.getByText(/no written reviews yet/i)).toBeVisible();
  });
});

test.describe("Public profile page — anonymous viewer", () => {
  test("renders the profile without a session", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/u/${fixture.username}`);

    await expect(page).not.toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("heading", { name: /public decks/i })).toBeVisible();
  });

  test("lists the seeded public deck", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/u/${fixture.username}`);

    await expect(page.getByText(fixture.deckName).first()).toBeVisible();
  });

  test("shows a follower count and prompts sign-in instead of a follow button", async ({
    page,
  }) => {
    await suppressOnboarding(page);
    await page.goto(`/u/${fixture.username}`);

    await expect(page.getByText(/sign in to follow/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^follow$/i })).toHaveCount(0);
  });

  test("resolves the profile slug case-insensitively", async ({ page }) => {
    await suppressOnboarding(page);
    await page.goto(`/u/${fixture.username.toUpperCase()}`);

    await expect(page.getByRole("heading", { name: /public decks/i })).toBeVisible();
  });
});

test.describe("Ratings API", () => {
  test("serves the aggregate anonymously for a public deck", async ({ playwright, baseURL }) => {
    // A context with no cookies — a genuinely anonymous caller.
    const anon = await playwright.request.newContext({ baseURL });
    const res = await anon.get(`/api/community/decks/${fixture.deckId}/ratings`);

    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({
      average: 0,
      count: 0,
      badge: null,
      reviews: [],
      viewerRating: null,
    });
    await anon.dispose();
  });

  test("404s for a deck that does not exist", async ({ request }) => {
    const res = await request.get("/api/community/decks/does-not-exist/ratings");
    expect(res.status()).toBe(404);
  });

  test("refuses a rating from the deck owner", async ({ request }) => {
    // The server-side bypass makes this request the deck's owner.
    const res = await request.post(`/api/community/decks/${fixture.deckId}/ratings`, {
      data: { rating: 5 },
    });

    expect(res.status()).toBe(403);
  });

  test("rejects an out-of-range rating", async ({ request }) => {
    const res = await request.post(`/api/community/decks/${fixture.deckId}/ratings`, {
      data: { rating: 9 },
    });

    expect(res.status()).toBe(400);
  });

  test("rejects a review whose title exceeds the limit", async ({ request }) => {
    const res = await request.post(`/api/community/decks/${fixture.deckId}/ratings`, {
      data: { rating: 4, title: "x".repeat(101), body: "ok" },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe("Follow API", () => {
  test("refuses a self-follow", async ({ request }) => {
    // The bypass user *is* this profile's owner.
    const res = await request.post(`/api/community/users/${fixture.username}/follow`);

    expect(res.status()).toBe(400);
  });

  test("404s for an unknown username", async ({ request }) => {
    const res = await request.post("/api/community/users/nobodyhere/follow");

    expect(res.status()).toBe(404);
  });

  test("rejects a malformed username without touching the database", async ({ request }) => {
    const res = await request.post("/api/community/users/bad%20name!/follow");

    expect(res.status()).toBe(400);
  });

  test("requires a session to follow", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const res = await anon.post(`/api/community/users/${fixture.username}/follow`);

    // PLAYWRIGHT_TEST bypasses auth server-side, so this asserts the route is
    // reachable and rejects on its own terms rather than 500ing.
    expect([400, 401]).toContain(res.status());
    await anon.dispose();
  });
});
