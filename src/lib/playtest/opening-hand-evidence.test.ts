import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { analyzeOpeningHandLands } from "./opening-hand-evidence";

function card(typeLine: string): DeckCard {
  return {
    id: typeLine,
    scryfallId: typeLine,
    name: typeLine,
    quantity: 1,
    category: typeLine.includes("Land") ? "land" : "creature",
    zone: "main",
    manaCost: "",
    cmc: 0,
    typeLine,
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
  };
}

describe("analyzeOpeningHandLands", () => {
  it.each([
    { lands: 1, expected: "land-light" },
    { lands: 3, expected: "balanced" },
    { lands: 5, expected: "land-heavy" },
  ] as const)(
    "classifies a seven-card hand with $lands lands as $expected",
    ({ lands, expected }) => {
      const hand = [
        ...Array.from({ length: lands }, () => card("Basic Land — Forest")),
        ...Array.from({ length: 7 - lands }, () => card("Creature — Elf")),
      ];

      expect(analyzeOpeningHandLands(hand)).toEqual({
        landCount: lands,
        status: expected,
      });
    }
  );
});
