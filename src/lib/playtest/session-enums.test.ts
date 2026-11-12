import { describe, expect, it } from "vitest";

import {
  SESSION_DIFFICULTIES,
  SESSION_RESULTS,
  isSessionDifficulty,
  isSessionResult,
} from "./session-enums";

describe("isSessionResult", () => {
  it("accepts every result the schema stores", () => {
    for (const result of SESSION_RESULTS) {
      expect(isSessionResult(result)).toBe(true);
    }
  });

  it("refuses a result the schema cannot store", () => {
    expect(isSessionResult("victory")).toBe(false);
    expect(isSessionResult("Win")).toBe(false);
    expect(isSessionResult("")).toBe(false);
  });

  it("refuses anything that is not a string", () => {
    expect(isSessionResult(undefined)).toBe(false);
    expect(isSessionResult(null)).toBe(false);
    expect(isSessionResult(1)).toBe(false);
    expect(isSessionResult(["win"])).toBe(false);
  });
});

describe("isSessionDifficulty", () => {
  it("accepts every difficulty the schema stores", () => {
    for (const difficulty of SESSION_DIFFICULTIES) {
      expect(isSessionDifficulty(difficulty)).toBe(true);
    }
  });

  it("refuses a difficulty the schema cannot store", () => {
    expect(isSessionDifficulty("competitive")).toBe(false);
    expect(isSessionDifficulty("midrange")).toBe(false);
    expect(isSessionDifficulty("")).toBe(false);
  });

  it("treats an absent difficulty as not a difficulty, leaving optionality to the caller", () => {
    expect(isSessionDifficulty(undefined)).toBe(false);
    expect(isSessionDifficulty(null)).toBe(false);
  });
});
