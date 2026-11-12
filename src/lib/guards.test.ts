import { describe, expect, it } from "vitest";
import { isNonEmptyString, isRecord, isRecordOrArray } from "./guards";

describe("isRecord", () => {
  it("accepts a plain object, empty or not", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ name: "Sol Ring" })).toBe(true);
  });

  it("rejects an array, so a list never passes for a keyed payload", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([{ name: "Sol Ring" }])).toBe(false);
  });

  it("rejects null, which typeof reports as an object", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("rejects primitives and undefined", () => {
    expect(isRecord("x")).toBe(false);
    expect(isRecord(1)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("isRecordOrArray", () => {
  it("accepts a plain object", () => {
    expect(isRecordOrArray({ name: "Sol Ring" })).toBe(true);
  });

  it("accepts an array too, unlike isRecord", () => {
    expect(isRecordOrArray([])).toBe(true);
  });

  it("rejects null and primitives", () => {
    expect(isRecordOrArray(null)).toBe(false);
    expect(isRecordOrArray("x")).toBe(false);
    expect(isRecordOrArray(undefined)).toBe(false);
  });
});

describe("isNonEmptyString", () => {
  it("accepts a string with at least one character", () => {
    expect(isNonEmptyString("a")).toBe(true);
  });

  it("accepts a whitespace-only string: it checks length, not content", () => {
    expect(isNonEmptyString(" ")).toBe(true);
  });

  it("rejects the empty string", () => {
    expect(isNonEmptyString("")).toBe(false);
  });

  it("rejects values that are not strings", () => {
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(1)).toBe(false);
    expect(isNonEmptyString(["a"])).toBe(false);
  });
});
