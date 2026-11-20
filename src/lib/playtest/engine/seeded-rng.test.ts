/**
 * The probability bench's seeded shuffle (I-21 slice 1): the same seed deals the
 * same library, and a different seed does not.
 */
import { describe, expect, it, vi } from "vitest";
import { shuffleCards } from "./shuffle";
import {
  createSeededRandom,
  intBelowFrom,
  mulberry32,
  shuffleWithSeed,
} from "./seeded-rng";

const LIBRARY = [
  "Island",
  "Sol Ring",
  "Arcane Signet",
  "Cultivate",
  "Birds of Paradise",
  "Counterspell",
  "Rhystic Study",
] as const;

describe("shuffleWithSeed", () => {
  it("deals the same library in the same order when the seed is the same", () => {
    expect(shuffleWithSeed(LIBRARY, 42)).toEqual(shuffleWithSeed(LIBRARY, 42));
  });

  it("deals a different order when the seed changes", () => {
    expect(shuffleWithSeed(LIBRARY, 42)).not.toEqual(
      shuffleWithSeed(LIBRARY, 43)
    );
  });

  it("leaves the library it was given unchanged", () => {
    const library = [...LIBRARY];
    shuffleWithSeed(library, 7);
    expect(library).toEqual([...LIBRARY]);
  });

  it("returns an empty library unchanged", () => {
    expect(shuffleWithSeed([], 1)).toEqual([]);
  });

  it("returns a one-card library unchanged", () => {
    expect(shuffleWithSeed(["Island"], 1)).toEqual(["Island"]);
  });

  it("never draws from Math.random", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      shuffleWithSeed(LIBRARY, 42);
      expect(random).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
    }
  });
});

describe("createSeededRandom", () => {
  it("replays the first shuffle from a new source built with the same seed", () => {
    const first = shuffleCards(LIBRARY, createSeededRandom(9));
    const replay = shuffleCards(LIBRARY, createSeededRandom(9));
    expect(replay).toEqual(first);
  });

  it("continues the stream, so a second shuffle from one source is a new order", () => {
    const source = createSeededRandom(9);
    const first = shuffleCards(LIBRARY, source);
    const second = shuffleCards(LIBRARY, source);
    expect(second).not.toEqual(first);
    expect(shuffleCards(LIBRARY, createSeededRandom(9))).toEqual(first);
  });

  it("rejects a bound that is not a positive integer", () => {
    const words = mulberry32(1);
    expect(() => intBelowFrom(words, 0)).toThrow(RangeError);
    expect(() => intBelowFrom(words, -3)).toThrow(RangeError);
    expect(() => intBelowFrom(words, 2.5)).toThrow(RangeError);
  });
});
