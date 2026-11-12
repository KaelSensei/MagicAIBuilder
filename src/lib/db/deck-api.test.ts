import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fetchDecks,
  fetchDeck,
  createDeck,
  updateDeck,
  deleteDeck,
  duplicateDeck,
  forkPublicDeck,
  addCard,
  removeCard,
  updateCardCategory,
  updateCardNotes,
  updateCardZone,
} from "@/lib/db/deck-api";

function mockFetch(data: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      json: async () => data,
    })
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchDecks", () => {
  it("returns paginated deck list response", async () => {
    mockFetch({
      decks: [{ id: "deck-1", name: "Test", cards: [] }],
      total: 1,
      page: 0,
      limit: 20,
    });
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

  it("stops waiting when the deck list request stalls", async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          (_url: string, options?: RequestInit) =>
            new Promise((_resolve, reject) => {
              options?.signal?.addEventListener("abort", () =>
                reject(new DOMException("Aborted", "AbortError"))
              );
            })
        )
      );
      const request = fetchDecks();
      const failure = expect(request).rejects.toThrow("Aborted");

      await vi.advanceTimersByTimeAsync(15_000);

      await failure;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("fetchDeck", () => {
  it("aborts a stalled deck detail request after fifteen seconds", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(
        (_url: string, options?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          })
      );
      vi.stubGlobal("fetch", fetchMock);
      const request = fetchDeck("deck-1");
      const outcome = request.catch(() => undefined);

      await vi.advanceTimersByTimeAsync(15_000);

      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
      await outcome;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("createDeck", () => {
  it("creates a deck with a name", async () => {
    mockFetch({
      id: "new-deck",
      name: "My Deck",
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const deck = await createDeck("My Deck");
    expect(deck.id).toBe("new-deck");
    expect(deck.name).toBe("My Deck");
  });

  it("accepts optional format and bracket", async () => {
    mockFetch({ id: "d1", name: "T", cards: [], createdAt: "", updatedAt: "" });
    await createDeck("T", { format: "brawl", targetBracket: 3 });
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
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

describe("forkPublicDeck", () => {
  it("POSTs to the fork endpoint", async () => {
    mockFetch({ id: "fork-1", name: "Public list (Fork)" });
    const result = await forkPublicDeck("public-1");
    expect(result.id).toBe("fork-1");
    const call = vi.mocked(global.fetch).mock.calls[0];
    expect(call[0]).toContain("/api/decks/public-1/fork");
    expect((call[1] as RequestInit).method).toBe("POST");
  });

  it("surfaces a failed public fork", async () => {
    mockFetch(null, false, 404);
    await expect(forkPublicDeck("private-1")).rejects.toThrow("HTTP 404");
  });
});

describe("addCard", () => {
  it("POSTs a card to the deck", async () => {
    const saved = {
      id: "db-card-1",
      name: "Sol Ring",
      deckId: "deck-1",
      isCommander: false,
      isPartner: false,
    };
    mockFetch(saved);
    const result = await addCard("deck-1", {
      scryfallId: "sf-1",
      name: "Sol Ring",
    });
    expect(result.id).toBe("db-card-1");
  });

  it("throws on failure", async () => {
    mockFetch(null, false, 400);
    await expect(
      addCard("deck-1", { scryfallId: "sf-1", name: "X" })
    ).rejects.toThrow("HTTP 400");
  });
});

describe("removeCard", () => {
  it("calls DELETE on the card endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
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
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.category).toBe("land");
  });
});

describe("updateCardNotes", () => {
  it("patches card notes", async () => {
    mockFetch({ id: "card-1", notes: "Good card" });
    await updateCardNotes("deck-1", "card-1", "Good card");
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.notes).toBe("Good card");
  });

  it("accepts null notes to clear", async () => {
    mockFetch({ id: "card-1", notes: null });
    await updateCardNotes("deck-1", "card-1", null);
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.notes).toBeNull();
  });
});

describe("updateCardZone", () => {
  it("patches card zone to maybeboard", async () => {
    mockFetch({ id: "card-1", zone: "maybeboard" });
    const result = await updateCardZone("deck-1", "card-1", "maybeboard");
    expect(result.zone).toBe("maybeboard");
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.zone).toBe("maybeboard");
  });

  it("patches card zone to main", async () => {
    mockFetch({ id: "card-1", zone: "main" });
    const result = await updateCardZone("deck-1", "card-1", "main");
    expect(result.zone).toBe("main");
  });

  it("throws on error", async () => {
    mockFetch(null, false, 500);
    await expect(
      updateCardZone("deck-1", "card-1", "maybeboard")
    ).rejects.toThrow("HTTP 500");
  });
});
