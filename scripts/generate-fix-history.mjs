import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ref = process.argv[2] ?? "HEAD";
const rows = execFileSync(
  "git",
  [
    "log",
    ref,
    "--no-merges",
    "--reverse",
    "--date=short",
    "--format=%H%x09%ad%x09%s",
  ],
  { encoding: "utf8" }
)
  .trim()
  .split("\n");
const fixes = rows.filter((row) =>
  /^fix(?:\([^)]*\))?!?:/i.test(row.split("\t").slice(2).join("\t"))
);
const source = execFileSync("git", ["rev-parse", ref], {
  encoding: "utf8",
}).trim();
const firstDate = rows[0]?.split("\t")[1] ?? "unknown";
const escapeCell = (value) =>
  value.replaceAll("|", "\\|").replaceAll("\r", " ");
const history = fixes.map((row) => {
  const [sha, date, ...subject] = row.split("\t");
  return `| ${date} | ${escapeCell(subject.join("\t"))} | [${sha.slice(0, 7)}](https://github.com/KaelSensei/MagicAIBuilder/commit/${sha}) |`;
});
writeFileSync(
  "docs/project/fix-history.md",
  [
    "# Fix History",
    "",
    `Project history begins on ${firstDate}. This register contains ${fixes.length} non-merge commits whose subject follows the conventional fix prefix.`,
    "",
    `Source snapshot: \`${source}\`. Dates are Git author dates, not release or QA dates.`,
    "",
    "## Interpretation",
    "",
    "Presence in this history means the commit is reachable from the source snapshot. It does not prove independent QA, production deployment, or that later changes did not revert it. Fixes recorded under other commit prefixes are not automatically classified here; consult [Changelog](changelog.md) and [Product Roadmap](../product/roadmap.md) for broader context.",
    "",
    "## Open Follow-Ups",
    "",
    "| Identified | Area | Status | Evidence / next step |",
    "| --- | --- | --- | --- |",
    "| 2026-10-09 | Shared save activity | Open | Bulk and manual bracket overlap is covered; other action combinations remain in I-01. |",
    "| 2026-10-09 | Mutation ownership | Open | Overlapping removal recovery and confirmed-baseline recovery remain in I-01. |",
    "| 2026-10-09 | E2E loading/session intermittency | Open | Earlier authenticated deck-list failures followed by a passing full run; root cause not established. |",
    "| 2026-10-09 | Sonar CI access | Blocked | Scanner fails before analysis with HTTP 403. Restore integration access; do not report zero issues. |",
    "| 2026-10-09 | Local Sonar temporary directory | Open | Windows scanner reported DirectoryNotEmptyException in .scannerwork/.sonartmp; diagnose before rerunning. |",
    "",
    "## Recorded Fix Commits",
    "",
    "| Author date | Commit subject | Evidence |",
    "| --- | --- | --- |",
    ...history,
    "",
    "## Maintenance",
    "",
    "Regenerate on the VPS after each merged batch using `node scripts/generate-fix-history.mjs origin/dev`, then format the Markdown with the repository formatter. Review open follow-ups manually and preserve the distinction between commit evidence and release validation.",
    "",
  ].join("\n")
);
