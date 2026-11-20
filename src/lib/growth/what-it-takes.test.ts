import { describe, expect, it } from "vitest";
import { whatItTakes } from "./what-it-takes";

describe("whatItTakes", () => {
  it("needs 733 active accounts and 244 sign-ups a month for the monthly floor's 22 payers", () => {
    expect(
      whatItTakes({ payers: 22, conversion: 0.03, activation: 0.3, churn: 0.1 })
    ).toEqual({ activeAccounts: 733, signUpsPerMonth: 244 });
  });

  /**
   * The table of I-72 9.1, one row per I-66 goal: payers, conversion, active accounts, and the
   * sign-ups a month at a churn of 10%, then 5% and 20%. Activation is 30% throughout.
   */
  const SPEC_TABLE_9_1 = [
    { goal: "floor, monthly plan", payers: 22, conversion: 0.03, active: 733, signUps: [244, 122, 489] },
    { goal: "floor, yearly plan", payers: 33, conversion: 0.03, active: 1_100, signUps: [367, 183, 733] },
    { goal: "living, monthly plan", payers: 1_230, conversion: 0.03, active: 41_000, signUps: [13_667, 6_833, 27_333] },
    { goal: "living, yearly plan", payers: 1_870, conversion: 0.03, active: 62_333, signUps: [20_778, 10_389, 41_556] },
    { goal: "living, monthly, 5% conversion", payers: 1_230, conversion: 0.05, active: 24_600, signUps: [8_200, 4_100, 16_400] },
  ] as const;

  it.each(SPEC_TABLE_9_1)(
    "reproduces the spec's row for the $goal",
    ({ payers, conversion, active, signUps }) => {
      const atChurn = (churn: number) =>
        whatItTakes({ payers, conversion, activation: 0.3, churn });

      expect([atChurn(0.1), atChurn(0.05), atChurn(0.2)]).toEqual(
        signUps.map((signUpsPerMonth) => ({ activeAccounts: active, signUpsPerMonth }))
      );
    }
  );

  it("counts the sign-ups from the unrounded active base", () => {
    // 1 payer at 40% is 2.5 active accounts, shown as 3; 2.5 × 100% ÷ 50% is 5 sign-ups, not 6.
    expect(
      whatItTakes({ payers: 1, conversion: 0.4, activation: 0.5, churn: 1 })
    ).toEqual({ activeAccounts: 3, signUpsPerMonth: 5 });
  });

  it("refuses an activation of zero, which no number of sign-ups can meet", () => {
    expect(() =>
      whatItTakes({ payers: 22, conversion: 0.03, activation: 0, churn: 0.1 })
    ).toThrow(RangeError);
  });

  it("refuses a conversion of zero, which no number of active accounts can meet", () => {
    expect(() =>
      whatItTakes({ payers: 22, conversion: 0, activation: 0.3, churn: 0.1 })
    ).toThrow(RangeError);
  });

  it("refuses a rate that is not a number, as it refuses zero", () => {
    expect(() =>
      whatItTakes({
        payers: 22,
        conversion: 0.03,
        activation: Number.NaN,
        churn: 0.1,
      })
    ).toThrow(RangeError);
  });
});
