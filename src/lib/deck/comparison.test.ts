import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { compareDeckCards, compareDeckProfiles } from "./comparison";

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

describe("compareDeckProfiles", () => {
  it("explains curve, budget, and color identity differences", () => {
    const result = compareDeckProfiles(
      [
        {
          name: "Cheap blue spell",
          quantity: 2,
          cmc: 1,
          price: 1,
          colorIdentity: ["U"],
          category: "draw",
        },
        {
          name: "White spell",
          quantity: 1,
          cmc: 4,
          price: 3,
          colorIdentity: ["W"],
          category: "removal",
        },
      ],
      [
        {
          name: "Expensive blue spell",
          quantity: 1,
          cmc: 5,
          price: 10,
          colorIdentity: ["U"],
          category: "draw",
        },
        {
          name: "Green spell",
          quantity: 1,
          cmc: 3,
          price: 2,
          colorIdentity: ["G"],
          category: "ramp",
        },
      ]
    );

    expect(result).toEqual({
      leftAverageCmc: 2,
      rightAverageCmc: 4,
      leftPrice: 5,
      rightPrice: 12,
      onlyLeftColors: ["W"],
      onlyRightColors: ["G"],
      roleDifferences: [
        { role: "ramp", leftQuantity: 0, rightQuantity: 1 },
        { role: "draw", leftQuantity: 2, rightQuantity: 1 },
        { role: "removal", leftQuantity: 1, rightQuantity: 0 },
      ],
    });
  });

  it("omits strategic roles with identical quantities and non-role categories", () => {
    const result = compareDeckProfiles(
      [
        {
          name: "Mana rock",
          quantity: 2,
          cmc: 2,
          price: 1,
          colorIdentity: [],
          category: "ramp",
        },
        {
          name: "Creature",
          quantity: 3,
          cmc: 3,
          price: 1,
          colorIdentity: ["G"],
          category: "creature",
        },
      ],
      [
        {
          name: "Different mana rocks",
          quantity: 2,
          cmc: 2,
          price: 1,
          colorIdentity: [],
          category: "ramp",
        },
      ]
    );

    expect(result.roleDifferences).toEqual([]);
  });
});

describe("compareDeckProfiles prices the deck you play", () => {
  it("leaves the Sideboard and Considering cards out of each deck's price", () => {
    const result = compareDeckProfiles(
      [
        aDeckCard({ id: "sol-ring", name: "Sol Ring", price: 2 }),
        aDeckCard({
          id: "rest",
          name: "Rest in Peace",
          price: 7,
          zone: "sideboard",
        }),
      ],
      [
        aDeckCard({ id: "signet", name: "Arcane Signet", price: 1 }),
        aDeckCard({
          id: "cyclonic",
          name: "Cyclonic Rift",
          price: 30,
          zone: "maybeboard",
        }),
      ]
    );

    expect([result.leftPrice, result.rightPrice]).toEqual([2, 1]);
  });

  it("counts the commander and the partner with the main deck", () => {
    const result = compareDeckProfiles(
      [
        {
          ...aDeckCard({ id: "tymna", name: "Tymna the Weaver", price: 4 }),
          isCommander: true,
        },
        {
          ...aDeckCard({
            id: "thrasios",
            name: "Thrasios, Triton Hero",
            price: 3,
          }),
          isCommander: true,
          isPartner: true,
        },
        aDeckCard({ id: "sol-ring", name: "Sol Ring", price: 2 }),
      ],
      [aDeckCard({ id: "signet", name: "Arcane Signet", price: 1 })]
    );

    expect(result.leftPrice).toBe(9);
  });

  it("leaves the companion out, as the builder's total does", () => {
    const result = compareDeckProfiles(
      [
        aDeckCard({
          id: "lurrus",
          name: "Lurrus of the Dream-Den",
          price: 5,
          category: "companion",
        }),
        aDeckCard({ id: "sol-ring", name: "Sol Ring", price: 2 }),
      ],
      [aDeckCard({ id: "signet", name: "Arcane Signet", price: 1 })]
    );

    expect(result.leftPrice).toBe(2);
  });

  it("counts a row sent without a zone as a main-deck row", () => {
    const result = compareDeckProfiles(
      [
        {
          name: "Sol Ring",
          quantity: 1,
          cmc: 1,
          price: 2,
          colorIdentity: [],
          category: "ramp",
        },
      ],
      [
        {
          name: "Arcane Signet",
          quantity: 2,
          cmc: 2,
          price: 1,
          colorIdentity: [],
          category: "ramp",
        },
      ]
    );

    expect([result.leftPrice, result.rightPrice]).toEqual([2, 2]);
  });
});

describe("compareDeckProfiles reads the curve, colours and roles of the deck you play", () => {
  const playedCards = [
    aDeckCard({ id: "sol-ring", name: "Sol Ring", cmc: 1, category: "ramp" }),
    aDeckCard({
      id: "counterspell",
      name: "Counterspell",
      cmc: 2,
      colorIdentity: ["U"],
      category: "removal",
    }),
  ];

  it("shows the same average mana value when one deck also shortlists 30 seven-drops in Considering", () => {
    const considering = Array.from({ length: 30 }, (_, index) =>
      aDeckCard({
        id: `seven-drop-${index}`,
        name: `Seven-drop ${index}`,
        cmc: 7,
        zone: "maybeboard",
      })
    );

    const result = compareDeckProfiles(
      [...playedCards, ...considering],
      playedCards
    );

    expect([result.leftAverageCmc, result.rightAverageCmc]).toEqual([1.5, 1.5]);
  });

  it("adds no colour for a sideboard card of a colour the main deck lacks", () => {
    const result = compareDeckProfiles(
      [
        ...playedCards,
        aDeckCard({
          id: "rest",
          name: "Rest in Peace",
          cmc: 2,
          colorIdentity: ["W"],
          category: "removal",
          zone: "sideboard",
        }),
      ],
      playedCards
    );

    expect([result.onlyLeftColors, result.onlyRightColors]).toEqual([[], []]);
  });

  it("changes no role count for a ramp card in Considering", () => {
    const result = compareDeckProfiles(
      [
        ...playedCards,
        aDeckCard({
          id: "cultivate",
          name: "Cultivate",
          cmc: 3,
          colorIdentity: ["G"],
          category: "ramp",
          zone: "maybeboard",
        }),
      ],
      playedCards
    );

    expect(result.roleDifferences).toEqual([]);
  });

  it("leaves the companion out of the curve, colours and roles", () => {
    const result = compareDeckProfiles(
      [
        ...playedCards,
        aDeckCard({
          id: "lurrus",
          name: "Lurrus of the Dream-Den",
          cmc: 3,
          colorIdentity: ["W", "B"],
          category: "companion",
        }),
      ],
      playedCards
    );

    expect(result).toMatchObject({
      leftAverageCmc: 1.5,
      onlyLeftColors: [],
      roleDifferences: [],
    });
  });

  it("still counts the commander and the partner in the curve, colours and roles", () => {
    const result = compareDeckProfiles(
      [
        {
          ...aDeckCard({
            id: "tymna",
            name: "Tymna the Weaver",
            cmc: 3,
            colorIdentity: ["W", "B"],
            category: "draw",
          }),
          isCommander: true,
        },
        {
          ...aDeckCard({
            id: "thrasios",
            name: "Thrasios, Triton Hero",
            cmc: 2,
            colorIdentity: ["G", "U"],
            category: "draw",
          }),
          isCommander: true,
          isPartner: true,
        },
        ...playedCards,
      ],
      playedCards
    );

    expect(result).toMatchObject({
      leftAverageCmc: 2,
      onlyLeftColors: ["W", "B", "G"],
      roleDifferences: [{ role: "draw", leftQuantity: 2, rightQuantity: 0 }],
    });
  });

  it("leaves a sideboard card out of the curve, colours and roles (was pinned reading every zone until I-31)", () => {
    const result = compareDeckProfiles(
      [
        aDeckCard({
          id: "sol-ring",
          name: "Sol Ring",
          cmc: 1,
          category: "ramp",
        }),
        aDeckCard({
          id: "rest",
          name: "Rest in Peace",
          cmc: 3,
          colorIdentity: ["W"],
          category: "removal",
          zone: "sideboard",
        }),
      ],
      [
        aDeckCard({
          id: "signet",
          name: "Arcane Signet",
          cmc: 2,
          category: "ramp",
        }),
      ]
    );

    expect(result.leftAverageCmc).toBe(1);
    expect(result.onlyLeftColors).toEqual([]);
    expect(result.roleDifferences).toEqual([]);
  });
});
