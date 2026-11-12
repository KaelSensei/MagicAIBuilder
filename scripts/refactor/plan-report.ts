/**
 * The text the move codemod prints: what each move does, every rewritten
 * specifier and config path as `file:line "before" -> "after"`, the
 * path-keyed files touched, the dangling references that block a plan, and
 * what it reports without changing: coverage and test scope changes, and old
 * paths left in docs and configs.
 *
 * @module refactor/plan-report
 */
import type { ScopeChange } from "./config-files";
import type {
  DanglingReference,
  MovePlan,
  MoveOutcome,
  SpecifierEdit,
} from "./move-plan";
import type { PathMention } from "./old-path-report";

/** The plan as printed on standard output, one line per entry. */
export function describePlan(
  plan: MovePlan,
  dryRun: boolean
): readonly string[] {
  const specifiers = plan.fileEdits.map(({ path, edits }) => ({ path, edits }));
  const configPaths = plan.fileEdits.map(({ path, pathEdits }) => ({
    path,
    edits: pathEdits,
  }));
  return [
    `Move map: ${count(plan.moves.length, "entry", "entries")}${dryRun ? " (dry run: nothing is written)" : ""}`,
    ...plan.moves.map(
      (outcome) =>
        `  ${outcome.move.from} -> ${outcome.move.to}: ${describeOutcome(outcome)}`
    ),
    ...describeEdits("Specifier edits", specifiers),
    ...describeEdits("Config paths", configPaths),
    `Path-keyed files: ${plan.jsonEdits.length}`,
    ...plan.jsonEdits.map(
      ({ path, count: changed }) =>
        `  ${path}: ${count(changed, "entry", "entries")}`
    ),
    ...describeScope(plan.scopeChanges),
    ...describeMentions(
      "Old paths in docs (report only: edit the prose by hand)",
      plan.docMentions
    ),
    ...describeMentions(
      "Old paths left in configs (report only: edit them by hand)",
      plan.configMentions
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
  "Decide each coverage or test scope change, and fix the old paths reported in docs and configs by hand.",
  "Then run: npx tsc --noEmit, pnpm lint, pnpm arch and the tests of the moved modules.",
];

function describeEdits(
  title: string,
  files: readonly {
    readonly path: string;
    readonly edits: readonly SpecifierEdit[];
  }[]
): readonly string[] {
  const edited = files.filter(({ edits }) => edits.length > 0);
  const lines = edited.flatMap(({ path, edits }) =>
    edits.map(
      ({ line, before, after }) => `  ${path}:${line} "${before}" -> "${after}"`
    )
  );
  return [
    `${title}: ${lines.length} in ${count(edited.length, "file", "files")}`,
    ...lines,
  ];
}

function describeScope(changes: readonly ScopeChange[]): readonly string[] {
  return [
    `Coverage and test scope: ${count(changes.length, "change", "changes")} (report only: keep or change each list by hand)`,
    ...changes.map(
      ({ file, line, list, from, to, change }) =>
        `  ${file}:${line} ${list}: ${from} -> ${to} ${change} the list`
    ),
  ];
}

function describeMentions(
  title: string,
  mentions: readonly PathMention[]
): readonly string[] {
  const files = new Set(mentions.map(({ file }) => file));
  return [
    `${title}: ${mentions.length} in ${count(files.size, "file", "files")}`,
    ...mentions.map(
      ({ file, line, mention, replacement }) =>
        `  ${file}:${line} "${mention}" -> "${replacement}"`
    ),
  ];
}

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
