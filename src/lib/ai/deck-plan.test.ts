import { describe, expect, it } from "vitest";
import { createDeckPlan } from "./deck-plan";

describe("createDeckPlan", () => {
  it("turns a control brief into a concrete plan", () => {
    const plan = createDeckPlan({
      budget: 200,
      colors: ["W", "U"],
      strategy: "Control",
      commanderName: "Shorikai, Genesis Engine",
      bracket: 3,
    });

    expect(plan.gameplan).toContain("control");
    expect(plan.winConditions).toHaveLength(2);
    expect(plan.roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "Lands", target: "36-38" }),
        expect.objectContaining({ role: "Interaction", target: "12-15" }),
      ])
    );
    expect(plan.constraints).toEqual(
      expect.arrayContaining([
        "White, Blue color identity only",
        "Use Shorikai, Genesis Engine as commander",
        "$200 maximum per card",
        "Bracket 3: up to 3 game changers and no cEDH optimization",
      ])
    );
  });

  it("adapts win conditions and roles to a tokens strategy", () => {
    const plan = createDeckPlan({
      budget: null,
      colors: ["G", "W"],
      strategy: "Tokens",
      commanderName: null,
      bracket: 2,
    });

    expect(plan.winConditions[0]).toContain("token");
    expect(plan.roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "Token makers" }),
        expect.objectContaining({ role: "Payoffs" }),
      ])
    );
    expect(plan.constraints).toContain(
      "Choose a commander with exactly Green, White color identity"
    );
    expect(plan.constraints).toContain("Favor accessible cards; no price cap");
  });

  it("falls back to a balanced plan for an unknown strategy", () => {
    const plan = createDeckPlan({
      budget: null,
      colors: ["C"],
      strategy: "Artifacts matter",
      commanderName: null,
      bracket: 1,
    });

    expect(plan.gameplan).toContain("Artifacts matter");
    expect(plan.roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "Ramp" }),
        expect.objectContaining({ role: "Card advantage" }),
      ])
    );
    expect(plan.constraints).toContain("Colorless color identity only");
  });
});
