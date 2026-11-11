import { afterEach, describe, expect, it, vi } from "vitest";
import { randomIntBelow } from "@/lib/crypto-random";
import { intBelowFrom, mulberry32, replayWebCrypto } from "./seeded-random";

/** Takes the next `count` values from a generator function. */
const take = (count: number, next: () => number) =>
  Array.from({ length: count }, next);

describe("mulberry32", () => {
  it("replays the same words for the same seed", () => {
    expect(take(5, mulberry32(42))).toEqual(take(5, mulberry32(42)));
  });

  it("gives different words for different seeds", () => {
    expect(take(5, mulberry32(42))).not.toEqual(take(5, mulberry32(43)));
  });

  it("yields unsigned 32-bit integers", () => {
    for (const word of take(1000, mulberry32(7))) {
      expect(Number.isInteger(word)).toBe(true);
      expect(word).toBeGreaterThanOrEqual(0);
      expect(word).toBeLessThan(2 ** 32);
    }
  });
});

describe("intBelowFrom", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stays within the bound", () => {
    const words = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const value = intBelowFrom(words, 6);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
  });

  it("discards a word above the largest multiple of the bound, as randomIntBelow does", () => {
    const words = [2 ** 32 - 1, 10];
    const next = () => words.shift() ?? 0;

    // 2^32 - 1 is past the last whole run of 3 below 2^32, so 10 % 3 is drawn instead.
    expect(intBelowFrom(next, 3)).toBe(1);
  });

  it("matches randomIntBelow when Web Crypto replays the same words", () => {
    const bounds = [100, 99, 52, 7, 2, 1];
    replayWebCrypto(mulberry32(2026));

    const throughCrypto = bounds.map((bound) => randomIntBelow(bound));
    const fromStream = mulberry32(2026);

    expect(throughCrypto).toEqual(
      bounds.map((bound) => intBelowFrom(fromStream, bound))
    );
  });

  it("leaves Web Crypto alone once the mocks are restored", () => {
    replayWebCrypto(mulberry32(1));
    vi.restoreAllMocks();

    expect(crypto.getRandomValues(new Uint8Array(4))).toHaveLength(4);
  });

  it("rejects a bound that is not a positive integer", () => {
    expect(() => intBelowFrom(mulberry32(1), 0)).toThrow(RangeError);
    expect(() => intBelowFrom(mulberry32(1), 2.5)).toThrow(RangeError);
  });
});
