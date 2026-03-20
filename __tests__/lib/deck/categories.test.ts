import { describe, it, expect } from "vitest";
import { categorizeCard, CATEGORY_LABELS } from "@/lib/deck/categories";
import type { ScryfallCard } from "@/lib/scryfall/types";

function makeCard(overrides: Partial<ScryfallCard>): ScryfallCard {
  return {
    id: "test-id",
    name: "Test Card",
    cmc: 2,
    type_line: "Instant",
    color_identity: [],
    ...overrides,
  };
}

describe("categorizeCard", () => {
  it("categorizes basic lands as land", () => {
    const card = makeCard({ type_line: "Basic Land — Forest", cmc: 0 });
    expect(categorizeCard(card)).toBe("land");
  });

  it("categorizes non-basic lands as land", () => {
    const card = makeCard({ type_line: "Land", cmc: 0, oracle_text: "T: Add {G}." });
    expect(categorizeCard(card)).toBe("land");
  });

  it("categorizes planeswalkers", () => {
    const card = makeCard({ type_line: "Legendary Planeswalker — Liliana", cmc: 4 });
    expect(categorizeCard(card)).toBe("planeswalker");
  });

  it("categorizes ramp spells", () => {
    const card = makeCard({
      type_line: "Sorcery",
      oracle_text: "Search your library for a basic land card and put it onto the battlefield.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("ramp");
  });

  it("categorizes mana rocks as ramp", () => {
    const card = makeCard({
      type_line: "Artifact",
      oracle_text: "{T}: Add {C}{C}.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("ramp");
  });

  it("categorizes board wipes", () => {
    const card = makeCard({
      type_line: "Sorcery",
      oracle_text: "Destroy all creatures.",
      cmc: 4,
    });
    expect(categorizeCard(card)).toBe("boardWipe");
  });

  it("categorizes single-target removal", () => {
    const card = makeCard({
      type_line: "Instant",
      oracle_text: "Destroy target creature.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("removal");
  });

  it("categorizes card draw spells", () => {
    const card = makeCard({
      type_line: "Instant",
      oracle_text: "Draw two cards.",
      cmc: 2,
    });
    expect(categorizeCard(card)).toBe("draw");
  });

  it("categorizes creatures as creature when no functional category applies", () => {
    const card = makeCard({
      type_line: "Creature — Human Warrior",
      oracle_text: "First strike",
      cmc: 3,
    });
    expect(categorizeCard(card)).toBe("creature");
  });

  it("categorizes enchantments as enchantment when no functional category applies", () => {
    const card = makeCard({
      type_line: "Enchantment",
      oracle_text: "Creatures you control get +1/+1.",
      cmc: 3,
    });
    expect(categorizeCard(card)).toBe("enchantment");
  });

  it("defaults to other for unknown types", () => {
    const card = makeCard({
      type_line: "Conspiracy",
      oracle_text: "Some strange effect.",
      cmc: 0,
    });
    expect(categorizeCard(card)).toBe("other");
  });
});

describe("CATEGORY_LABELS", () => {
  it("has a label for every category", () => {
    const categories = [
      "commander", "creature", "instant", "sorcery", "artifact",
      "enchantment", "planeswalker", "land", "ramp", "draw",
      "removal", "boardWipe", "winCondition", "protection", "other",
    ];
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]).toBeDefined();
    }
  });
});
