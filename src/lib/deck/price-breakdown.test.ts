import { describe, it, expect } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { groupPrice, totalWithoutBasicLands } from "./price-breakdown";

describe("groupPrice", () => {
  it("sums quantity times price over a fully priced group, rounded to cents once", () => {
    const cards = [
      aDeckCard({ id: "a", price: 120.1 }),
      aDeckCard({ id: "b", price: 15 }),
      aDeckCard({ id: "c", price: 0.25, quantity: 28 }),
    ];

    expect(groupPrice(cards)).toEqual({ kind: "priced", subtotal: 142.1 });
  });

  it("rounds the summed subtotal, not each row", () => {
    // Three rows of 0.333 sum to 0.999, which rounds to 1.00; rounding each
    // row first would give 0.99.
    const cards = [
      aDeckCard({ id: "a", price: 0.333 }),
      aDeckCard({ id: "b", price: 0.333 }),
      aDeckCard({ id: "c", price: 0.333 }),
    ];

    expect(groupPrice(cards)).toEqual({ kind: "priced", subtotal: 1 });
  });

  it("keeps unpriced copies apart from the known subtotal instead of counting them as $0", () => {
    const cards = [
      aDeckCard({ id: "a", price: 12.4 }),
      aDeckCard({ id: "b", price: null }),
      aDeckCard({ id: "c", price: null }),
    ];

    expect(groupPrice(cards)).toEqual({
      kind: "partial",
      knownSubtotal: 12.4,
      unpricedCopies: 2,
    });
  });

  it("counts unpriced copies by quantity, as the heading counts cards", () => {
    const cards = [
      aDeckCard({ id: "a", price: 1 }),
      aDeckCard({ id: "b", price: null, quantity: 3 }),
    ];

    expect(groupPrice(cards)).toEqual({
      kind: "partial",
      knownSubtotal: 1,
      unpricedCopies: 3,
    });
  });

  it("reports a group with no priced row as unpriced", () => {
    const cards = [
      aDeckCard({ id: "a", price: null }),
      aDeckCard({ id: "b", price: null }),
    ];

    expect(groupPrice(cards)).toEqual({ kind: "unpriced", unpricedCopies: 2 });
  });

  it("prices an empty group at zero", () => {
    expect(groupPrice([])).toEqual({ kind: "priced", subtotal: 0 });
  });

  it("counts a card printed at $0.00 as priced", () => {
    expect(groupPrice([aDeckCard({ price: 0 })])).toEqual({
      kind: "priced",
      subtotal: 0,
    });
  });
});

describe("totalWithoutBasicLands", () => {
  it("subtracts the basic lands from the known total", () => {
    const cards = [
      aDeckCard({ id: "sol", typeLine: "Artifact", price: 403.5 }),
      aDeckCard({
        id: "forest",
        typeLine: "Basic Land — Forest",
        price: 0.3,
        quantity: 30,
      }),
    ];

    expect(totalWithoutBasicLands(cards)).toBe(403.5);
  });

  it("treats Snow-Covered Forest and Wastes as basic and Dryad Arbor as not (CR 205.4c)", () => {
    const cards = [
      aDeckCard({ id: "snow", typeLine: "Basic Snow Land — Forest", price: 1 }),
      aDeckCard({ id: "wastes", typeLine: "Basic Land", price: 2 }),
      aDeckCard({
        id: "arbor",
        typeLine: "Land Creature — Forest Dryad",
        price: 20,
      }),
    ];

    expect(totalWithoutBasicLands(cards)).toBe(20);
  });

  it("ignores unpriced rows, as the deck total does", () => {
    const cards = [
      aDeckCard({ id: "a", typeLine: "Instant", price: null }),
      aDeckCard({ id: "b", typeLine: "Instant", price: 3 }),
      aDeckCard({ id: "plains", typeLine: "Basic Land — Plains", price: 0.1 }),
    ];

    expect(totalWithoutBasicLands(cards)).toBe(3);
  });

  it("is null when the deck holds no basic land", () => {
    const cards = [
      aDeckCard({
        id: "arbor",
        typeLine: "Land Creature — Forest Dryad",
        price: 20,
      }),
    ];

    expect(totalWithoutBasicLands(cards)).toBeNull();
  });

  it("still answers when the only basic lands have no price", () => {
    const cards = [
      aDeckCard({ id: "a", typeLine: "Sorcery", price: 5 }),
      aDeckCard({ id: "island", typeLine: "Basic Land — Island", price: null }),
    ];

    expect(totalWithoutBasicLands(cards)).toBe(5);
  });
});
