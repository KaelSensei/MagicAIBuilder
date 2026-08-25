import { describe, expect, it } from "vitest";
import { formatUsd } from "./currency";

describe("formatUsd", () => {
  it("formats USD with an English locale", () => {
    expect(formatUsd("en", 1234.5)).toBe("$1,234.50");
  });

  it("formats USD with a French locale", () => {
    expect(formatUsd("fr", 1234.5)).toBe("1\u202f234,50 $US");
  });

  it("keeps two fractional digits for whole prices", () => {
    expect(formatUsd("en", 5)).toBe("$5.00");
  });
});
