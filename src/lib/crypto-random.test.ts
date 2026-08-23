import { describe, it, expect, afterEach, vi } from "vitest";
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

  describe("modulo bias", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /**
     * Feeds getRandomValues a chosen byte sequence so the mapping can be read
     * off directly, rather than inferred from a distribution.
     */
    function stubBytes(sequence: readonly number[]): void {
      let cursor = 0;
      vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation((array) => {
        const view = array as Uint8Array;
        for (let i = 0; i < view.length; i++) {
          view[i] = sequence[cursor % sequence.length] ?? 0;
          cursor++;
        }
        return array;
      });
    }

    // 256 is not a multiple of 36. Folding with % 36 maps 252->'a', 253->'b',
    // 254->'c' and 255->'d', handing those four an eighth chance the other
    // thirty-two never get. They have to be rejected instead.
    //
    // 255 is the discriminating byte: folded it yields 'd', rejected it yields
    // whatever comes next. Picking 252 here would prove nothing, since 252 % 36
    // is 0 and both implementations answer 'a'.
    it("rejects an out-of-range byte instead of folding it onto 'd'", () => {
      stubBytes([255, 5]);

      expect(randomAlphanumericId(1)).toBe("f");
    });

    it("rejects every byte in the biased tail", () => {
      for (const [byte, folded] of [
        [252, "a"],
        [253, "b"],
        [254, "c"],
        [255, "d"],
      ] as const) {
        stubBytes([byte, 5]);

        const id = randomAlphanumericId(1);
        expect(id).not.toBe(folded);
        expect(id).toBe("f");
      }
    });

    it("maps an in-range byte to its charset position", () => {
      stubBytes([0, 1, 35]);

      expect(randomAlphanumericId(3)).toBe("ab9");
    });

    it("still fills the requested length when rejections interleave", () => {
      stubBytes([255, 0, 255, 1]);

      expect(randomAlphanumericId(4)).toHaveLength(4);
    });
  });
});
