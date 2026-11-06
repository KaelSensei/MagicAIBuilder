import { describe, expect, it } from "vitest";
import type { DeckCard } from "./types";
import { findWeakestCard } from "./weakest-card";

function card(overrides: Partial<DeckCard>): DeckCard {
  return {
    id: "card-id",
    name: "Roleless Seven Drop",
    manaCost: "{7}",
    cmc: 7,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

describe("findWeakestCard", () => {
  it("selects the roleless card above the deck curve and exposes both criteria", () => {
    const result = findWeakestCard([
      card({ id: "ramp", name: "Arcane Signet", cmc: 2, category: "ramp" }),
      card({ id: "other", name: "Roleless Seven Drop", cmc: 7, category: "other" }),
    ]);

    expect(result).toEqual({
      card: expect.objectContaining({ name: "Roleless Seven Drop" }),
      criteria: ["unclassified-role", "above-deck-curve"],
    });
  });
});
