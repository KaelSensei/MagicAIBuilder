/**
 * Command line of the move codemod: applies the move map
 * `scripts/refactor/moves.json` to the working tree of this repository.
 *
 *   pnpm refactor:apply-moves --dry-run   print the plan, write nothing
 *   pnpm refactor:apply-moves             move with git mv, rewrite specifiers
 *
 * It runs from anywhere in the repository (paths are taken from the git
 * root) and is safe to re-run: moves already applied are skipped. The
 * workflow is in scripts/refactor/README.md.
 *
 * Exit codes: 0 done or nothing to do; 1 a reference resolves to no file,
 * so nothing was written; 2 the command line or the move map is invalid, or
 * the map cannot be applied (two moves claim one destination, or a shim is
 * marked and eslint.config.mjs has no migration-guard section). What it only
 * reports (scope changes, old paths in docs and configs) never fails a run.
 *
 * @module refactor/apply-moves
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { parseMoveMap } from "./move-map";
import { applyPlan } from "./apply-plan";
import { planMoves } from "./move-plan";
import { describeDangling, describePlan, NEXT_STEPS } from "./plan-report";

const MOVE_MAP = "scripts/refactor/moves.json";

function main(argv: readonly string[]): number {
  try {
    const { values } = parseArgs({
      args: [...argv],
      options: { "dry-run": { type: "boolean" } },
      strict: true,
    });
    const dryRun = values["dry-run"] === true;
    const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim();
    const map = parseMoveMap(
      JSON.parse(readFileSync(join(root, MOVE_MAP), "utf8"))
    );
    if (!map.ok) {
      printLines(console.error, [
        `${MOVE_MAP} is invalid:`,
        ...map.errors.map((error) => `  ${error}`),
      ]);
      return 2;
    }
    const plan = planMoves(root, map.moves);
    printLines(console.log, describePlan(plan, dryRun));
    if (plan.kind === "blocked") {
      printLines(console.error, describeDangling(plan.dangling));
      return 1;
    }
    if (!dryRun) {
      applyPlan(root, plan);
      printLines(console.log, NEXT_STEPS);
    }
    return 0;
  } catch (error) {
    console.error(
      `apply-moves: ${error instanceof Error ? error.message : String(error)}`
    );
    return 2;
  }
}

function printLines(
  print: (line: string) => void,
  lines: readonly string[]
): void {
  for (const line of lines) print(line);
}

process.exitCode = main(process.argv.slice(2));
