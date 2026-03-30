import { describe, it, expect } from "vitest";
import {
  ARCHETYPES,
  getArchetypeById,
  filterByDifficulty,
  getArchetypeForDeck,
} from "./archetypes";

// ─── Archetype library ─────────────────────────────────────────────────────
describe("ARCHETYPES", () => {
  it("contains at least 8 archetypes", () => {
    expect(ARCHETYPES.length).toBeGreaterThanOrEqual(8);
  });

  it("each archetype has required fields", () => {
    for (const arch of ARCHETYPES) {
      expect(arch.id).toBeTruthy();
      expect(arch.name).toBeTruthy();
      expect(arch.description).toBeTruthy();
      expect(arch.difficulty).toBeGreaterThanOrEqual(1);
      expect(arch.difficulty).toBeLessThanOrEqual(5);
      expect(arch.strengths.length).toBeGreaterThan(0);
      expect(arch.weaknesses.length).toBeGreaterThan(0);
    }
  });

  it("contains Combo archetype", () => {
    const combo = ARCHETYPES.find((a) => a.id === "combo");
    expect(combo).toBeDefined();
    expect(combo?.difficulty).toBeGreaterThan(3);
  });

  it("contains Voltron archetype with low difficulty", () => {
    const voltron = ARCHETYPES.find((a) => a.id === "voltron");
    expect(voltron).toBeDefined();
    expect(voltron?.difficulty).toBeLessThanOrEqual(2);
  });

  it("contains Stax as expert-level archetype", () => {
    const stax = ARCHETYPES.find((a) => a.id === "stax");
    expect(stax).toBeDefined();
    expect(stax?.difficulty).toBe(5);
  });
});

// ─── getArchetypeById ─────────────────────────────────────────────────────
describe("getArchetypeById", () => {
  it("returns archetype for valid id", () => {
    const arch = getArchetypeById("combo");
    expect(arch).toBeDefined();
    expect(arch?.name).toBe("Combo");
  });

  it("returns undefined for unknown id", () => {
    expect(getArchetypeById("nonexistent")).toBeUndefined();
  });
});

// ─── filterByDifficulty ───────────────────────────────────────────────────
describe("filterByDifficulty", () => {
  it("returns archetypes at or below max difficulty", () => {
    const easy = filterByDifficulty(ARCHETYPES, 2);
    expect(easy.every((a) => a.difficulty <= 2)).toBe(true);
  });

  it("returns all archetypes for max difficulty 5", () => {
    const all = filterByDifficulty(ARCHETYPES, 5);
    expect(all).toHaveLength(ARCHETYPES.length);
  });

  it("returns empty for max difficulty 0", () => {
    const none = filterByDifficulty(ARCHETYPES, 0);
    expect(none).toHaveLength(0);
  });
});

// ─── getArchetypeForDeck ──────────────────────────────────────────────────
describe("getArchetypeForDeck", () => {
  it("detects Combo archetype from tags", () => {
    const arch = getArchetypeForDeck(["Combo", "Fast"]);
    expect(arch?.id).toBe("combo");
  });

  it("detects Voltron from tags", () => {
    const arch = getArchetypeForDeck(["Voltron"]);
    expect(arch?.id).toBe("voltron");
  });

  it("returns undefined for unknown tags", () => {
    const arch = getArchetypeForDeck(["Unknown", "Random"]);
    expect(arch).toBeUndefined();
  });

  it("returns undefined for empty tags", () => {
    expect(getArchetypeForDeck([])).toBeUndefined();
  });
});
