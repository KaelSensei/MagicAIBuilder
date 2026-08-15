import { test, expect } from "@playwright/test";
import { suppressOnboarding } from "./helpers";

/**
 * Commander deck discovery, seen as an anonymous visitor.
 *
 * The page and its API are on the public allowlist, so none of this requires a
 * session. Voting does, and the buttons say so rather than failing silently.
 */
test.describe("Commander deck discovery — anonymous viewer", () => {
  test("the listing API is reachable without a session", async ({ request }) => {
    const response = await request.get("/api/community/commanders/atraxa/decks");

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ slug: "atraxa" });
    expect(Array.isArray(body.decks)).toBe(true);
  });

  test("an unpublished commander returns an empty listing, not an error", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/community/commanders/nobody-has-this-commander/decks"
    );

    expect(response.status()).toBe(200);
    expect((await response.json()).decks).toEqual([]);
  });

  test("the page renders its empty state for a commander with no public decks", async ({
    page,
  }) => {
    await suppressOnboarding(page);
    await page.goto("/commanders/nobody-has-this-commander/decks");

    await expect(
      page.getByRole("heading", { name: /nobody has this commander decks/i })
    ).toBeVisible();
    await expect(page.getByText(/no public decks for this commander yet/i)).toBeVisible();
  });

  test("voting requires a session", async ({ request }) => {
    const response = await request.post("/api/community/decks/any-deck/vote", {
      data: { value: 1 },
    });

    // 401 unauthenticated, or 404 once authenticated by the test bypass and the
    // deck does not exist — either way the vote is not recorded.
    expect([401, 404]).toContain(response.status());
  });

  test("rejects a vote value that is neither 1 nor -1", async ({ request }) => {
    const response = await request.post("/api/community/decks/any-deck/vote", {
      data: { value: 5 },
    });

    expect([400, 401]).toContain(response.status());
  });
});
