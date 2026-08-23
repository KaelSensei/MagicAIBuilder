/**
 * The deck API client used to throw a bare `HTTP 500: Internal Server Error`,
 * which told neither the user nor us anything. These cover the message it now
 * builds from the server's own `error` field.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { createDeck, fetchDecks, addCard } from "@/lib/db/deck-api";

function mockErrorResponse(status: number, body: unknown, ok = false) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: "Internal Server Error",
      json: async () => body,
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("deck API error reporting", () => {
  it("includes the server's reason in the thrown message", async () => {
    mockErrorResponse(500, { error: "Failed to create deck" });
    await expect(createDeck("My Deck")).rejects.toThrow(
      "[createDeck] HTTP 500: Failed to create deck"
    );
  });

  it("names the operation that failed", async () => {
    mockErrorResponse(500, { error: "Failed to fetch decks" });
    await expect(fetchDecks()).rejects.toThrow("[fetchDecks]");
  });

  it("falls back to the status alone when the body carries no error field", async () => {
    mockErrorResponse(503, { somethingElse: true });
    await expect(createDeck("My Deck")).rejects.toThrow(
      "[createDeck] HTTP 503"
    );
  });

  it("survives a non-JSON error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON");
        },
      })
    );
    await expect(createDeck("My Deck")).rejects.toThrow(
      "[createDeck] HTTP 502"
    );
  });

  it("truncates an over-long server message", async () => {
    mockErrorResponse(400, { error: "x".repeat(500) });
    await expect(addCard("deck-1", { scryfallId: "a", name: "b" })).rejects.toThrow(
      /^\[addCard\] HTTP 400: x{200}$/
    );
  });

  it("does not throw when the response is ok", async () => {
    mockErrorResponse(200, { id: "deck-1" }, true);
    await expect(createDeck("My Deck")).resolves.toEqual({ id: "deck-1" });
  });
});
