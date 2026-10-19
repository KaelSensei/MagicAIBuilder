/**
 * loadDecks used to swallow its failure, so a 500 rendered as "No decks yet" —
 * an outage disguised as an empty account. These pin the recorded error.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/db/deck-api", () => ({
  fetchDecks: vi.fn(),
  fetchDeck: vi.fn(),
}));

const toastAdd = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useToast", () => ({
  useToastStore: { getState: () => ({ add: toastAdd }) },
}));

import * as deckApi from "@/lib/db/deck-api";
import { useDeckStore } from "@/lib/deck/store";

const fetchDecks = deckApi.fetchDecks as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  useDeckStore.setState({ decks: {}, activeDeckId: null, loadError: null, deckOpenError: null, isSyncing: false });
});

describe("useDeckStore.loadDecks — failure reporting", () => {
  it("notifies the player when opening an individual deck fails", async () => {
    vi.mocked(deckApi.fetchDeck).mockRejectedValueOnce(new Error("offline"));

    await useDeckStore.getState().setActiveDeck("deck-1");

    expect(toastAdd).toHaveBeenCalledWith("error", expect.any(String));
    expect(useDeckStore.getState().decks).toEqual({});
    expect(useDeckStore.getState().deckOpenError).toEqual({ deckId: "deck-1", reason: "offline" });
  });

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

  it("ignores an older failure after a newer listing succeeds", async () => {
    let rejectOlder: (reason: Error) => void = () => {};
    fetchDecks
      .mockImplementationOnce(() => new Promise((_, reject) => {
        rejectOlder = reject;
      }))
      .mockResolvedValueOnce({ decks: [], total: 0, page: 0, limit: 20 });

    const older = useDeckStore.getState().loadDecks();
    await useDeckStore.getState().loadDecks();
    rejectOlder(new Error("stale failure"));
    await older;

    expect(useDeckStore.getState().loadError).toBeNull();
    expect(useDeckStore.getState().isSyncing).toBe(false);
  });
});
