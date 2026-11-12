/** Solitary tests for the basic-land rule read from a card's type line (CR 205.4c). */
import { describe, expect, it } from "vitest";
import { isBasicLand } from "./type-line";

describe("isBasicLand", () => {
  it("treats a Snow-Covered basic as a basic land", () => {
    expect(isBasicLand("Basic Snow Land — Forest")).toBe(true);
  });

  it.each([
    ["Forest", "Basic Land — Forest"],
    ["Wastes", "Basic Land"],
    ["Snow-Covered Wastes", "Basic Snow Land"],
  ])("treats %s as a basic land", (_name, typeLine) => {
    expect(isBasicLand(typeLine)).toBe(true);
  });

  // CR 205.4c: a land without the basic supertype is nonbasic, even with a basic land type.
  it.each([
    ["Dryad Arbor", "Land Creature — Forest Dryad"],
    ["Arctic Treeline", "Snow Land — Forest Plains"],
    ["Command Tower", "Land"],
    ["Sol Ring", "Artifact"],
    ["a row saved without a type line", ""],
  ])("treats %s as not a basic land", (_name, typeLine) => {
    expect(isBasicLand(typeLine)).toBe(false);
  });
});
