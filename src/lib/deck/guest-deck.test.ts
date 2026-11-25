import { afterEach, describe, expect, it } from "vitest";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import {
  blockBrowserStorage,
  fillBrowserStorageQuota,
  restoreBrowserStorage,
} from "@/test/browser-storage";
import { createEmptyDeck } from "./store-factories";
import {
  GUEST_DECK_ID,
  GUEST_DECK_STORAGE_KEY,
  clearGuestDeck,
  deserializeGuestDeck,
  loadGuestDeck,
  saveGuestDeck,
  serializeGuestDeck,
} from "./guest-deck";

afterEach(() => {
  restoreBrowserStorage();
  window.localStorage.clear();
});

function aSavedGuestDeck() {
  return aDeck({
    id: GUEST_DECK_ID,
    name: "Artifacts",
    cards: [aDeckCard({ name: "Sol Ring" })],
  });
}

describe("guest deck storage", () => {
  it("round-trips the single browser deck and restores dates", () => {
    const deck = createEmptyDeck(GUEST_DECK_ID, "Guest Deck");
    deck.description = "Stored only in this browser";

    const restored = deserializeGuestDeck(serializeGuestDeck(deck));

    expect(restored).toMatchObject({
      id: GUEST_DECK_ID,
      name: "Guest Deck",
      description: "Stored only in this browser",
    });
    expect(restored?.createdAt).toBeInstanceOf(Date);
    expect(restored?.updatedAt).toBeInstanceOf(Date);
  });

  it("rejects malformed and non-guest data", () => {
    expect(deserializeGuestDeck("not-json")).toBeNull();
    expect(
      deserializeGuestDeck(JSON.stringify({ id: "another-deck" }))
    ).toBeNull();
  });

  it("loads the guest deck it saved in this browser", () => {
    const deck = aSavedGuestDeck();

    saveGuestDeck(deck);

    expect(loadGuestDeck()).toEqual(deck);
  });

  it("finds no guest deck once it is cleared", () => {
    saveGuestDeck(aSavedGuestDeck());

    clearGuestDeck();

    expect(loadGuestDeck()).toBeNull();
  });
});

describe("guest deck storage when the browser blocks it", () => {
  it("finds no guest deck when reading storage throws", () => {
    blockBrowserStorage();

    expect(loadGuestDeck()).toBeNull();
  });

  it("saves nothing, without throwing, when storage is blocked", () => {
    blockBrowserStorage();

    expect(() => saveGuestDeck(aSavedGuestDeck())).not.toThrow();
  });

  it("clears nothing, without throwing, when storage is blocked", () => {
    blockBrowserStorage();

    expect(() => clearGuestDeck()).not.toThrow();
  });

  it("keeps the deck it had, without throwing, when the quota is full", () => {
    const saved = aSavedGuestDeck();
    fillBrowserStorageQuota({
      [GUEST_DECK_STORAGE_KEY]: serializeGuestDeck(saved),
    });

    expect(() =>
      saveGuestDeck({ ...saved, name: "Renamed in memory" })
    ).not.toThrow();
    expect(loadGuestDeck()?.name).toBe("Artifacts");
  });
});
