import { describe, it, expect } from "vitest";
import {
  addFavorite,
  removeFavorite,
  isFavorited,
  filterFavorites,
  sortFavorites,
  createFavoriteList,
  addToFavoriteList,
  removeFromFavoriteList,
  type CardFavorite,
} from "./favorites";

function makeFavorite(scryfallId: string, name = "Card", overrides: Partial<CardFavorite> = {}): CardFavorite {
  return {
    scryfallId,
    name,
    typeLine: "Creature",
    cmc: 2,
    price: 5,
    imageUri: "",
    addedAt: new Date(),
    ...overrides,
  };
}

// ─── Add / remove favorites ───────────────────────────────────────────────
describe("addFavorite", () => {
  it("adds a card to favorites", () => {
    const favorites: CardFavorite[] = [];
    const card = makeFavorite("abc123", "Lightning Bolt");
    const result = addFavorite(favorites, card);
    expect(result).toHaveLength(1);
    expect(result[0].scryfallId).toBe("abc123");
  });

  it("does not add duplicate favorites", () => {
    const card = makeFavorite("abc123");
    const favorites = [card];
    const result = addFavorite(favorites, card);
    expect(result).toHaveLength(1);
  });
});

describe("removeFavorite", () => {
  it("removes a card from favorites", () => {
    const favorites = [makeFavorite("c1"), makeFavorite("c2")];
    const result = removeFavorite(favorites, "c1");
    expect(result).toHaveLength(1);
    expect(result[0].scryfallId).toBe("c2");
  });

  it("returns unchanged list when card not found", () => {
    const favorites = [makeFavorite("c1")];
    const result = removeFavorite(favorites, "nonexistent");
    expect(result).toHaveLength(1);
  });
});

describe("isFavorited", () => {
  it("returns true if card is in favorites", () => {
    const favorites = [makeFavorite("c1")];
    expect(isFavorited(favorites, "c1")).toBe(true);
  });

  it("returns false if card is not in favorites", () => {
    const favorites = [makeFavorite("c1")];
    expect(isFavorited(favorites, "nonexistent")).toBe(false);
  });
});

// ─── Filter favorites ─────────────────────────────────────────────────────
describe("filterFavorites", () => {
  const favorites = [
    makeFavorite("c1", "Creature Card", { typeLine: "Creature" }),
    makeFavorite("c2", "Instant Card", { typeLine: "Instant" }),
    makeFavorite("c3", "Land Card", { typeLine: "Land" }),
  ];

  it("returns all favorites when filter is 'all'", () => {
    expect(filterFavorites(favorites, "all")).toHaveLength(3);
  });

  it("filters by creatures", () => {
    const result = filterFavorites(favorites, "creatures");
    expect(result).toHaveLength(1);
    expect(result[0].typeLine).toContain("Creature");
  });

  it("filters by lands", () => {
    const result = filterFavorites(favorites, "lands");
    expect(result).toHaveLength(1);
    expect(result[0].typeLine).toContain("Land");
  });

  it("filters by spells (non-creature, non-land)", () => {
    const result = filterFavorites(favorites, "spells");
    expect(result).toHaveLength(1);
    expect(result[0].typeLine).toBe("Instant");
  });

  it("searches by name (case-insensitive)", () => {
    const result = filterFavorites(favorites, "all", "instant");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Instant Card");
  });
});

// ─── Sort favorites ───────────────────────────────────────────────────────
describe("sortFavorites", () => {
  const t1 = new Date("2024-01-01");
  const t2 = new Date("2024-06-01");

  const favorites = [
    makeFavorite("c1", "A", { price: 20, cmc: 3, addedAt: t1 }),
    makeFavorite("c2", "B", { price: 5, cmc: 1, addedAt: t2 }),
    makeFavorite("c3", "C", { price: 10, cmc: 5, addedAt: t1 }),
  ];

  it("sorts by recently added (newest first)", () => {
    const sorted = sortFavorites(favorites, "recently_added");
    expect(sorted[0].scryfallId).toBe("c2");
  });

  it("sorts by price descending", () => {
    const sorted = sortFavorites(favorites, "price");
    expect(sorted[0].price).toBe(20);
    expect(sorted[2].price).toBe(5);
  });

  it("sorts by CMC ascending", () => {
    const sorted = sortFavorites(favorites, "cmc");
    expect(sorted[0].cmc).toBe(1);
    expect(sorted[2].cmc).toBe(5);
  });
});

// ─── Custom lists ─────────────────────────────────────────────────────────
describe("createFavoriteList", () => {
  it("creates a list with given name", () => {
    const list = createFavoriteList("Budget Staples");
    expect(list.name).toBe("Budget Staples");
    expect(list.cards).toHaveLength(0);
  });

  it("creates list with unique id", () => {
    const a = createFavoriteList("A");
    const b = createFavoriteList("B");
    expect(a.id).not.toBe(b.id);
  });

  it("uses timestamped crypto-safe list ids", () => {
    const list = createFavoriteList("Budget Staples");
    expect(list.id).toMatch(/^list-\d+-[a-z0-9]{5}$/);
  });
});

describe("addToFavoriteList", () => {
  it("adds a card to a custom list", () => {
    const list = createFavoriteList("My List");
    const card = makeFavorite("c1", "Lightning Bolt");
    const result = addToFavoriteList(list, card);
    expect(result.cards).toHaveLength(1);
  });

  it("does not add duplicates to a list", () => {
    const list = createFavoriteList("My List");
    const card = makeFavorite("c1");
    const withCard = addToFavoriteList(list, card);
    const withDup = addToFavoriteList(withCard, card);
    expect(withDup.cards).toHaveLength(1);
  });
});

describe("removeFromFavoriteList", () => {
  it("removes a card from a list", () => {
    const list = createFavoriteList("My List");
    const card = makeFavorite("c1");
    const withCard = addToFavoriteList(list, card);
    const result = removeFromFavoriteList(withCard, "c1");
    expect(result.cards).toHaveLength(0);
  });
});
