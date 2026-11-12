// Turns Stryker's JSON report into the Markdown block the mutation workflow
// appends to the GitHub step summary. The score follows the
// mutation-testing-elements definition, so it matches the HTML report:
// detected = killed + timed out; undetected = survived + without coverage;
// score = detected / (detected + undetected). Compile errors, runtime errors
// and ignored mutants are reported but never scored.
//
// Usage: node scripts/mutation-summary.mjs [reports/mutation/mutation.json]
// The run is advisory, so a missing report prints a note and exits 0.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {{ readonly status: string }} ReportedMutant
 * @typedef {{ readonly mutants: readonly ReportedMutant[] }} ReportedFile
 * @typedef {{ readonly files: Readonly<Record<string, ReportedFile>> }} MutationReport
 *   The subset of the mutation-testing-elements report schema the summary reads.
 */

/**
 * @typedef {object} FileSummary
 * @property {string} name Path of the mutated file, as the report names it.
 * @property {number | null} score Percentage with two decimals; null without a valid mutant.
 * @property {number} detected Killed and timed-out mutants.
 * @property {number} undetected Survived mutants and mutants without coverage.
 */

/**
 * @typedef {object} MutationSummary
 * @property {number | null} score Detected over valid mutants, as a percentage; null when none is valid.
 * @property {number | null} scoreOnCoveredCode Detected over covered mutants; null when none is covered.
 * @property {number} detected
 * @property {number} undetected
 * @property {number} survived
 * @property {number} noCoverage
 * @property {number} invalid Compile and runtime errors: mutants a test could not have caught.
 * @property {number} ignored
 * @property {readonly FileSummary[]} files One entry per mutated file, in report order.
 */

const DETECTED = new Set(["Killed", "Timeout"]);
const INVALID = new Set(["CompileError", "RuntimeError"]);

/**
 * Rounds a ratio to a percentage with two decimals.
 *
 * @param {number} part
 * @param {number} whole
 * @returns {number | null} null when the whole is zero, so "no mutant" never reads as 0 %.
 */
function percentage(part, whole) {
  return whole === 0 ? null : Math.round((part / whole) * 10_000) / 100;
}

/**
 * Counts one file's mutants by outcome.
 *
 * @param {string} name
 * @param {ReportedFile} file
 */
function countFile(name, file) {
  const counts = {
    detected: 0,
    survived: 0,
    noCoverage: 0,
    invalid: 0,
    ignored: 0,
  };
  for (const { status } of file.mutants) {
    if (DETECTED.has(status)) counts.detected += 1;
    else if (status === "Survived") counts.survived += 1;
    else if (status === "NoCoverage") counts.noCoverage += 1;
    else if (INVALID.has(status)) counts.invalid += 1;
    else if (status === "Ignored") counts.ignored += 1;
  }
  const undetected = counts.survived + counts.noCoverage;
  /** @type {FileSummary} */
  const summary = {
    name,
    score: percentage(counts.detected, counts.detected + undetected),
    detected: counts.detected,
    undetected,
  };
  return { counts, summary };
}

/**
 * Computes the mutation score of a Stryker JSON report.
 *
 * @param {MutationReport} report The parsed `reports/mutation/mutation.json`.
 * @returns {MutationSummary}
 */
export function summarize(report) {
  const totals = {
    detected: 0,
    survived: 0,
    noCoverage: 0,
    invalid: 0,
    ignored: 0,
  };
  /** @type {FileSummary[]} */
  const files = [];
  for (const [name, file] of Object.entries(report.files)) {
    const { counts, summary } = countFile(name, file);
    totals.detected += counts.detected;
    totals.survived += counts.survived;
    totals.noCoverage += counts.noCoverage;
    totals.invalid += counts.invalid;
    totals.ignored += counts.ignored;
    files.push(summary);
  }
  const undetected = totals.survived + totals.noCoverage;
  return {
    score: percentage(totals.detected, totals.detected + undetected),
    scoreOnCoveredCode: percentage(
      totals.detected,
      totals.detected + totals.survived
    ),
    detected: totals.detected,
    undetected,
    survived: totals.survived,
    noCoverage: totals.noCoverage,
    invalid: totals.invalid,
    ignored: totals.ignored,
    files,
  };
}

/**
 * @param {number | null} score
 * @returns {string} "n/a" when there is nothing to score.
 */
function formatScore(score) {
  return score === null ? "n/a" : `${score.toFixed(2)} %`;
}

/**
 * Renders the summary as the Markdown block of the step summary.
 *
 * @param {MutationSummary} summary
 * @returns {string}
 */
export function renderMarkdown(summary) {
  const lines = [
    "## Mutation testing (advisory)",
    "",
    `**Mutation score: ${formatScore(summary.score)}**`,
    "",
  ];
  if (summary.score === null) {
    lines.push(
      "The report holds no valid mutant, so there is nothing to score."
    );
  } else {
    lines.push(
      `${summary.detected} detected · ${summary.undetected} undetected ` +
        `(${summary.survived} survived, ${summary.noCoverage} without coverage) · ` +
        `${summary.invalid} invalid · ${summary.ignored} ignored. ` +
        `On covered code: ${formatScore(summary.scoreOnCoveredCode)}.`,
      "",
      "| File | Score | Detected | Undetected |",
      "| --- | --- | --- | --- |",
      ...summary.files.map(
        (file) =>
          `| \`${file.name}\` | ${formatScore(file.score)} | ${file.detected} | ${file.undetected} |`
      )
    );
  }
  lines.push(
    "",
    "The score never fails the build. The HTML report is the `mutation-report` artifact of this run.",
    ""
  );
  return lines.join("\n");
}

/**
 * Prints the Markdown summary of a report file, or a note when the file is
 * missing because Stryker stopped before reporting.
 *
 * @param {string} reportPath
 */
function main(reportPath) {
  /** @type {string} */
  let raw;
  try {
    raw = readFileSync(reportPath, "utf8");
  } catch {
    process.stdout.write(
      `## Mutation testing (advisory)\n\nNo report at \`${reportPath}\`: Stryker stopped before reporting. See the step log.\n`
    );
    return;
  }
  /** @type {MutationReport} */
  const report = JSON.parse(raw);
  process.stdout.write(renderMarkdown(summarize(report)));
}

const isMain =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv[2] ?? "reports/mutation/mutation.json");
}
