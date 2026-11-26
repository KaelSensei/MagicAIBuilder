/**
 * The open deck survives a full page load (I-37, issue #1851).
 *
 * Features that add to "the open deck" from another page (the Game Changers
 * page, the header's deck actions) had no deck after a reload, because the
 * store forgot which deck was open. The store now remembers the open deck's id
 * in this browser, for the signed-in account only, and opens it again once
 * that account is known.
 *
 * Every page load is a fresh store module (`vi.resetModules`), as the browser
 * evaluates the module again; jsdom's `localStorage` survives it, as the
 * browser's does. No internal module is mocked: the deck routes are served by
 * the fake deck client at the HTTP boundary.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as StoreModule from "@/lib/deck/store";
import type { ToastMessage } from "@/hooks/useToast";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";

type DeckStoreHook = (typeof StoreModule)["useDeckStore"];

const deckApi = installFakeDeckClient();

const PLAYER = "account-player";
const OTHER_PLAYER = "account-other";
const OPEN_DECK = "deck-open";
const URL_DECK = "deck-from-url";

/**
 * Loads the store module from scratch, as a full page load does.
 *
 * @returns the store hook of the new module instance
 */
async function pageLoad(): Promise<DeckStoreHook> {
  vi.resetModules();
  const { useDeckStore } = await import("@/lib/deck/store");
  return useDeckStore;
}

/** The toasts on screen in the current page load. */
async function toastsOnScreen(): Promise<readonly ToastMessage[]> {
  const { useToastStore } = await import("@/hooks/useToast");
  return useToastStore.getState().toasts.map((toast) => toast.message);
}

/**
 * A page load where `accountId` is signed in and opens `deckId`.
 *
 * @returns the store of that page load
 */
async function playerOpens(
  accountId: string,
  deckId: string
): Promise<DeckStoreHook> {
  const useDeckStore = await pageLoad();
  await useDeckStore.getState().syncOpenDeckWithAccount(accountId);
  await useDeckStore.getState().setActiveDeck(deckId);
  return useDeckStore;
}

beforeEach(() => {
  localStorage.clear();
  deckApi.seedDeck(emptyApiDeck(OPEN_DECK, "Remembered Deck"));
  deckApi.seedDeck(emptyApiDeck(URL_DECK, "Deck In The Url"));
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("the open deck across a full page load", () => {
  it("opens the deck the player had open, without them opening it", async () => {
    await playerOpens(PLAYER, OPEN_DECK);

    const useDeckStore = await pageLoad();
    await useDeckStore.getState().syncOpenDeckWithAccount(PLAYER);

    const state = useDeckStore.getState();
    expect(state.activeDeckId).toBe(OPEN_DECK);
    expect(state.decks[OPEN_DECK]?.name).toBe("Remembered Deck");
  });

  it("never opens it for another account signing in on the same browser", async () => {
    await playerOpens(PLAYER, OPEN_DECK);

    const otherLoad = await pageLoad();
    await otherLoad.getState().syncOpenDeckWithAccount(OTHER_PLAYER);
    const playerLoad = await pageLoad();
    await playerLoad.getState().syncOpenDeckWithAccount(PLAYER);

    expect(otherLoad.getState().activeDeckId).toBeNull();
    expect(playerLoad.getState().activeDeckId).toBeNull();
  });

  it("forgets it when the player signs out", async () => {
    const useDeckStore = await playerOpens(PLAYER, OPEN_DECK);
    await useDeckStore.getState().syncOpenDeckWithAccount(null);

    const nextLoad = await pageLoad();
    await nextLoad.getState().syncOpenDeckWithAccount(PLAYER);

    expect(nextLoad.getState().activeDeckId).toBeNull();
  });

  it("forgets it when the player deletes it", async () => {
    const useDeckStore = await playerOpens(PLAYER, OPEN_DECK);
    await useDeckStore.getState().deleteDeck(OPEN_DECK);

    const nextLoad = await pageLoad();
    await nextLoad.getState().syncOpenDeckWithAccount(PLAYER);

    expect(nextLoad.getState().activeDeckId).toBeNull();
  });

  it.each([
    { reason: "deleted elsewhere", status: 404 },
    { reason: "no longer this player's", status: 403 },
  ])(
    "silently forgets a remembered deck $reason, and opens no deck",
    async ({ status }) => {
      await playerOpens(PLAYER, OPEN_DECK);

      deckApi.fetchDeck.mockRejectedValueOnce(new DeckApiRefusal(status));
      const goneLoad = await pageLoad();
      await goneLoad.getState().syncOpenDeckWithAccount(PLAYER);
      const goneLoadToasts = await toastsOnScreen();
      const nextLoad = await pageLoad();
      await nextLoad.getState().syncOpenDeckWithAccount(PLAYER);

      expect(goneLoad.getState().activeDeckId).toBeNull();
      expect(goneLoad.getState().deckOpenError).toBeNull();
      expect(goneLoadToasts).toEqual([]);
      expect(nextLoad.getState().activeDeckId).toBeNull();
    }
  );

  it("keeps it for the next page load when it fails to load for another reason", async () => {
    await playerOpens(PLAYER, OPEN_DECK);

    deckApi.fetchDeck.mockRejectedValueOnce(new Error("offline"));
    const offlineLoad = await pageLoad();
    await offlineLoad.getState().syncOpenDeckWithAccount(PLAYER);
    const offlineLoadToasts = await toastsOnScreen();
    const nextLoad = await pageLoad();
    await nextLoad.getState().syncOpenDeckWithAccount(PLAYER);

    expect(offlineLoad.getState().activeDeckId).toBeNull();
    expect(offlineLoadToasts).toEqual([]);
    expect(nextLoad.getState().activeDeckId).toBe(OPEN_DECK);
  });

  it("lets a deck id in the URL win when the builder opens it before the account is known", async () => {
    await playerOpens(PLAYER, OPEN_DECK);

    const builderLoad = await pageLoad();
    await builderLoad.getState().setActiveDeck(URL_DECK);
    await builderLoad.getState().syncOpenDeckWithAccount(PLAYER);
    const nextLoad = await pageLoad();
    await nextLoad.getState().syncOpenDeckWithAccount(PLAYER);

    expect(builderLoad.getState().activeDeckId).toBe(URL_DECK);
    expect(nextLoad.getState().activeDeckId).toBe(URL_DECK);
  });

  it("lets a deck id in the URL win when the builder opens it while the remembered deck loads", async () => {
    await playerOpens(PLAYER, OPEN_DECK);

    const builderLoad = await pageLoad();
    const restoring = builderLoad.getState().syncOpenDeckWithAccount(PLAYER);
    await builderLoad.getState().setActiveDeck(URL_DECK);
    await restoring;

    expect(builderLoad.getState().activeDeckId).toBe(URL_DECK);
  });

  it("keeps the app working when browser storage is blocked", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Storage is blocked", "SecurityError");
    });

    const useDeckStore = await playerOpens(PLAYER, OPEN_DECK);
    const nextLoad = await pageLoad();
    await nextLoad.getState().syncOpenDeckWithAccount(PLAYER);

    expect(useDeckStore.getState().activeDeckId).toBe(OPEN_DECK);
    expect(nextLoad.getState().activeDeckId).toBeNull();
  });
});
