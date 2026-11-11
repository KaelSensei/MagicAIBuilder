/**
 * Characterization suite for the deck store's public surface: the fields and
 * actions it exposes, the view and sort preferences, and the guest deck kept
 * in this browser.
 *
 * It pins today's behaviour before `store.ts` is split into slices (master
 * plan P1-06, DB-09..DB-35), so that a slice which drops an action, stops
 * saving a preference or stops writing the guest deck back fails here first.
 * Every test loads a fresh store module, because the store reads the saved
 * sort preference once, when the module is evaluated. No internal module is
 * mocked: preferences and the guest deck go through jsdom's `localStorage`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as StoreModule from "@/lib/deck/store";
import type { DeckAction, DeckStore } from "@/lib/deck/store";
import type { SortPreference } from "@/lib/deck/sort";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { createEmptyDeck } from "@/lib/deck/store-factories";
import {
  createGuestDeck,
  deserializeGuestDeck,
  GUEST_DECK_ID,
  GUEST_DECK_STORAGE_KEY,
  serializeGuestDeck,
} from "@/lib/deck/guest-deck";

const SORT_PREFERENCE_KEY = "deckSortPreference";

const STATE_FIELDS = [
  "activeDeckId",
  "bannedNames",
  "deckGridCols",
  "deckOpenError",
  "deckViewMode",
  "decks",
  "gameChangerNames",
  "groupBy",
  "isSyncing",
  "loadError",
  "searchViewMode",
  "sortDirection",
  "sortField",
  "undoStack",
];

const ACTIONS = [
  "addCard",
  "addDeckCard",
  "addTag",
  "addToMaybeboard",
  "applyBulkEdit",
  "bulkMoveToZone",
  "bulkRemoveCards",
  "clearCommander",
  "createDeck",
  "deleteDeck",
  "duplicateDeck",
  "forceSave",
  "forgetGuestDeck",
  "getActiveDeck",
  "loadDecks",
  "markBanned",
  "markGameChanger",
  "moveCardToZone",
  "moveToDeck",
  "moveToMaybeboard",
  "promoteToCommander",
  "reloadActiveDeck",
  "removeCard",
  "removeFromMaybeboard",
  "removeTag",
  "renameDeck",
  "setActiveDeck",
  "setBannedNames",
  "setBudget",
  "setCommander",
  "setCompanion",
  "setDeckGridCols",
  "setDeckViewMode",
  "setGameChangerNames",
  "setGroupBy",
  "setManualBracket",
  "setPartner",
  "setSearchViewMode",
  "setSortDirection",
  "setSortField",
  "setSortPreference",
  "setTargetBracket",
  "swapCardPrinting",
  "undo",
  "updateCardCategory",
  "updateCardNotes",
  "updateCardQuantity",
  "updateDeckDescription",
];

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

function alphabetical(names: readonly string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b));
}

function keysWhere(
  state: DeckStore,
  keep: (value: unknown) => boolean
): string[] {
  return alphabetical(
    Object.entries(state)
      .filter(([, value]) => keep(value))
      .map(([key]) => key)
  );
}

function savedSortPreference(): unknown {
  const raw = localStorage.getItem(SORT_PREFERENCE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

function storedGuestDeck(): Deck | null {
  return deserializeGuestDeck(localStorage.getItem(GUEST_DECK_STORAGE_KEY));
}

function solRing(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "row-sol-ring",
    scryfallId: "scry-sol-ring",
    name: "Sol Ring",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "{T}: Add {C}{C}.",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: 1.5,
    imageUri: "",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

function addition(deckId: string): DeckAction {
  return { type: "ADD_CARD", deckId, card: solRing() };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("deck store surface", () => {
  it("exposes exactly these state fields", async () => {
    const useDeckStore = await freshStore();

    const fields = keysWhere(
      useDeckStore.getState(),
      (value) => typeof value !== "function"
    );

    expect(fields).toEqual(alphabetical(STATE_FIELDS));
  });

  it("exposes exactly these actions", async () => {
    const useDeckStore = await freshStore();

    const actions = keysWhere(
      useDeckStore.getState(),
      (value) => typeof value === "function"
    );

    expect(actions).toEqual(alphabetical(ACTIONS));
  });

  it("starts with no deck, nothing saving, no error, an empty undo stack and empty enrichment sets", async () => {
    const useDeckStore = await freshStore();

    const state = useDeckStore.getState();

    expect(state.decks).toEqual({});
    expect(state.activeDeckId).toBeNull();
    expect(state.isSyncing).toBe(false);
    expect(state.loadError).toBeNull();
    expect(state.deckOpenError).toBeNull();
    expect(state.undoStack).toEqual([]);
    expect(state.gameChangerNames.size).toBe(0);
    expect(state.bannedNames.size).toBe(0);
  });

  it("merges a partial setState into the state and keeps every action", async () => {
    // Seventeen store test files seed state this way; the split must keep it working.
    const useDeckStore = await freshStore();

    useDeckStore.setState({ activeDeckId: "deck-1" });

    const state = useDeckStore.getState();
    expect(state.activeDeckId).toBe("deck-1");
    expect(state.decks).toEqual({});
    expect(keysWhere(state, (value) => typeof value === "function")).toEqual(
      alphabetical(ACTIONS)
    );
  });
});

describe("deck store view preferences", () => {
  it("starts with grid views of six columns", async () => {
    const useDeckStore = await freshStore();

    const { searchViewMode, deckViewMode, deckGridCols } =
      useDeckStore.getState();

    expect({ searchViewMode, deckViewMode, deckGridCols }).toEqual({
      searchViewMode: "grid",
      deckViewMode: "grid",
      deckGridCols: 6,
    });
  });

  it("currently keeps view modes and grid columns in memory only, so a reload resets them (pinned; see DB-35)", async () => {
    const useDeckStore = await freshStore();
    useDeckStore.getState().setSearchViewMode("list");
    useDeckStore.getState().setDeckViewMode("list");
    useDeckStore.getState().setDeckGridCols(3);

    expect(localStorage).toHaveLength(0);
    const reloaded = (await freshStore()).getState();
    expect([
      reloaded.searchViewMode,
      reloaded.deckViewMode,
      reloaded.deckGridCols,
    ]).toEqual(["grid", "grid", 6]);
  });
});

describe("deck store sort and grouping preference", () => {
  it("starts sorted by mana value, ascending, grouped by type when this browser saved nothing", async () => {
    const useDeckStore = await freshStore();

    const { sortField, sortDirection, groupBy } = useDeckStore.getState();

    expect({ sortField, sortDirection, groupBy }).toEqual({
      sortField: "cmc",
      sortDirection: "asc",
      groupBy: "type",
    });
  });

  it("starts from the preference this browser saved", async () => {
    localStorage.setItem(
      SORT_PREFERENCE_KEY,
      JSON.stringify({
        sortField: "price",
        sortDirection: "desc",
        groupBy: "color",
      })
    );

    const { sortField, sortDirection, groupBy } = (
      await freshStore()
    ).getState();

    expect({ sortField, sortDirection, groupBy }).toEqual({
      sortField: "price",
      sortDirection: "desc",
      groupBy: "color",
    });
  });

  it.each<readonly [string, (state: DeckStore) => void, SortPreference]>([
    [
      "setSortField",
      (state) => state.setSortField("name"),
      { sortField: "name", sortDirection: "desc", groupBy: "color" },
    ],
    [
      "setSortDirection",
      (state) => state.setSortDirection("asc"),
      { sortField: "price", sortDirection: "asc", groupBy: "color" },
    ],
    [
      "setGroupBy",
      (state) => state.setGroupBy("none"),
      { sortField: "price", sortDirection: "desc", groupBy: "none" },
    ],
  ])(
    "%s saves the whole preference, keeping the two fields it does not change",
    async (_change, apply, saved) => {
      localStorage.setItem(
        SORT_PREFERENCE_KEY,
        JSON.stringify({
          sortField: "price",
          sortDirection: "desc",
          groupBy: "color",
        })
      );
      const useDeckStore = await freshStore();

      apply(useDeckStore.getState());

      expect(savedSortPreference()).toEqual(saved);
      const { sortField, sortDirection, groupBy } = useDeckStore.getState();
      expect({ sortField, sortDirection, groupBy }).toEqual(saved);
    }
  );

  it("setSortPreference applies and saves all three fields at once", async () => {
    const useDeckStore = await freshStore();
    const preference: SortPreference = {
      sortField: "type",
      sortDirection: "desc",
      groupBy: "cmc",
    };

    useDeckStore.getState().setSortPreference(preference);

    expect(savedSortPreference()).toEqual(preference);
    const { sortField, sortDirection, groupBy } = useDeckStore.getState();
    expect({ sortField, sortDirection, groupBy }).toEqual(preference);
  });

  it("restores a changed preference in the next store this browser loads", async () => {
    (await freshStore()).getState().setGroupBy("cmc");

    expect((await freshStore()).getState().groupBy).toBe("cmc");
  });
});

describe("deck store guest deck", () => {
  it("opens an empty Guest Deck and saves it in this browser when none was saved", async () => {
    const useDeckStore = await freshStore();

    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);

    const state = useDeckStore.getState();
    expect(state.activeDeckId).toBe(GUEST_DECK_ID);
    expect(state.decks[GUEST_DECK_ID]).toMatchObject({
      name: "Guest Deck",
      cards: [],
    });
    expect(storedGuestDeck()).toMatchObject({
      id: GUEST_DECK_ID,
      name: "Guest Deck",
    });
  });

  it("opens the guest deck this browser saved", async () => {
    localStorage.setItem(
      GUEST_DECK_STORAGE_KEY,
      serializeGuestDeck({
        ...createGuestDeck(),
        name: "Artifacts",
        cards: [solRing()],
      })
    );
    const useDeckStore = await freshStore();

    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);

    expect(useDeckStore.getState().decks[GUEST_DECK_ID]).toMatchObject({
      name: "Artifacts",
      cards: [{ name: "Sol Ring" }],
    });
  });

  it("saves the guest deck in this browser when it changes", async () => {
    const useDeckStore = await freshStore();
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);

    await useDeckStore.getState().renameDeck(GUEST_DECK_ID, "Artifacts");

    expect(storedGuestDeck()?.name).toBe("Artifacts");
  });

  it("writes the held guest deck back on a store change that does not touch it", async () => {
    const useDeckStore = await freshStore();
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);
    localStorage.removeItem(GUEST_DECK_STORAGE_KEY);

    useDeckStore.getState().setDeckViewMode("list");

    expect(storedGuestDeck()?.id).toBe(GUEST_DECK_ID);
  });

  it("writes no guest deck while the store holds none", async () => {
    const useDeckStore = await freshStore();
    useDeckStore.setState({
      decks: { "deck-1": createEmptyDeck("deck-1", "Goblins") },
    });

    useDeckStore.getState().setDeckViewMode("list");

    expect(localStorage.getItem(GUEST_DECK_STORAGE_KEY)).toBeNull();
  });
});

describe("deck store forgetGuestDeck", () => {
  it("drops the guest deck, its undo entries and its selection, and clears this browser's copy", async () => {
    const useDeckStore = await freshStore();
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);
    useDeckStore.setState((state) => ({
      decks: { ...state.decks, "deck-1": createEmptyDeck("deck-1", "Goblins") },
      undoStack: [addition(GUEST_DECK_ID), addition("deck-1")],
    }));

    useDeckStore.getState().forgetGuestDeck();

    const state = useDeckStore.getState();
    expect(Object.keys(state.decks)).toEqual(["deck-1"]);
    expect(state.activeDeckId).toBeNull();
    expect(state.undoStack).toEqual([addition("deck-1")]);
    expect(localStorage.getItem(GUEST_DECK_STORAGE_KEY)).toBeNull();
  });

  it("keeps another open deck selected", async () => {
    const useDeckStore = await freshStore();
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);
    useDeckStore.setState((state) => ({
      decks: { ...state.decks, "deck-1": createEmptyDeck("deck-1", "Goblins") },
      activeDeckId: "deck-1",
    }));

    useDeckStore.getState().forgetGuestDeck();

    expect(useDeckStore.getState().activeDeckId).toBe("deck-1");
  });

  it("stays forgotten after a later store change", async () => {
    const useDeckStore = await freshStore();
    await useDeckStore.getState().setActiveDeck(GUEST_DECK_ID);

    useDeckStore.getState().forgetGuestDeck();
    useDeckStore.getState().setDeckViewMode("list");

    expect(localStorage.getItem(GUEST_DECK_STORAGE_KEY)).toBeNull();
  });
});
