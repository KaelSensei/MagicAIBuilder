import { describe, expect, it } from "vitest";
import { compareDeckCards } from "./comparison";

describe("compareDeckCards", () => {
  it("separates shared cards, exclusive cards, and quantity changes", () => {
    const result = compareDeckCards(
      [
        { scryfallId: "sol-ring", name: "Sol Ring", quantity: 1 },
        { scryfallId: "island", name: "Island", quantity: 3 },
        { scryfallId: "island", name: "Island", quantity: 2 },
        { name: "Counterspell", quantity: 1 },
      ],
      [
        { scryfallId: "sol-ring", name: "Sol Ring", quantity: 1 },
        { scryfallId: "island", name: "Island", quantity: 7 },
        { name: "Swords to Plowshares", quantity: 1 },
      ]
    );

    expect(result.shared).toEqual([
      { key: "island", name: "Island", leftQuantity: 5, rightQuantity: 7 },
      { key: "sol-ring", name: "Sol Ring", leftQuantity: 1, rightQuantity: 1 },
    ]);
    expect(result.onlyLeft).toEqual([
      { key: "counterspell", name: "Counterspell", quantity: 1 },
    ]);
    expect(result.onlyRight).toEqual([
      {
        key: "swords to plowshares",
        name: "Swords to Plowshares",
        quantity: 1,
      },
    ]);
    expect(result.quantityChanges).toEqual([
      { key: "island", name: "Island", leftQuantity: 5, rightQuantity: 7 },
    ]);
  });

  it("matches printings by card name when their Scryfall ids differ", () => {
    const result = compareDeckCards(
      [{ scryfallId: "printing-a", name: "Arcane Signet", quantity: 1 }],
      [{ scryfallId: "printing-b", name: " arcane  signet ", quantity: 1 }]
    );

    expect(result.shared).toHaveLength(1);
    expect(result.onlyLeft).toEqual([]);
    expect(result.onlyRight).toEqual([]);
  });
});
