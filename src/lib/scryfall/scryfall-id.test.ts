import { describe, expect, it } from "vitest";
import { isScryfallId } from "./scryfall-id";

describe("isScryfallId", () => {
  it("accepts a printing id as Scryfall writes it, in lower case", () => {
    expect(isScryfallId("56ebc372-aabd-4174-a943-c7bf59e5028d")).toBe(true);
  });

  it("accepts the same id in upper case; callers lower-case it when they need to", () => {
    expect(isScryfallId("56EBC372-AABD-4174-A943-C7BF59E5028D")).toBe(true);
  });

  it.each([
    ["an empty string", ""],
    ["a card name", "Sol Ring"],
    ["an id without hyphens", "56ebc372aabd4174a943c7bf59e5028d"],
    ["an id one digit short", "56ebc372-aabd-4174-a943-c7bf59e5028"],
    [
      "an id with a trailing path",
      "56ebc372-aabd-4174-a943-c7bf59e5028d/rulings",
    ],
    ["an id with a non-hex digit", "56ebc372-aabd-4174-a943-c7bf59e5028g"],
    ["an id with surrounding spaces", " 56ebc372-aabd-4174-a943-c7bf59e5028d "],
  ])("refuses %s", (_label, value) => {
    expect(isScryfallId(value)).toBe(false);
  });
});
