import { describe, it, expect } from "vitest";
import { buildProxySlots, estimatePages, cardsPerPage, DEFAULT_PROXY_CONFIG } from "./proxy";
import type { DeckCard } from "./types";

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card1",
    name: "Sol Ring",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "Tap: Add two mana.",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "https://example.com/img.jpg",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    zone: "main",
    scryfallId: "abc",
    ...overrides,
  };
}

const BASE_COMMANDER: DeckCard = makeCard({
  id: "cmd",
  name: "Atraxa",
  typeLine: "Legendary Creature",
  zone: "main",
});

describe("cardsPerPage", () => {
  it("returns 9 for 3x3", () => expect(cardsPerPage("3x3")).toBe(9));
  it("returns 4 for 2x2", () => expect(cardsPerPage("2x2")).toBe(4));
});

describe("estimatePages", () => {
  it("estimates correctly for 3x3", () => {
    expect(estimatePages(9, "3x3")).toBe(1);
    expect(estimatePages(10, "3x3")).toBe(2);
    expect(estimatePages(99, "3x3")).toBe(11);
  });

  it("estimates correctly for 2x2", () => {
    expect(estimatePages(4, "2x2")).toBe(1);
    expect(estimatePages(5, "2x2")).toBe(2);
  });

  it("returns 0 for empty deck", () => {
    expect(estimatePages(0, "3x3")).toBe(0);
  });
});

describe("buildProxySlots", () => {
  it("returns empty for empty deck with no commander", () => {
    const slots = buildProxySlots([], null, null, DEFAULT_PROXY_CONFIG);
    expect(slots).toHaveLength(0);
  });

  it("includes commander when includeCommander=true", () => {
    const slots = buildProxySlots([], BASE_COMMANDER, null, { ...DEFAULT_PROXY_CONFIG, includeCommander: true });
    expect(slots).toHaveLength(1);
    expect(slots[0].name).toBe("Atraxa");
    expect(slots[0].isCommander).toBe(true);
  });

  it("excludes commander when includeCommander=false", () => {
    const slots = buildProxySlots([], BASE_COMMANDER, null, { ...DEFAULT_PROXY_CONFIG, includeCommander: false });
    expect(slots).toHaveLength(0);
  });

  it("respects card quantity", () => {
    const card = makeCard({ id: "c1", name: "Island", typeLine: "Basic Land — Island", quantity: 4 });
    const slots = buildProxySlots([card], null, null, { ...DEFAULT_PROXY_CONFIG, includeLands: true });
    expect(slots.filter((s) => s.name === "Island")).toHaveLength(4);
  });

  it("excludes basic lands by default", () => {
    const island = makeCard({ id: "c1", name: "Island", typeLine: "Basic Land — Island", quantity: 4 });
    const slots = buildProxySlots([island], null, null, DEFAULT_PROXY_CONFIG);
    expect(slots.filter((s) => s.name === "Island")).toHaveLength(0);
  });

  it("includes basic lands when includeLands=true", () => {
    const plains = makeCard({ id: "c2", name: "Plains", typeLine: "Basic Land — Plains", quantity: 3 });
    const slots = buildProxySlots([plains], null, null, { ...DEFAULT_PROXY_CONFIG, includeLands: true });
    expect(slots.filter((s) => s.name === "Plains")).toHaveLength(3);
  });

  it("excludes sideboard and maybeboard cards", () => {
    const sideCard = makeCard({ id: "c3", name: "Counterspell", zone: "sideboard" });
    const maybeCard = makeCard({ id: "c4", name: "Force of Will", zone: "maybeboard" });
    const slots = buildProxySlots([sideCard, maybeCard], null, null, DEFAULT_PROXY_CONFIG);
    expect(slots).toHaveLength(0);
  });

  it("includes partner when present", () => {
    const partner: DeckCard = makeCard({ id: "p1", name: "Silas Renn", typeLine: "Legendary Creature" });
    const slots = buildProxySlots([], BASE_COMMANDER, partner, { ...DEFAULT_PROXY_CONFIG, includeCommander: true });
    expect(slots).toHaveLength(2);
    expect(slots[1].name).toBe("Silas Renn");
  });

  it("generates unique slot IDs for multiple copies", () => {
    const card = makeCard({ id: "c5", name: "Swamp", typeLine: "Basic Land", quantity: 2 });
    const slots = buildProxySlots([card], null, null, { ...DEFAULT_PROXY_CONFIG, includeLands: true });
    const ids = slots.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes oracleText and powerToughness on slots", () => {
    const bear = makeCard({
      id: "b1",
      name: "Grizzly Bears",
      typeLine: "Creature — Bear",
      oracleText: "Trample",
      power: "2",
      toughness: "2",
      quantity: 1,
    });
    const slots = buildProxySlots([bear], null, null, DEFAULT_PROXY_CONFIG);
    expect(slots[0].oracleText).toBe("Trample");
    expect(slots[0].powerToughness).toBe("2/2");
  });
});
