import { describe, expect, it } from "vitest";
import type { DeckCard } from "./types";
import { getCardRoleExplanation } from "./card-role-explanation";

function card(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "sol-ring",
    name: "Sol Ring",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "{T}: Add {C}{C}.",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "ramp",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

describe("getCardRoleExplanation", () => {
  it("reports the locally assigned role without interpreting card text", () => {
    expect(getCardRoleExplanation(card())).toEqual({
      kind: "category",
      category: "ramp",
    });
  });
});
