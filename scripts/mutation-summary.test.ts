// @vitest-environment node
/**
 * Pins the arithmetic behind the GitHub step summary written after a Stryker
 * run. The score follows the mutation-testing-elements definition, so the
 * figure in the step summary is the one the HTML report shows.
 */
import { describe, expect, it } from "vitest";
import { renderMarkdown, summarize } from "./mutation-summary.mjs";

type MutantStatus =
  | "Killed"
  | "Survived"
  | "NoCoverage"
  | "Timeout"
  | "CompileError"
  | "RuntimeError"
  | "Ignored"
  | "Pending";

/** A report in the mutation-testing-elements shape, reduced to what the summary reads. */
function reportOf(files: Readonly<Record<string, readonly MutantStatus[]>>) {
  return {
    schemaVersion: "2",
    thresholds: { high: 80, low: 60 },
    files: Object.fromEntries(
      Object.entries(files).map(([name, statuses]) => [
        name,
        {
          language: "typescript",
          source: "",
          mutants: statuses.map((status, index) => ({
            id: String(index),
            mutatorName: "ConditionalExpression",
            status,
          })),
        },
      ])
    ),
  };
}

const COMBO = "src/modules/combos/domain/combo.ts";
const DECK_QUERY = "src/modules/combos/domain/deck-query.ts";

describe("summarize", () => {
  it("scores the detected mutants over the valid ones", () => {
    const summary = summarize(
      reportOf({
        [COMBO]: ["Killed", "Killed", "Timeout", "Survived"],
        [DECK_QUERY]: ["Killed", "NoCoverage"],
      })
    );

    expect(summary.detected).toBe(4);
    expect(summary.undetected).toBe(2);
    expect(summary.score).toBeCloseTo(66.67, 2);
    expect(summary.scoreOnCoveredCode).toBeCloseTo(80, 2);
  });

  it("leaves compile errors, runtime errors and ignored mutants out of the score", () => {
    const summary = summarize(
      reportOf({
        [COMBO]: ["Killed", "CompileError", "RuntimeError", "Ignored"],
      })
    );

    expect(summary.score).toBe(100);
    expect(summary.invalid).toBe(2);
    expect(summary.ignored).toBe(1);
  });

  it("reports no score when no valid mutant exists", () => {
    const summary = summarize(reportOf({ [COMBO]: ["CompileError"] }));

    expect(summary.score).toBeNull();
    expect(summary.scoreOnCoveredCode).toBeNull();
  });

  it("scores each mutated file on its own", () => {
    const summary = summarize(
      reportOf({
        [COMBO]: ["Killed", "Survived"],
        [DECK_QUERY]: ["Killed", "Killed"],
      })
    );

    expect(summary.files).toEqual([
      { name: COMBO, score: 50, detected: 1, undetected: 1 },
      { name: DECK_QUERY, score: 100, detected: 2, undetected: 0 },
    ]);
  });
});

describe("renderMarkdown", () => {
  it("renders the overall score and one row per mutated file", () => {
    const markdown = renderMarkdown(
      summarize(
        reportOf({
          [COMBO]: ["Killed", "Killed", "Timeout", "Survived"],
          [DECK_QUERY]: ["Killed", "NoCoverage"],
        })
      )
    );

    expect(markdown).toContain("**Mutation score: 66.67 %**");
    expect(markdown).toContain(
      "4 detected · 2 undetected (1 survived, 1 without coverage)"
    );
    expect(markdown).toContain(`| \`${COMBO}\` | 75.00 % | 3 | 1 |`);
    expect(markdown).toContain(`| \`${DECK_QUERY}\` | 50.00 % | 1 | 1 |`);
  });

  it("says so when no mutant could be scored", () => {
    const markdown = renderMarkdown(summarize(reportOf({})));

    expect(markdown).toContain("**Mutation score: n/a**");
    expect(markdown).toContain("no valid mutant");
  });
});
