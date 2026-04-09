import { test, expect } from "@playwright/test";

/**
 * E2E performance tests for critical API endpoints.
 * Measures response time under PLAYWRIGHT_TEST=1 (auto-login, real DB).
 */
test.describe("API Performance", () => {
  test("GET /api/decks responds under 1 second", async ({ request }) => {
    const start = Date.now();
    const response = await request.get("/api/decks");
    const duration = Date.now() - start;

    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body).toHaveProperty("decks");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page", 0);
    expect(body).toHaveProperty("limit");
    expect(Array.isArray(body.decks)).toBe(true);

    // eslint-disable-next-line no-console -- performance reporting
    console.log(`GET /api/decks: ${duration}ms (${body.decks.length} decks, ${body.total} total)`);
    expect(duration).toBeLessThan(1000);
  });

  test("GET /api/decks supports pagination params", async ({ request }) => {
    const response = await request.get("/api/decks?page=0&limit=5");
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.page).toBe(0);
    expect(body.limit).toBe(5);
    expect(body.decks.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/user/init responds under 1 second", async ({ request }) => {
    const start = Date.now();
    const response = await request.get("/api/user/init");
    const duration = Date.now() - start;

    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body).toHaveProperty("onboardingDone");
    expect(body).toHaveProperty("collection");

    // eslint-disable-next-line no-console -- performance reporting
    console.log(`GET /api/user/init: ${duration}ms (${body.collection.length} collection cards)`);
    expect(duration).toBeLessThan(1000);
  });

  test("GET /api/decks returns only commander/partner/companion cards, not all cards", async ({ request }) => {
    // Create a deck with a card first
    const createRes = await request.post("/api/decks", {
      data: { name: "Perf Test Deck" },
    });
    expect(createRes.ok()).toBe(true);
    const created = await createRes.json();
    const deckId = created.id;

    // Add a non-commander card
    await request.post(`/api/decks/${deckId}/cards`, {
      data: {
        scryfallId: "test-card-1",
        name: "Lightning Bolt",
        manaCost: "{R}",
        cmc: 1,
        typeLine: "Instant",
        oracleText: "Deal 3 damage.",
        colorIdentity: ["R"],
        category: "instant",
        quantity: 1,
      },
    });

    // Fetch listing — should NOT include the non-commander card
    const listRes = await request.get("/api/decks");
    expect(listRes.ok()).toBe(true);
    const listing = await listRes.json();
    const testDeck = listing.decks.find((d: { id: string }) => d.id === deckId);

    expect(testDeck).toBeDefined();
    expect(testDeck.cards).toHaveLength(0); // No commander/partner/companion
    expect(testDeck._count.cards).toBe(1); // But card count reflects the Lightning Bolt

    // Fetch full deck — should include the card
    const fullRes = await request.get(`/api/decks/${deckId}`);
    const fullDeck = await fullRes.json();
    expect(fullDeck.cards).toHaveLength(1);
    expect(fullDeck.cards[0].name).toBe("Lightning Bolt");

    // Cleanup
    await request.delete(`/api/decks/${deckId}`);
  });
});
