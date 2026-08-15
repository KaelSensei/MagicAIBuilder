import { test, expect } from "@playwright/test";

/**
 * Contract and performance tests for critical API endpoints, under
 * PLAYWRIGHT_TEST=1 (auto-login, real DB).
 *
 * The timing assertions are tagged @perf and excluded from the pre-push gate.
 * The harness runs `next dev`, which compiles each route on first request: the
 * same endpoint measured 41ms alone and 5163ms inside the full suite, purely
 * from bundler contention. Gating on wall-clock latency there measures the dev
 * server, not the endpoint. The contract assertions below always run.
 *
 * Run the timing checks deliberately with PLAYWRIGHT_GREP_INVERT="".
 */
test.describe("API Performance", () => {
  test("GET /api/decks returns a paginated listing envelope", async ({ request }) => {
    const response = await request.get("/api/decks");
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body).toHaveProperty("decks");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page", 0);
    expect(body).toHaveProperty("limit");
    expect(Array.isArray(body.decks)).toBe(true);
  });

  test("@perf GET /api/decks responds under 1 second", async ({ request }) => {
    await request.get("/api/decks"); // warm-up: compile the route

    const start = Date.now();
    const response = await request.get("/api/decks");
    const duration = Date.now() - start;

    expect(response.ok()).toBe(true);
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

  test("GET /api/user/init returns onboarding state and collection", async ({ request }) => {
    const response = await request.get("/api/user/init");
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body).toHaveProperty("onboardingDone");
    expect(body).toHaveProperty("collection");
  });

  test("@perf GET /api/user/init responds under 1 second", async ({ request }) => {
    await request.get("/api/user/init"); // warm-up: compile the route

    const start = Date.now();
    const response = await request.get("/api/user/init");
    const duration = Date.now() - start;

    expect(response.ok()).toBe(true);
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

    // Add a non-commander card. `scryfallId` must be a real Scryfall UUID —
    // addCardSchema rejects anything else with a 400, and this write used to
    // go unchecked, so the deck stayed empty and the count assertion below
    // failed with no indication why.
    const addRes = await request.post(`/api/decks/${deckId}/cards`, {
      data: {
        scryfallId: "e3285e6b-3e79-4d7c-bf96-d920f973b122",
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
    expect(addRes.status(), `add card failed: ${await addRes.text()}`).toBe(201);

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
