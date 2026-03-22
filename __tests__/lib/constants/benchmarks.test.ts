import { describe, it, expect } from "vitest";
import { BENCHMARKS } from "@/lib/constants/benchmarks";

describe("BENCHMARKS", () => {
  it("has all required keys", () => {
    const keys = ["ramp", "draw", "removal", "tutors", "avgCmc", "gameChangers"];
    for (const key of keys) {
      expect(BENCHMARKS).toHaveProperty(key);
    }
  });

  it("each benchmark has low and high thresholds", () => {
    for (const [, value] of Object.entries(BENCHMARKS)) {
      expect(value).toHaveProperty("low");
      expect(value).toHaveProperty("high");
    }
  });

  it("ramp benchmarks are positive numbers", () => {
    expect(BENCHMARKS.ramp.low).toBeGreaterThan(0);
    expect(BENCHMARKS.ramp.high).toBeGreaterThan(BENCHMARKS.ramp.low);
  });

  it("avgCmc has inverted thresholds (lower avg cmc = higher bracket)", () => {
    // Low is the high-bracket threshold, high is the low-bracket threshold
    expect(BENCHMARKS.avgCmc.low).toBeGreaterThan(BENCHMARKS.avgCmc.high);
  });
});
