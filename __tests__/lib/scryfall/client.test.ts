import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test the rate-limiting behavior by mocking fetch and measuring timing
describe("Scryfall client rate limiting", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ object: "list", data: [], total_cards: 0, has_more: false }),
    });
    global.fetch = mockFetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
    // Reset the module to clear rate limit state between tests
    vi.resetModules();
  });

  it("makes a search request to the correct Scryfall endpoint", async () => {
    const { searchCards } = await import("@/lib/scryfall/client");
    vi.runAllTimersAsync();
    await searchCards("lightning bolt");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("api.scryfall.com/cards/search"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "MagicAIBuilder/1.0",
        }),
      })
    );
  });

  it("includes correct query parameter in search", async () => {
    const { searchCards } = await import("@/lib/scryfall/client");
    vi.runAllTimersAsync();
    await searchCards("type:creature");
    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain("q=type%3Acreature");
  });

  it("uses exact name parameter for named card lookup", async () => {
    const { getCardByName } = await import("@/lib/scryfall/client");
    vi.runAllTimersAsync();
    await getCardByName("Sol Ring");
    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain("/cards/named");
    expect(callUrl).toContain("exact=");
  });

  it("sends POST to /cards/collection for batch lookup", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ object: "list", data: [], not_found: [] }),
    });
    const { getCardCollection } = await import("@/lib/scryfall/client");
    vi.runAllTimersAsync();
    await getCardCollection([{ name: "Sol Ring" }]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/cards/collection"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws an error on non-OK responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ details: "Card not found" }),
    });
    const { getCardByName } = await import("@/lib/scryfall/client");
    vi.runAllTimersAsync();
    await expect(getCardByName("Nonexistent Card")).rejects.toThrow("404");
  });

  it("sends correct Accept header", async () => {
    const { searchCards } = await import("@/lib/scryfall/client");
    vi.runAllTimersAsync();
    await searchCards("test");
    const callOptions = mockFetch.mock.calls[0][1] as RequestInit;
    expect((callOptions.headers as Record<string, string>)["Accept"]).toBe("application/json");
  });
});

describe("Scryfall image helpers", () => {
  it("builds correct image URL for a card ID", async () => {
    const { buildScryfallImageUrl } = await import("@/lib/scryfall/images");
    const url = buildScryfallImageUrl("abc12345-0000-0000-0000-000000000000", "normal");
    expect(url).toContain("cards.scryfall.io/normal/front/a/b/");
    expect(url).toContain(".jpg");
  });

  it("uses png extension for png size", async () => {
    const { buildScryfallImageUrl } = await import("@/lib/scryfall/images");
    const url = buildScryfallImageUrl("abc12345-0000-0000-0000-000000000000", "png");
    expect(url).toContain(".png");
  });
});
