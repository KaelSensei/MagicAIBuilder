import { describe, expect, it } from "vitest";
import {
  countsAgainstAllowance,
  DEFAULT_AI_USAGE_LIMITS,
  readAiUsageLimits,
  usagePeriodAt,
  type AiCallOutcome,
} from "./policy";

describe("usagePeriodAt", () => {
  it("starts the period on the first of the month at midnight UTC and resets on the next first", () => {
    const period = usagePeriodAt(new Date("2026-11-09T15:30:00.000Z"));

    expect(period.start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(period.resetsAt.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });

  it("keeps the last millisecond of a month in that month", () => {
    const period = usagePeriodAt(new Date("2026-11-30T23:59:59.999Z"));

    expect(period.start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("opens a new period at the first instant of the next month", () => {
    const period = usagePeriodAt(new Date("2026-12-01T00:00:00.000Z"));

    expect(period.start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(period.resetsAt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  // 00:30 on 1 December in Paris is still 30 November in UTC.
  it("reads the month in UTC, not in the offset the instant was written with", () => {
    const period = usagePeriodAt(new Date("2026-12-01T00:30:00+01:00"));

    expect(period.start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("rolls December over into January of the next year", () => {
    const period = usagePeriodAt(new Date("2026-12-31T23:00:00.000Z"));

    expect(period.resetsAt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("countsAgainstAllowance", () => {
  it.each<[AiCallOutcome, boolean]>([
    ["ok", true],
    ["refused", true],
    ["truncated", false],
    ["parseFailed", false],
    ["rejectedByValidator", false],
    ["providerError", false],
  ])("a call that ended %s consumes the allowance: %s", (outcome, counts) => {
    expect(countsAgainstAllowance(outcome)).toBe(counts);
  });
});

describe("readAiUsageLimits", () => {
  it("defaults to 10 builds and 30 suggestion calls a month and a 20 USD spend ceiling", () => {
    expect(readAiUsageLimits({})).toEqual({
      monthlyCalls: { build: 10, suggest: 30 },
      monthlySpendCeilingMicroUsd: 20_000_000,
    });
    expect(readAiUsageLimits({})).toEqual(DEFAULT_AI_USAGE_LIMITS);
  });

  it("reads each allowance and the ceiling from the environment", () => {
    expect(
      readAiUsageLimits({
        AI_MONTHLY_BUILD_ALLOWANCE: "3",
        AI_MONTHLY_SUGGEST_ALLOWANCE: "0",
        AI_MONTHLY_SPEND_CEILING_USD: "12.5",
      })
    ).toEqual({
      monthlyCalls: { build: 3, suggest: 0 },
      monthlySpendCeilingMicroUsd: 12_500_000,
    });
  });

  it("keeps the default for a value that is not a non-negative number", () => {
    expect(
      readAiUsageLimits({
        AI_MONTHLY_BUILD_ALLOWANCE: "ten",
        AI_MONTHLY_SUGGEST_ALLOWANCE: "-4",
        AI_MONTHLY_SPEND_CEILING_USD: "",
      })
    ).toEqual(DEFAULT_AI_USAGE_LIMITS);
  });
});
