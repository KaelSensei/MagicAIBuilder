import { describe, expect, it } from "vitest";
import { BRACKET_DEFINITIONS, BRACKET_LEVELS } from "@/lib/constants/brackets";
import { createDeckPlan, describeBracket } from "./deck-plan";

/** The rules the copilot must apply, per official bracket (bracket text of 2025-10-21). */
const OFFICIAL_RULES = [
  {
    bracket: 1,
    lines: [
      "Bracket 1 (Exhibition): a goal, theme or idea over power",
      "No Game Changers, extra turns or two-card combos unless highly thematic",
      "No mass land denial",
      "Tutors are allowed unless they are Game Changers",
      "Expect to play at least 9 turns before you win or lose",
    ],
  },
  {
    bracket: 2,
    lines: [
      "Bracket 2 (Core): unoptimized and straightforward",
      "No Game Changers",
      "No two-card combos (game-ending, lockout or infinite)",
      "No mass land denial or chained extra turns",
      "Tutors are allowed unless they are Game Changers",
      "Expect to play at least 8 turns before you win or lose",
    ],
  },
  {
    bracket: 3,
    lines: [
      "Bracket 3 (Upgraded): strong synergy and high card quality",
      "Up to 3 Game Changers",
      "No two-card combos (game-ending, lockout or infinite) before turn 6",
      "No mass land denial or chained extra turns",
      "Expect to play at least 6 turns before you win or lose",
    ],
  },
  {
    bracket: 4,
    lines: [
      "Bracket 4 (Optimized): lethal, consistent and fast, but not built for the cEDH metagame",
      "Unlimited Game Changers; only the banned list restricts cards",
      "Expect to play at least 4 turns before you win or lose",
    ],
  },
  {
    bracket: 5,
    lines: [
      "Bracket 5 (cEDH): built for the cEDH metagame, optimized for efficiency and consistency",
      "Unlimited Game Changers; only the banned list restricts cards",
      "Games can end on any turn",
    ],
  },
] as const;

describe("createDeckPlan bracket rules", () => {
  it.each(OFFICIAL_RULES)(
    "gives the copilot the official rules of Bracket $bracket",
    ({ bracket, lines }) => {
      const plan = createDeckPlan({
        budget: null,
        colors: ["B"],
        strategy: "Midrange",
        commanderName: null,
        bracket,
      });

      expect(plan.constraints.slice(-lines.length)).toEqual(lines);
    }
  );

  it.each(BRACKET_LEVELS)(
    "names Bracket %i as the bracket definitions do",
    (bracket) => {
      expect(describeBracket(bracket)).toMatch(
        new RegExp(
          `^Bracket ${bracket} \\(${BRACKET_DEFINITIONS[bracket].name}\\): `
        )
      );
    }
  );

  // Wizards removed the tutor restriction on 2025-10-21.
  it.each(BRACKET_LEVELS)("restricts no tutors at Bracket %i", (bracket) => {
    const plan = createDeckPlan({
      budget: null,
      colors: ["U"],
      strategy: "Combo",
      commanderName: null,
      bracket,
    });

    for (const line of plan.constraints.filter((constraint) =>
      /tutor/i.test(constraint)
    )) {
      expect(line).toBe("Tutors are allowed unless they are Game Changers");
    }
  });
});

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
        "Bracket 3 (Upgraded): strong synergy and high card quality",
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
