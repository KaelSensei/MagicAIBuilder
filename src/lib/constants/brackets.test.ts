import { describe, it, expect } from "vitest";
import { BRACKET_DEFINITIONS } from "@/lib/constants/brackets";
import type { BracketLevel } from "@/lib/constants/brackets";

describe("BRACKET_DEFINITIONS", () => {
  it("has definitions for all 4 brackets", () => {
    expect(Object.keys(BRACKET_DEFINITIONS)).toHaveLength(4);
    for (let i = 1; i <= 4; i++) {
      expect(BRACKET_DEFINITIONS[i as BracketLevel]).toBeDefined();
    }
  });

  it("bracket 1 has maxGameChangers 0 and no tutors", () => {
    const b1 = BRACKET_DEFINITIONS[1];
    expect(b1.maxGameChangers).toBe(0);
    expect(b1.allowsTutors).toBe(false);
    expect(b1.name).toBe("Casual");
  });

  it("bracket 2 allows tutors but no game changers", () => {
    const b2 = BRACKET_DEFINITIONS[2];
    expect(b2.maxGameChangers).toBe(0);
    expect(b2.allowsTutors).toBe(true);
    expect(b2.name).toBe("Core");
  });

  it("bracket 3 allows up to 3 game changers", () => {
    const b3 = BRACKET_DEFINITIONS[3];
    expect(b3.maxGameChangers).toBe(3);
    expect(b3.allowsTutors).toBe(true);
    expect(b3.name).toBe("Upgraded");
  });

  it("bracket 4 allows unlimited game changers", () => {
    const b4 = BRACKET_DEFINITIONS[4];
    expect(b4.maxGameChangers).toBe(Infinity);
    expect(b4.allowsTutors).toBe(true);
    expect(b4.name).toBe("Optimized");
  });

  it("each bracket has a color and cssVar", () => {
    for (let i = 1; i <= 4; i++) {
      const b = BRACKET_DEFINITIONS[i as BracketLevel];
      expect(b.color).toBeTruthy();
      expect(b.cssVar).toContain("bracket");
    }
  });
});
