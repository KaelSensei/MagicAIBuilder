import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import {
  analyzeOpeningHand,
  analyzeOpeningHandLands,
} from "./opening-hand-evidence";

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

function playableCard(
  name: string,
  typeLine: string,
  manaCost: string,
  cmc: number,
  oracleText = ""
): DeckCard {
  return {
    ...card(typeLine),
    id: name,
    name,
    manaCost,
    cmc,
    oracleText,
    colorIdentity: manaCost.match(/[WUBRG]/g) ?? [],
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

describe("analyzeOpeningHand", () => {
  it("recognizes when an affordable spell has its required color", () => {
    const hand = [
      playableCard("Forest", "Basic Land — Forest", "", 0),
      playableCard("Forest 2", "Basic Land — Forest", "", 0),
      playableCard("Mountain", "Basic Land — Mountain", "", 0),
      playableCard("Elf", "Creature — Elf", "{1}{G}", 2),
      playableCard("Dragon", "Creature — Dragon", "{4}{R}", 5),
      playableCard("Growth", "Sorcery", "{3}{G}", 4),
      playableCard("Relic", "Artifact", "{4}", 4),
    ];

    expect(analyzeOpeningHand(hand)).toEqual({
      landCount: 3,
      landStatus: "balanced",
      missingColors: [],
      hasPlayableSpell: true,
      isDead: false,
    });
  });

  it("reports a missing color when an affordable spell cannot be paid", () => {
    const hand = [
      playableCard("Forest", "Basic Land — Forest", "", 0),
      playableCard("Forest 2", "Basic Land — Forest", "", 0),
      playableCard("Wastes", "Basic Land", "", 0, "{T}: Add {C}."),
      playableCard("Counterspell", "Instant", "{U}{U}", 2),
      playableCard("Dragon", "Creature — Dragon", "{4}{R}", 5),
      playableCard("Growth", "Sorcery", "{3}{G}", 4),
      playableCard("Relic", "Artifact", "{4}", 4),
    ];

    expect(analyzeOpeningHand(hand)).toEqual({
      landCount: 3,
      landStatus: "balanced",
      missingColors: ["U"],
      hasPlayableSpell: false,
      isDead: true,
    });
  });

  it("marks a balanced hand as dead when every spell is above its mana", () => {
    const hand = [
      playableCard("Forest", "Basic Land — Forest", "", 0),
      playableCard("Island", "Basic Land — Island", "", 0),
      playableCard("Mountain", "Basic Land — Mountain", "", 0),
      playableCard("Dragon", "Creature — Dragon", "{4}{R}", 5),
      playableCard("Sphinx", "Creature — Sphinx", "{4}{U}", 5),
      playableCard("Wurm", "Creature — Wurm", "{5}{G}", 6),
      playableCard("Relic", "Artifact", "{4}", 4),
    ];

    expect(analyzeOpeningHand(hand).isDead).toBe(true);
  });
});
