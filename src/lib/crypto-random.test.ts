import { describe, it, expect } from "vitest";
import { randomIntBelow, randomAlphanumericId } from "./crypto-random";

describe("randomIntBelow", () => {
  it("throws when upperExclusive is not a positive integer", () => {
    expect(() => randomIntBelow(0)).toThrow(RangeError);
    expect(() => randomIntBelow(-1)).toThrow(RangeError);
    expect(() => randomIntBelow(1.5)).toThrow(RangeError);
  });

  it("returns 0 when upperExclusive is 1", () => {
    expect(randomIntBelow(1)).toBe(0);
  });

  it("returns values only in [0, n) for n = 20", () => {
    for (let k = 0; k < 200; k++) {
      const v = randomIntBelow(20);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(20);
    }
  });
});

describe("randomAlphanumericId", () => {
  it("throws when length invalid", () => {
    expect(() => randomAlphanumericId(0)).toThrow(RangeError);
    expect(() => randomAlphanumericId(-1)).toThrow(RangeError);
    expect(() => randomAlphanumericId(300)).toThrow(RangeError);
  });

  it("returns string of requested length using [a-z0-9 charset]", () => {
    const s = randomAlphanumericId(12);
    expect(s).toHaveLength(12);
    expect(s).toMatch(/^[a-z0-9]+$/);
  });
});
