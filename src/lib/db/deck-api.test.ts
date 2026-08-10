import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchDecks,
  createDeck,
  updateDeck,
  deleteDeck,
  duplicateDeck,
  addCard,
  removeCard,
  updateCardCategory,
  updateCardNotes,
  updateCardZone,
  updateCardMaybeboard,
  removeAllCards,
  storeSearchCache,
} from "@/lib/db/deck-api";
import { MAX_SEARCH_CACHE_BYTES } from "@/lib/cache-limits";

function mockFetch(data: unknown, ok = true, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => data,
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchDecks", () => {
  it("returns paginated deck list response", async () => {
    mockFetch({ decks: [{ id: "deck-1", name: "Test", cards: [] }], total: 1, page: 0, limit: 20 });
    const result = await fetchDecks();
    expect(result.decks).toHaveLength(1);
    expect(result.decks[0].id).toBe("deck-1");
    expect(result.total).toBe(1);
    expect(result.page).toBe(0);
    expect(result.limit).toBe(20);
  });

  it("throws on error", async () => {
    mockFetch(null, false, 500);
    await expect(fetchDecks()).rejects.toThrow("HTTP 500");
  });
});

describe("createDeck", () => {
  it("creates a deck with a name", async () => {
    mockFetch({ id: "new-deck", name: "My Deck", cards: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    const deck = await createDeck("My Deck");
    expect(deck.id).toBe("new-deck");
    expect(deck.name).toBe("My Deck");
  });

  it("accepts optional format and bracket", async () => {
    mockFetch({ id: "d1", name: "T", cards: [], createdAt: "", updatedAt: "" });
    await createDeck("T", { format: "brawl", targetBracket: 3 });
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.format).toBe("brawl");
    expect(body.targetBracket).toBe(3);
  });
});

describe("updateDeck", () => {
  it("patches a deck by id", async () => {
    mockFetch({ id: "deck-1", name: "Renamed", cards: [] });
    const result = await updateDeck("deck-1", { name: "Renamed" });
    expect(result.name).toBe("Renamed");
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/api/decks/deck-1");
    expect(call[1].method).toBe("PATCH");
  });
});

describe("deleteDeck", () => {
  it("calls DELETE on the deck endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await deleteDeck("deck-1");
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/api/decks/deck-1");
    expect(call[1].method).toBe("DELETE");
  });

  it("throws on error", async () => {
    mockFetch(null, false, 404);
    await expect(deleteDeck("missing")).rejects.toThrow("HTTP 404");
  });
});

describe("duplicateDeck", () => {
  it("POSTs to the duplicate endpoint", async () => {
    mockFetch({ id: "copy-1", name: "Copy of Deck" });
    const result = await duplicateDeck("deck-1");
    expect(result.id).toBe("copy-1");
    const call = vi.mocked(global.fetch).mock.calls[0];
    expect(call[0]).toContain("/api/decks/deck-1/duplicate");
    expect((call[1] as RequestInit).method).toBe("POST");
  });

  it("throws on error", async () => {
    mockFetch(null, false, 500);
    await expect(duplicateDeck("deck-1")).rejects.toThrow("HTTP 500");
  });
});

describe("updateCardMaybeboard", () => {
  it("patches isMaybeboard flag on a card", async () => {
    mockFetch({ id: "card-1", isMaybeboard: true });
    const result = await updateCardMaybeboard("deck-1", "card-1", true);
    expect(result.isMaybeboard).toBe(true);
    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0][1]?.body as string);
    expect(body.isMaybeboard).toBe(true);
  });

  it("throws on error", async () => {
    mockFetch(null, false, 500);
    await expect(updateCardMaybeboard("deck-1", "card-1", true)).rejects.toThrow("HTTP 500");
  });
});

describe("addCard", () => {
  it("POSTs a card to the deck", async () => {
    const saved = { id: "db-card-1", name: "Sol Ring", deckId: "deck-1", isCommander: false, isPartner: false };
    mockFetch(saved);
    const result = await addCard("deck-1", { scryfallId: "sf-1", name: "Sol Ring" });
    expect(result.id).toBe("db-card-1");
  });

  it("throws on failure", async () => {
    mockFetch(null, false, 400);
    await expect(addCard("deck-1", { scryfallId: "sf-1", name: "X" })).rejects.toThrow("HTTP 400");
  });
});

describe("removeCard", () => {
  it("calls DELETE on the card endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await removeCard("deck-1", "card-1");
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/api/decks/deck-1/cards/card-1");
    expect(call[1].method).toBe("DELETE");
  });
});

describe("updateCardCategory", () => {
  it("patches card category", async () => {
    mockFetch({ id: "card-1", category: "land" });
    await updateCardCategory("deck-1", "card-1", "land");
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.category).toBe("land");
  });
});

describe("updateCardNotes", () => {
  it("patches card notes", async () => {
    mockFetch({ id: "card-1", notes: "Good card" });
    await updateCardNotes("deck-1", "card-1", "Good card");
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.notes).toBe("Good card");
  });

  it("accepts null notes to clear", async () => {
    mockFetch({ id: "card-1", notes: null });
    await updateCardNotes("deck-1", "card-1", null);
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.notes).toBeNull();
  });
});

describe("updateCardZone", () => {
  it("patches card zone to maybeboard", async () => {
    mockFetch({ id: "card-1", zone: "maybeboard" });
    const result = await updateCardZone("deck-1", "card-1", "maybeboard");
    expect(result.zone).toBe("maybeboard");
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.zone).toBe("maybeboard");
  });

  it("patches card zone to main", async () => {
    mockFetch({ id: "card-1", zone: "main" });
    const result = await updateCardZone("deck-1", "card-1", "main");
    expect(result.zone).toBe("main");
  });

  it("throws on error", async () => {
    mockFetch(null, false, 500);
    await expect(updateCardZone("deck-1", "card-1", "maybeboard")).rejects.toThrow("HTTP 500");
  });
});

describe("removeAllCards", () => {
  it("calls DELETE on the cards collection endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await removeAllCards("deck-1");
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/api/decks/deck-1/cards");
    expect(call[1].method).toBe("DELETE");
  });

  it("throws on error", async () => {
    mockFetch(null, false, 500);
    await expect(removeAllCards("deck-1")).rejects.toThrow("HTTP 500");
  });
});

// Test lookupCardCache and storeCardCache
import { lookupCardCache, storeCardCache } from "@/lib/db/deck-api";

describe("lookupCardCache", () => {
  it("returns null when not in cache", async () => {
    mockFetch({ hit: false }, true, 200);
    const result = await lookupCardCache("missing-id");
    expect(result).toBeNull();
  });

  it("returns data when cache hit", async () => {
    mockFetch({ hit: true, data: { id: "card-1", name: "Sol Ring" } }, true, 200);
    const result = await lookupCardCache("card-1");
    expect((result as { id: string })?.id).toBe("card-1");
  });

  it("returns null on fetch error", async () => {
    mockFetch(null, false, 500);
    const result = await lookupCardCache("error-id");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const result = await lookupCardCache("any-id");
    expect(result).toBeNull();
  });
});

describe("storeCardCache", () => {
  it("POSTs to cache endpoint", async () => {
    mockFetch({});
    await storeCardCache("card-id", { name: "Sol Ring" });
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/api/cache/cards");
    expect(call[1].method).toBe("POST");
  });

  it("does not throw on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    await expect(storeCardCache("id", {})).resolves.toBeUndefined();
  });
});

describe("storeSearchCache", () => {
  it("POSTs the search result to the cache endpoint", async () => {
    mockFetch({});
    await storeSearchCache("t:goblin", 1, { cards: ["a"] });
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/api/cache/search");
    expect(call[1].method).toBe("POST");
  });

  it("skips the POST when the payload exceeds the server cache limit", async () => {
    mockFetch({});
    const oversized = { blob: "x".repeat(MAX_SEARCH_CACHE_BYTES + 1) };
    await storeSearchCache("t:goblin", 1, oversized);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not throw on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    await expect(storeSearchCache("q", 1, {})).resolves.toBeUndefined();
  });
});
