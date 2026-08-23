/**
 * loadDecks used to swallow its failure, so a 500 rendered as "No decks yet" —
 * an outage disguised as an empty account. These pin the recorded error.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/db/deck-api", () => ({
  fetchDecks: vi.fn(),
}));

import * as deckApi from "@/lib/db/deck-api";
import { useDeckStore } from "@/lib/deck/store";

const fetchDecks = deckApi.fetchDecks as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  useDeckStore.setState({ decks: {}, loadError: null, isSyncing: false });
});

describe("useDeckStore.loadDecks — failure reporting", () => {
  it("starts with no load error", () => {
    expect(useDeckStore.getState().loadError).toBeNull();
  });

  it("records the reason when the listing request fails", async () => {
    fetchDecks.mockRejectedValue(
      new Error("[fetchDecks] HTTP 500: Failed to fetch decks")
    );

    await useDeckStore.getState().loadDecks();

    expect(useDeckStore.getState().loadError).toBe(
      "[fetchDecks] HTTP 500: Failed to fetch decks"
    );
    expect(useDeckStore.getState().decks).toEqual({});
  });

  it("does not leave isSyncing stuck after a failure", async () => {
    fetchDecks.mockRejectedValue(new Error("boom"));
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });

  it("falls back to a generic reason for a non-Error rejection", async () => {
    fetchDecks.mockRejectedValue("just a string");
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().loadError).toBe("Failed to load decks");
  });

  it("clears a previous error once the listing succeeds", async () => {
    fetchDecks.mockRejectedValue(new Error("boom"));
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().loadError).not.toBeNull();

    fetchDecks.mockResolvedValue({ decks: [], total: 0, page: 0, limit: 20 });
    await useDeckStore.getState().loadDecks();
    expect(useDeckStore.getState().loadError).toBeNull();
  });
});
