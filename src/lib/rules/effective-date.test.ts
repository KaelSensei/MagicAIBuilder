import { describe, expect, it } from "vitest";
import { parseRulesEffectiveDate } from "./effective-date";

describe("parseRulesEffectiveDate", () => {
  it("reads the date exactly as the bundled rules file prints it", () => {
    // MagicCompRules-20260807.txt: "These rules are effective as of August 7, 2026."
    expect(parseRulesEffectiveDate("August 7, 2026")).toEqual(
      new Date(Date.UTC(2026, 7, 7))
    );
  });

  it("places the date at UTC midnight so no server time zone can shift the day", () => {
    expect(parseRulesEffectiveDate("February 1, 2026")?.toISOString()).toBe(
      "2026-02-01T00:00:00.000Z"
    );
  });

  it("accepts a two-digit day", () => {
    expect(parseRulesEffectiveDate("November 14, 2025")).toEqual(
      new Date(Date.UTC(2025, 10, 14))
    );
  });

  it.each([
    ["an empty string", ""],
    ["an unknown month", "Smarch 7, 2026"],
    ["a day the month does not have", "February 30, 2026"],
    ["a day zero", "August 0, 2026"],
    ["an ISO date", "2026-08-07"],
    ["a date without its comma", "August 7 2026"],
    ["a lowercase month", "august 7, 2026"],
  ])("returns null for %s", (_label, text) => {
    expect(parseRulesEffectiveDate(text)).toBeNull();
  });
});
