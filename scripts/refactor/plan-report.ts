/**
 * The text the move codemod prints: what each move does, every rewritten
 * specifier as `file:line "before" -> "after"`, the path-keyed files touched,
 * and the dangling references that block a plan.
 *
 * @module refactor/plan-report
 */
import type { DanglingReference, MovePlan, MoveOutcome } from "./move-plan";

/** The plan as printed on standard output, one line per entry. */
export function describePlan(
  plan: MovePlan,
  dryRun: boolean
): readonly string[] {
  const edits = plan.fileEdits.flatMap(({ path, edits }) =>
    edits.map(
      ({ line, before, after }) => `  ${path}:${line} "${before}" -> "${after}"`
    )
  );
  return [
    `Move map: ${count(plan.moves.length, "entry", "entries")}${dryRun ? " (dry run: nothing is written)" : ""}`,
    ...plan.moves.map(
      (outcome) =>
        `  ${outcome.move.from} -> ${outcome.move.to}: ${describeOutcome(outcome)}`
    ),
    `Specifier edits: ${edits.length} in ${count(plan.fileEdits.length, "file", "files")}`,
    ...edits,
    `Path-keyed files: ${plan.jsonEdits.length}`,
    ...plan.jsonEdits.map(
      ({ path, count: changed }) =>
        `  ${path}: ${count(changed, "path", "paths")}`
    ),
  ];
}

/** The references that block a plan, as printed on standard error. */
export function describeDangling(
  dangling: readonly DanglingReference[]
): readonly string[] {
  return [
    `Dangling references: ${dangling.length}. Nothing was written; fix or map them, then run again.`,
    ...dangling.map(
      ({ file, line, specifier }) => `  ${file}:${line} "${specifier}"`
    ),
  ];
}

/** What to do after a real run. */
export const NEXT_STEPS: readonly string[] = [
  "Done. The index holds the renames and the working tree the rewrites:",
  "commit them apart (git commit, then git commit -a) to keep each rename at 100 % similarity.",
  "Then run: npx tsc --noEmit, pnpm lint, pnpm arch and the tests of the moved modules.",
];

function describeOutcome({ moved, kept }: MoveOutcome): string {
  if (moved === 0 && kept === 0)
    return "nothing left at the old path (already applied)";
  const moves = `moves ${count(moved, "file", "files")}`;
  return kept === 0
    ? moves
    : `${moves}, keeps ${kept} at the old path (the destination exists)`;
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
