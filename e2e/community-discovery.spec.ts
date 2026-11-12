import type { APIRequestContext } from "@playwright/test";
import { test, expect, type SeededDecks } from "./fixtures";
import { suppressOnboarding } from "./helpers";

/**
 * Seeds a public deck whose commanderName is set the way setCommander sets it,
 * so the listing's SQL slug match has something to find. The `seededDeck`
 * fixture creates the deck and deletes it after the test.
 */
async function seedCommanderDeck(
  request: APIRequestContext,
  seededDeck: SeededDecks,
  name: string,
  commanderName: string
): Promise<string> {
  const id = await seededDeck.create({ name });

  const patched = await request.patch(`/api/decks/${id}`, {
    data: { commanderName, isPublic: true },
  });
  expect(patched.ok(), await patched.text()).toBe(true);
  return id;
}

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

  /**
   * The builder's "Community decks" link reaches this for any commander being
   * built, so it is an empty state, not a 404. It is thin content, though, so
   * it carries noindex and no canonical URL.
   */
  test("the page renders its empty state for a commander with no public decks, kept out of the index", async ({
    page,
  }) => {
    await suppressOnboarding(page);
    await page.goto("/commanders/nobody-has-this-commander/decks");

    await expect(
      page.getByRole("heading", { name: /nobody has this commander decks/i })
    ).toBeVisible();
    await expect(page.getByText(/no public decks for this commander yet/i)).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test("finds a public deck by its commander slug, apostrophes and all", async ({
    request,
    seededDeck,
  }) => {
    // Exercises the SQL slug expression against real Postgres — the unit tests
    // can only mock it. The name carries a comma and an apostrophe, the two
    // characters commanderToSlug strips.
    const deckId = await seedCommanderDeck(
      request,
      seededDeck,
      "Discovery Fixture",
      "Kroxa, Titan of Death's Hunger"
    );

    const response = await request.get(
      "/api/community/commanders/kroxa-titan-of-deaths-hunger/decks"
    );

    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      commanderName: string | null;
      decks: readonly { id: string }[];
    };
    expect(body.commanderName).toBe("Kroxa, Titan of Death's Hunger");
    expect(body.decks.map((d) => d.id)).toContain(deckId);
  });

  test("finds a public deck by the slug EDHREC uses for an accented commander", async ({
    request,
    seededDeck,
  }) => {
    // The SQL slug transliterates "û" to "u" as commanderToSlug does, so the
    // page the sitemap and the builder link to lists the deck.
    const deckId = await seedCommanderDeck(
      request,
      seededDeck,
      "Accented Discovery Fixture",
      "Lim-Dûl the Necromancer"
    );

    const response = await request.get(
      "/api/community/commanders/lim-dul-the-necromancer/decks"
    );

    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      decks: readonly { id: string }[];
    };
    expect(body.decks.map((d) => d.id)).toContain(deckId);
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
