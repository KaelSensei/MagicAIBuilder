import { describe, expect, it, vi, beforeEach } from "vitest";
import { filterDecksByQuery, getStoredDecksViewMode, storeDecksViewMode, sortDecks } from "./deck-listing";
import type { Deck } from "./types";
import { aDeck } from "@/test/builders/deck";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

function makeDeck(partial: Partial<Deck>): Deck {
  const now = new Date("2026-03-30T12:00:00.000Z");
  return aDeck({
    id: "d1",
    name: "Deck",
    createdAt: now,
    updatedAt: now,
    ...partial,
  });
}

describe("deck listing preferences", () => {
  beforeEach(() => {
    localStorageMock.clear();
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("returns null when nothing stored", () => {
    expect(getStoredDecksViewMode()).toBeNull();
  });

  it("stores and reads back valid mode", () => {
    storeDecksViewMode("list");
    expect(getStoredDecksViewMode()).toBe("list");
  });

  it("ignores invalid stored value", () => {
    localStorage.setItem("mab-decks-view-mode", "table");
    expect(getStoredDecksViewMode()).toBeNull();
  });
});

describe("filterDecksByQuery", () => {
  const decks = [
    { id: "a", name: "Direction B", commander: { name: "Atraxa, Grand Unifier" }, partner: null },
    { id: "b", name: "Lands", commander: null, partner: null },
  ] as const;

  it("returns every deck when the query is blank", () => {
    expect(filterDecksByQuery(decks, "  ")).toEqual(decks);
  });

  it("matches a deck name or a commander name", () => {
    expect(filterDecksByQuery(decks, "atraxa").map((deck) => deck.id)).toEqual(["a"]);
    expect(filterDecksByQuery(decks, "lands").map((deck) => deck.id)).toEqual(["b"]);
  });
});

describe("sortDecks", () => {
  it("sorts by updatedAt desc", () => {
    const a = makeDeck({ id: "a", name: "A", updatedAt: new Date("2026-03-30T10:00:00.000Z") });
    const b = makeDeck({ id: "b", name: "B", updatedAt: new Date("2026-03-30T11:00:00.000Z") });
    const result = sortDecks([a, b], "updatedAt", "desc");
    expect(result.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("sorts by name asc", () => {
    const a = makeDeck({ id: "a", name: "Zoo" });
    const b = makeDeck({ id: "b", name: "Alpha" });
    const result = sortDecks([a, b], "name", "asc");
    expect(result.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("sorts by bracket asc (manual overrides target)", () => {
    const a = makeDeck({ id: "a", name: "A" });
    const b = makeDeck({ id: "b", name: "B" });
    const c = makeDeck({ id: "c", name: "C" });
    a.targetBracket = 3;
    b.targetBracket = 2;
    c.targetBracket = 4;
    c.manualBracket = 1;

    const result = sortDecks([a, b, c], "bracket", "asc");
    expect(result.map((d) => d.id)).toEqual(["c", "b", "a"]);
  });
});

