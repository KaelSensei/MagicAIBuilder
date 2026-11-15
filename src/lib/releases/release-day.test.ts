import { describe, expect, it } from "vitest";
import { releaseDayOf } from "./release-day";

describe("releaseDayOf", () => {
  it.each([
    ["noon UTC", "2026-11-15T12:00:00Z", "2026-11-15"],
    ["an evening in New York that is already the next day in UTC", "2026-11-14T22:00:00-05:00", "2026-11-15"],
    ["a morning in Paris that is still the previous day in UTC", "2026-11-15T00:30:00+01:00", "2026-11-14"],
  ])("reads %s as the UTC calendar day", (_case, instant, day) => {
    expect(releaseDayOf(new Date(instant))).toBe(day);
  });
});
