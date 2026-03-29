import { describe, it, expect, beforeEach, vi } from "vitest";
import { sortCards, groupCards, loadSortPreference, saveSortPreference, DEFAULT_SORT_PREFERENCE } from "./sort";
import type { DeckCard } from "./types";

// ─── Fixtures ──────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<DeckCard>): DeckCard {
  return {
    id: overrides.id ?? "test-id",
    name: overrides.name ?? "Test Card",
    manaCost: overrides.manaCost ?? "",
    cmc: overrides.cmc ?? 0,
    typeLine: overrides.typeLine ?? "Instant",
    oracleText: "",
    colorIdentity: overrides.colorIdentity ?? [],
    isGameChanger: false,
    isBanned: false,
    price: overrides.price ?? null,
    imageUri: "",
    artCropUri: "",
    category: overrides.category ?? "instant",
    quantity: overrides.quantity ?? 1,
    zone: overrides.zone ?? "main",
  };
}

const CARDS: DeckCard[] = [
  makeCard({ id: "a", name: "Ancestral Recall", cmc: 1, colorIdentity: ["U"], category: "draw",     price: 5000, typeLine: "Instant" }),
  makeCard({ id: "b", name: "Black Lotus",       cmc: 0, colorIdentity: [],    category: "ramp",     price: 50000, typeLine: "Artifact" }),
  makeCard({ id: "c", name: "Counterspell",      cmc: 2, colorIdentity: ["U"], category: "instant",  price: 1.5,  typeLine: "Instant" }),
  makeCard({ id: "d", name: "Dark Ritual",       cmc: 1, colorIdentity: ["B"], category: "ramp",     price: 2,    typeLine: "Instant" }),
  makeCard({ id: "e", name: "Giant Growth",      cmc: 1, colorIdentity: ["G"], category: "instant",  price: 0.1,  typeLine: "Instant" }),
  makeCard({ id: "f", name: "Lightning Bolt",    cmc: 1, colorIdentity: ["R"], category: "removal",  price: 0.5,  typeLine: "Instant" }),
  makeCard({ id: "g", name: "Sol Ring",          cmc: 1, colorIdentity: [],    category: "ramp",     price: 1,    typeLine: "Artifact" }),
  makeCard({ id: "h", name: "Birds of Paradise", cmc: 1, colorIdentity: ["G"], category: "creature", price: 3,    typeLine: "Creature — Bird" }),
];

// ─── sortCards ─────────────────────────────────────────────────────────────

describe("sortCards — CMC", () => {
  it("sorts ascending by CMC then name", () => {
    const sorted = sortCards(CARDS, "cmc", "asc");
    const cmcs = sorted.map((c) => c.cmc);
    // First card must be Black Lotus (cmc 0)
    expect(cmcs[0]).toBe(0);
    // Then cmc 1 cards, then cmc 2
    expect(sorted[sorted.length - 1].name).toBe("Counterspell");
  });

  it("sorts descending by CMC", () => {
    const sorted = sortCards(CARDS, "cmc", "desc");
    expect(sorted[0].name).toBe("Counterspell"); // cmc 2 is highest
  });
});

describe("sortCards — name", () => {
  it("sorts ascending alphabetically", () => {
    const sorted = sortCards(CARDS, "name", "asc");
    expect(sorted[0].name).toBe("Ancestral Recall");
    expect(sorted[sorted.length - 1].name).toBe("Sol Ring");
  });

  it("sorts descending alphabetically", () => {
    const sorted = sortCards(CARDS, "name", "desc");
    expect(sorted[0].name).toBe("Sol Ring");
    expect(sorted[sorted.length - 1].name).toBe("Ancestral Recall");
  });
});

describe("sortCards — price", () => {
  it("sorts ascending by price (null treated as -1)", () => {
    const sorted = sortCards(CARDS, "price", "asc");
    // Giant Growth (0.1) should come before Lightning Bolt (0.5)
    const giIdx = sorted.findIndex((c) => c.name === "Giant Growth");
    const lbIdx = sorted.findIndex((c) => c.name === "Lightning Bolt");
    expect(giIdx).toBeLessThan(lbIdx);
    // Black Lotus (50000) should be last
    expect(sorted[sorted.length - 1].name).toBe("Black Lotus");
  });

  it("sorts descending by price", () => {
    const sorted = sortCards(CARDS, "price", "desc");
    expect(sorted[0].name).toBe("Black Lotus");
  });
});

describe("sortCards — color", () => {
  it("places White (W) before Blue (U) before Black (B) in WUBRG order", () => {
    const cards = [
      makeCard({ id: "1", name: "B Card", colorIdentity: ["B"] }),
      makeCard({ id: "2", name: "W Card", colorIdentity: ["W"] }),
      makeCard({ id: "3", name: "U Card", colorIdentity: ["U"] }),
    ];
    const sorted = sortCards(cards, "color", "asc");
    expect(sorted.map((c) => c.colorIdentity[0])).toEqual(["W", "U", "B"]);
  });

  it("places multicolor after single-color and colorless last", () => {
    const cards = [
      makeCard({ id: "1", name: "Colorless Card",  colorIdentity: [] }),
      makeCard({ id: "2", name: "Multi Card",       colorIdentity: ["W", "U"] }),
      makeCard({ id: "3", name: "Mono Card",        colorIdentity: ["G"] }),
    ];
    const sorted = sortCards(cards, "color", "asc");
    expect(sorted[0].name).toBe("Mono Card");
    expect(sorted[1].name).toBe("Multi Card");
    expect(sorted[2].name).toBe("Colorless Card");
  });
});

describe("sortCards — type", () => {
  it("sorts ascending by typeLine alphabetically", () => {
    const cards = [
      makeCard({ id: "1", name: "Z", typeLine: "Sorcery" }),
      makeCard({ id: "2", name: "A", typeLine: "Artifact" }),
      makeCard({ id: "3", name: "M", typeLine: "Land" }),
    ];
    const sorted = sortCards(cards, "type", "asc");
    expect(sorted[0].typeLine).toBe("Artifact");
    expect(sorted[1].typeLine).toBe("Land");
    expect(sorted[2].typeLine).toBe("Sorcery");
  });
});

// ─── groupCards ────────────────────────────────────────────────────────────

describe("groupCards", () => {
  it("returns a single group when groupBy is none", () => {
    const groups = groupCards(CARDS, "none");
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("all");
    expect(groups[0].cards).toHaveLength(CARDS.length);
  });

  it("groups by category (type)", () => {
    const groups = groupCards(CARDS, "type");
    const keys = groups.map((g) => g.key);
    expect(keys).toContain("ramp");
    expect(keys).toContain("instant");
    expect(keys).toContain("draw");
  });

  it("groups by CMC with 7+ bucket", () => {
    const bigCard = makeCard({ id: "x", name: "Emrakul", cmc: 15 });
    const groups = groupCards([...CARDS, bigCard], "cmc");
    const labels = groups.map((g) => g.label);
    expect(labels).toContain("7+ CMC");
    expect(labels).toContain("0 CMC");
    expect(labels).toContain("1 CMC");
  });

  it("groups by color in WUBRG order with Multicolor and Colorless last", () => {
    const cards = [
      makeCard({ id: "1", name: "A", colorIdentity: [] }),
      makeCard({ id: "2", name: "B", colorIdentity: ["W", "U"] }),
      makeCard({ id: "3", name: "C", colorIdentity: ["R"] }),
      makeCard({ id: "4", name: "D", colorIdentity: ["W"] }),
    ];
    const groups = groupCards(cards, "color");
    const keys = groups.map((g) => g.key);
    expect(keys.indexOf("White")).toBeLessThan(keys.indexOf("Red"));
    expect(keys.indexOf("Multicolor")).toBeLessThan(keys.indexOf("Colorless"));
  });

  it("each group contains only its own cards", () => {
    const groups = groupCards(CARDS, "type");
    for (const group of groups) {
      for (const card of group.cards) {
        expect(card.category).toBe(group.key);
      }
    }
  });
});

// ─── localStorage persistence ──────────────────────────────────────────────

describe("loadSortPreference / saveSortPreference", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns DEFAULT_SORT_PREFERENCE when nothing is stored", () => {
    expect(loadSortPreference()).toEqual(DEFAULT_SORT_PREFERENCE);
  });

  it("round-trips a saved preference", () => {
    const pref = { sortField: "name" as const, sortDirection: "desc" as const, groupBy: "color" as const };
    saveSortPreference(pref);
    expect(loadSortPreference()).toEqual(pref);
  });

  it("returns default when localStorage contains invalid JSON", () => {
    localStorage.setItem("deckSortPreference", "{invalid json");
    expect(loadSortPreference()).toEqual(DEFAULT_SORT_PREFERENCE);
  });

  it("fills missing fields with defaults when partial JSON is stored", () => {
    localStorage.setItem("deckSortPreference", JSON.stringify({ sortField: "price" }));
    const pref = loadSortPreference();
    expect(pref.sortField).toBe("price");
    expect(pref.sortDirection).toBe(DEFAULT_SORT_PREFERENCE.sortDirection);
    expect(pref.groupBy).toBe(DEFAULT_SORT_PREFERENCE.groupBy);
  });
});
