// Mutation testing of the domain layer: what Stryker mutates, how it runs the
// tests, and where the report goes. The run is advisory (ADR 0005 §8, owner
// decision OD-14 of 2026-11-10): the exit code never depends on the score, and
// the figure is read from the JSON report by scripts/mutation-summary.mjs.
// Locally: `pnpm mutation` (add `--force` to ignore the incremental file).
// In CI: .github/workflows/mutation.yml. Record: docs/engineering/quality-gate.md.

/** @type {import("@stryker-mutator/core").PartialStrykerOptions} */
const config = {
  // Named explicitly: with pnpm's strict node_modules, core's default
  // `@stryker-mutator/*` lookup finds no sibling package and loads no plugin.
  plugins: [
    "@stryker-mutator/vitest-runner",
    "@stryker-mutator/typescript-checker",
  ],

  // The pure domain layer only (ADR 0003). One glob across every context, so a
  // module that gains a `domain/` folder joins the run without a config change.
  mutate: ["src/modules/*/domain/**/*.ts", "!**/*.test.ts"],

  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
    // Vitest's module graph narrows the run to the test files that import a
    // mutated file, so neither the dry run nor a mutant runs the ~3,000
    // unrelated tests of the suite.
    related: true,
  },
  // Each mutant runs only the tests that executed its line in the dry run.
  coverageAnalysis: "perTest",

  // A mutant that no longer compiles is reported as such instead of as a
  // survivor, so the score counts only mutants a test could have caught.
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",

  reporters: ["html", "json", "clear-text", "progress"],
  htmlReporter: { fileName: "reports/mutation/mutation.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  // `high` and `low` only colour the report. `break: null` is what makes the
  // run advisory: no score fails the process.
  thresholds: { high: 80, low: 60, break: null },

  // The incremental file lets a later run re-test only the mutants whose
  // source or tests changed. CI carries it between runs as a cache.
  incremental: true,
  incrementalFile: "reports/mutation/stryker-incremental.json",

  // Two test-runner processes. The machine that runs this locally is shared by
  // several agents (4 cores, 7 GB); the CI runner has the same core count, and
  // today's mutant count does not need more.
  concurrency: 2,

  // Output folders are never needed in the sandbox copy of the project.
  ignorePatterns: [
    "/reports",
    "/coverage",
    "/playwright-report",
    "/test-results",
    "/playwright",
    "/.lighthouseci",
    "/.scannerwork",
  ],
};

export default config;
