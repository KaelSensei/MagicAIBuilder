import { describe, it, expect } from "vitest";
import {
  buildShoppingList,
  formatShoppingListText,
  computeCollectionStats,
  formatCollectionText,
  formatCollectionCsv,
} from "./shopping-list";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "c1", name: "Sol Ring", manaCost: "{1}", cmc: 1,
    typeLine: "Artifact", oracleText: "", colorIdentity: [],
    isGameChanger: false, isBanned: false, price: 1.5,
    imageUri: "", artCropUri: "", category: "ramp",
    quantity: 1, zone: "main", scryfallId: "abc",
    ...overrides,
  };
}

const BASIC_LAND = makeCard({
  id: "land", name: "Island", typeLine: "Basic Land — Island",
  scryfallId: "island", category: "land", price: 0.1, quantity: 4,
});

describe("buildShoppingList", () => {
  it("returns all cards as missing when collection is empty", () => {
    const cards = [makeCard({ scryfallId: "a", name: "Sol Ring", price: 2 })];
    const ownedIds = new Set<string>();
    const list = buildShoppingList(cards, null, null, ownedIds);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Sol Ring");
  });

  it("excludes owned cards", () => {
    const cards = [
      makeCard({ scryfallId: "a", name: "Sol Ring" }),
      makeCard({ scryfallId: "b", name: "Arcane Signet" }),
    ];
    const ownedIds = new Set(["a"]);
    const list = buildShoppingList(cards, null, null, ownedIds);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Arcane Signet");
  });

  it("includes commander if missing", () => {
    const commander = makeCard({ scryfallId: "cmd", name: "Atraxa" });
    const ownedIds = new Set<string>();
    const list = buildShoppingList([], commander, null, ownedIds);
    expect(list.some((c) => c.name === "Atraxa")).toBe(true);
  });

  it("excludes basic lands by default", () => {
    const cards = [BASIC_LAND];
    const list = buildShoppingList(cards, null, null, new Set());
    expect(list).toHaveLength(0);
  });

  it("includes basic lands when includeBasics is true", () => {
    const cards = [BASIC_LAND];
    const list = buildShoppingList(cards, null, null, new Set(), { includeBasics: true });
    expect(list).toHaveLength(1);
  });

  it("sorts by price descending", () => {
    const cards = [
      makeCard({ scryfallId: "a", name: "Cheap", price: 1 }),
      makeCard({ scryfallId: "b", name: "Expensive", price: 50 }),
      makeCard({ scryfallId: "c", name: "Medium", price: 10 }),
    ];
    const list = buildShoppingList(cards, null, null, new Set());
    expect(list[0].name).toBe("Expensive");
    expect(list[1].name).toBe("Medium");
    expect(list[2].name).toBe("Cheap");
  });

  it("handles null prices", () => {
    const cards = [
      makeCard({ scryfallId: "a", name: "No Price", price: null }),
      makeCard({ scryfallId: "b", name: "Has Price", price: 5 }),
    ];
    const list = buildShoppingList(cards, null, null, new Set());
    expect(list[0].name).toBe("Has Price"); // null price sorts last
    expect(list[1].name).toBe("No Price");
  });
});

describe("computeCollectionStats", () => {
  it("counts owned vs total", () => {
    const cards = [
      makeCard({ scryfallId: "a" }),
      makeCard({ scryfallId: "b" }),
      makeCard({ scryfallId: "c" }),
    ];
    const ownedIds = new Set(["a", "c"]);
    const stats = computeCollectionStats(cards, null, null, ownedIds);
    expect(stats.ownedCount).toBe(2);
    expect(stats.totalCount).toBe(3);
    expect(stats.completionRatio).toBeCloseTo(2 / 3);
  });

  it("includes commander in total", () => {
    const commander = makeCard({ scryfallId: "cmd" });
    const stats = computeCollectionStats([], commander, null, new Set(["cmd"]));
    expect(stats.ownedCount).toBe(1);
    expect(stats.totalCount).toBe(1);
  });

  it("calculates missing cost correctly", () => {
    const cards = [
      makeCard({ scryfallId: "a", price: 10 }),
      makeCard({ scryfallId: "b", price: 20 }),
    ];
    const ownedIds = new Set(["a"]);
    const stats = computeCollectionStats(cards, null, null, ownedIds);
    expect(stats.missingCost).toBeCloseTo(20);
  });

  it("ignores null prices in missing cost", () => {
    const cards = [makeCard({ scryfallId: "a", price: null })];
    const stats = computeCollectionStats(cards, null, null, new Set());
    expect(stats.missingCost).toBe(0);
  });

  it("treats basic lands as owned by default", () => {
    const cards = [
      BASIC_LAND,
      makeCard({ scryfallId: "a", name: "Sol Ring" }),
    ];
    const stats = computeCollectionStats(cards, null, null, new Set());
    expect(stats.ownedCount).toBe(1);
    expect(stats.missingCount).toBe(1);
  });

  it("counts basic land as owned even with empty collection", () => {
    const cards = [BASIC_LAND];
    const stats = computeCollectionStats(cards, null, null, new Set());
    expect(stats.ownedCount).toBe(1);
    expect(stats.completionRatio).toBe(1);
  });
});

describe("formatShoppingListText", () => {
  it("formats as quantity + name per line", () => {
    const list = [
      { name: "Sol Ring", quantity: 1, price: 2, scryfallId: "a" },
      { name: "Island", quantity: 4, price: 0.1, scryfallId: "b" },
    ];
    const text = formatShoppingListText(list);
    expect(text).toContain("1× Sol Ring");
    expect(text).toContain("4× Island");
  });

  it("returns empty string for empty list", () => {
    expect(formatShoppingListText([])).toBe("");
  });
});

describe("formatCollectionText", () => {
  it("formats as quantity + name per line", () => {
    const cards = [
      { name: "Sol Ring", quantity: 1, foil: false, condition: "NM", price: 1.5 },
      { name: "Mana Crypt", quantity: 2, foil: false, condition: null, price: 150 },
    ];
    const text = formatCollectionText(cards);
    expect(text).toContain("1× Sol Ring");
    expect(text).toContain("2× Mana Crypt");
  });

  it("includes [Foil] tag for foil cards", () => {
    const cards = [
      { name: "Sol Ring", quantity: 1, foil: true, condition: "NM", price: 5 },
    ];
    const text = formatCollectionText(cards);
    expect(text).toBe("1× Sol Ring [Foil]");
  });

  it("returns empty string for empty collection", () => {
    expect(formatCollectionText([])).toBe("");
  });
});

describe("formatCollectionCsv", () => {
  it("produces valid CSV with header row", () => {
    const cards = [
      { name: "Sol Ring", quantity: 1, foil: false, condition: "NM", price: 1.5 },
    ];
    const csv = formatCollectionCsv(cards);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Name,Quantity,Foil,Condition,Price (USD)");
    expect(lines[1]).toBe('"Sol Ring",1,No,NM,1.5');
  });

  it("handles null condition and price", () => {
    const cards = [
      { name: "Island", quantity: 4, foil: false, condition: null, price: null },
    ];
    const csv = formatCollectionCsv(cards);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"Island",4,No,,');
  });

  it("marks foil cards as Yes", () => {
    const cards = [
      { name: "Sol Ring", quantity: 1, foil: true, condition: "LP", price: 5 },
    ];
    const csv = formatCollectionCsv(cards);
    expect(csv).toContain("Yes");
  });
});
