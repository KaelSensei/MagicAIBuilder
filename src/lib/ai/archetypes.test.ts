import { describe, it, expect } from "vitest";
import { detectArchetypes, ARCHETYPES, ARCHETYPE_PROMPT_HINTS } from "./archetypes";
import type { Archetype } from "./archetypes";

const BASE_CATEGORIES = { ramp: 8, draw: 6, removal: 5, boardWipe: 2, creatures: 15, lands: 36 };

describe("ARCHETYPES constant", () => {
  it("contains expected archetypes", () => {
    expect(ARCHETYPES).toContain("Combo");
    expect(ARCHETYPES).toContain("Voltron");
    expect(ARCHETYPES).toContain("Goodstuff");
  });

  it("has prompt hint for every archetype", () => {
    for (const arch of ARCHETYPES) {
      expect(ARCHETYPE_PROMPT_HINTS[arch as Archetype]).toBeTruthy();
    }
  });
});

describe("detectArchetypes", () => {
  it("returns Goodstuff for empty deck", () => {
    const result = detectArchetypes({ cardNames: [], categories: BASE_CATEGORIES });
    expect(result).toContain("Goodstuff");
  });

  it("detects Combo from tutor cards", () => {
    const result = detectArchetypes({
      cardNames: ["Demonic Tutor", "Vampiric Tutor", "Thassa's Oracle", "Sol Ring"],
      categories: BASE_CATEGORIES,
    });
    expect(result[0]).toBe("Combo");
  });

  it("detects Voltron from equipment cards", () => {
    const result = detectArchetypes({
      cardNames: ["Lightning Greaves", "Swiftfoot Boots", "Sword of Feast and Famine", "Sol Ring"],
      categories: BASE_CATEGORIES,
    });
    expect(result[0]).toBe("Voltron");
  });

  it("detects Aristocrats from sacrifice outlets", () => {
    const result = detectArchetypes({
      cardNames: ["Blood Artist", "Viscera Seer", "Ashnod's Altar", "Grave Pact"],
      categories: BASE_CATEGORIES,
    });
    expect(result[0]).toBe("Aristocrats");
  });

  it("detects Tokens from doubling effects", () => {
    const result = detectArchetypes({
      cardNames: ["Anointed Procession", "Parallel Lives", "Intangible Virtue"],
      categories: BASE_CATEGORIES,
    });
    expect(result[0]).toBe("Tokens");
  });

  it("detects Reanimator from graveyard cards", () => {
    const result = detectArchetypes({
      cardNames: ["Reanimate", "Entomb", "Buried Alive", "Animate Dead"],
      categories: BASE_CATEGORIES,
    });
    expect(result[0]).toBe("Reanimator");
  });

  it("detects Spellslinger from copy effects", () => {
    const result = detectArchetypes({
      cardNames: ["Thousand-Year Storm", "Guttersnipe", "Swarm Intelligence"],
      categories: BASE_CATEGORIES,
    });
    expect(result[0]).toBe("Spellslinger");
  });

  it("returns at most 2 archetypes", () => {
    const result = detectArchetypes({
      cardNames: ["Demonic Tutor", "Lightning Greaves", "Reanimate", "Blood Artist"],
      categories: BASE_CATEGORIES,
    });
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("boosts from detectedThemes", () => {
    const result = detectArchetypes({
      cardNames: [],
      categories: BASE_CATEGORIES,
      detectedThemes: ["Stax"],
    });
    expect(result[0]).toBe("Stax");
  });

  it("handles high ramp ratio heuristic", () => {
    const result = detectArchetypes({
      cardNames: ["Cultivate", "Kodama's Reach", "Selvala", "Zendikar Resurgent"],
      categories: { ...BASE_CATEGORIES, ramp: 20 },
    });
    expect(result[0]).toBe("Ramp");
  });
});
