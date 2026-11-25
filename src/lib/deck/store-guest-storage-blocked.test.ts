/**
 * The guest builder when the browser refuses storage (I-39): a signed-out
 * player whose browser blocks site data, or whose quota is full, still opens a
 * guest deck and edits it for the visit, in memory.
 *
 * Sociable: the real deck store and deck API client run their guest paths;
 * only `window.localStorage` is replaced, by the stand-ins of
 * `@/test/browser-storage`. No internal module is mocked.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as StoreModule from "@/lib/deck/store";
import { aScryfallCard } from "@/test/builders/scryfall";
import {
  blockBrowserStorage,
  fillBrowserStorageQuota,
  restoreBrowserStorage,
} from "@/test/browser-storage";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";

const SOL_RING = aScryfallCard({
  name: "Sol Ring",
  type_line: "Artifact",
  mana_cost: "{1}",
  cmc: 1,
});

/**
 * Loads the store module from scratch, as a page load does.
 *
 * @returns the store hook of the new module instance
 */
async function freshStore(): Promise<(typeof StoreModule)["useDeckStore"]> {
  vi.resetModules();
  const { useDeckStore } = await import("@/lib/deck/store");
  return useDeckStore;
}

function guestCardNames(
  useDeckStore: (typeof StoreModule)["useDeckStore"]
): readonly string[] {
  return (useDeckStore.getState().decks[GUEST_DECK_ID]?.cards ?? []).map(
    (card) => `${card.zone}:${card.name}`
  );
}

afterEach(() => {
  restoreBrowserStorage();
  window.localStorage.clear();
});

describe("guest builder when the browser blocks storage", () => {
  it("opens an empty guest deck", async () => {
    blockBrowserStorage();
    const useDeckStore = await freshStore();

    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);

    expect(useDeckStore.getState().activeDeckId).toBe(GUEST_DECK_ID);
    expect(useDeckStore.getState().decks[GUEST_DECK_ID]).toMatchObject({
      name: "Guest Deck",
      cards: [],
    });
  });

  it("adds, moves and removes cards in memory for the rest of the visit", async () => {
    blockBrowserStorage();
    const useDeckStore = await freshStore();
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);

    await useDeckStore.getState().addCard(SOL_RING, { printing: "explicit" });
    expect(guestCardNames(useDeckStore)).toEqual(["main:Sol Ring"]);

    const [solRing] = useDeckStore.getState().decks[GUEST_DECK_ID]?.cards ?? [];
    await useDeckStore.getState().moveToMaybeboard(solRing?.id ?? "");
    expect(guestCardNames(useDeckStore)).toEqual(["maybeboard:Sol Ring"]);

    await useDeckStore.getState().removeCard(solRing?.id ?? "");
    expect(guestCardNames(useDeckStore)).toEqual([]);
  });
});

describe("guest builder when the storage quota is full", () => {
  it("applies an edit in memory", async () => {
    fillBrowserStorageQuota();
    const useDeckStore = await freshStore();
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);

    await useDeckStore.getState().addCard(SOL_RING, { printing: "explicit" });

    expect(guestCardNames(useDeckStore)).toEqual(["main:Sol Ring"]);
  });
});
