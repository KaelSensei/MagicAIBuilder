/**
 * Plans a move map on a git working tree: which files move, which module
 * specifiers and path-keyed entries change, and which references would
 * resolve to no file.
 *
 * Planning reads the tree and writes nothing, so a dry run and a real run
 * take the same decisions; `apply-plan.ts` carries a ready plan out.
 *
 * Scanned sources: `.ts`, `.tsx`, `.js`, `.jsx` and their `m`/`c` variants
 * under `src/`, `e2e/` and `scripts/`. Root configs (`vitest.config.ts`,
 * `next.config.ts`, `sonar-project.properties`) and docs are not rewritten
 * yet: P0-08 adds them.
 *
 * @module refactor/move-plan
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { findModuleSpecifiers } from "./module-specifiers";
import { isAtOrUnder, type Move } from "./move-map";
import {
  rewriteKnownViolations,
  rewriteSuppressions,
  type JsonRewrite,
  type SpecifierRewrites,
} from "./path-keyed-files";
import {
  retargetSpecifier,
  type Importer,
  type ModuleLayout,
} from "./specifier-resolution";

/** What the plan does for one entry of the move map. */
export interface MoveOutcome {
  readonly move: Move;
  /** Files this run moves. 0 with `kept` 0 means the move was applied before. */
  readonly moved: number;
  /** Files left at the old path because the destination already holds a file, such as a re-export shim left behind on purpose. */
  readonly kept: number;
}

/** One file to move. `tracked` files go through `git mv`; untracked ones are renamed on disk. */
export interface FileMove {
  readonly from: string;
  readonly to: string;
  readonly tracked: boolean;
}

/** One rewritten specifier, for the report. */
export interface SpecifierEdit {
  readonly line: number;
  readonly before: string;
  readonly after: string;
}

/** A source file's new content, at its path after the moves. */
export interface SourceRewrite {
  readonly path: string;
  readonly content: string;
  readonly edits: readonly SpecifierEdit[];
}

/** A path-keyed JSON file's new content, with how many entries or keys changed. */
export interface PathKeyedRewrite {
  readonly path: string;
  readonly content: string;
  readonly count: number;
}

/** A specifier that resolves to no file, before or after the moves. */
export interface DanglingReference {
  readonly file: string;
  readonly line: number;
  readonly specifier: string;
}

interface PlannedChanges {
  readonly moves: readonly MoveOutcome[];
  readonly fileMoves: readonly FileMove[];
  readonly fileEdits: readonly SourceRewrite[];
  readonly jsonEdits: readonly PathKeyedRewrite[];
}

/** A plan ready to apply. */
export type ReadyPlan = PlannedChanges & { readonly kind: "ready" };

/**
 * The changes a move map makes. A `blocked` plan has references that resolve
 * to no file and must not be applied: a move would hide them among its edits.
 */
export type MovePlan =
  | ReadyPlan
  | (PlannedChanges & {
      readonly kind: "blocked";
      readonly dangling: readonly DanglingReference[];
    });

const SCANNED_FOLDERS = ["src", "e2e", "scripts"] as const;
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;

/** The path-keyed files that follow the moves, when they exist; `path-keyed-files.ts` says what each needs. */
const PATH_KEYED_FILES: readonly {
  readonly path: string;
  readonly rewrite: (
    text: string,
    moves: readonly Move[],
    rewrites: SpecifierRewrites
  ) => JsonRewrite | undefined;
}[] = [
  {
    path: ".dependency-cruiser-known-violations.json",
    rewrite: rewriteKnownViolations,
  },
  {
    path: "eslint-suppressions.json",
    rewrite: (text, moves) => rewriteSuppressions(text, moves),
  },
];

/**
 * Works out what applying `moves` to the working tree at `root` changes,
 * without writing anything.
 *
 * Each move covers the files listed by git (tracked, or untracked and not
 * ignored) at or under its `from`, in map order, so a later move can take an
 * earlier destination further. A move with nothing left at `from` was applied
 * before and is skipped; its references are still rewritten.
 *
 * @param root - the repository root; every path in the plan is relative to it
 * @throws Error when two moves claim one destination, or a file would move onto a folder
 */
export function planMoves(root: string, moves: readonly Move[]): MovePlan {
  const tracked = new Set(gitFiles(root, ["--cached"]));
  const listed = [
    ...tracked,
    ...gitFiles(root, ["--others", "--exclude-standard"]),
  ].filter((path) => isFileOnDisk(root, path));
  const { layout, outcomes } = expandMoves(listed, moves);
  const listedSet = new Set(listed);
  const onDisk = new Map<string, boolean>();
  const moduleLayout: ModuleLayout = {
    moves,
    isFile: (path) =>
      layout.has(path) ||
      (!listedSet.has(path) &&
        cached(onDisk, path, () => isFileOnDisk(root, path))),
  };

  const fileEdits: SourceRewrite[] = [];
  const dangling: DanglingReference[] = [];
  for (const [path, writtenAt] of [...layout].sort(byKey)) {
    if (!isScannedSource(path)) continue;
    const result = rewriteSource(
      readFileSync(join(root, writtenAt), "utf8"),
      { path, writtenAt },
      moduleLayout
    );
    dangling.push(...result.dangling);
    if (result.edits.length > 0)
      fileEdits.push({ path, content: result.content, edits: result.edits });
  }

  const changes: PlannedChanges = {
    moves: outcomes,
    fileMoves: [...layout]
      .filter(([path, writtenAt]) => path !== writtenAt)
      .map(([to, from]) => ({ from, to, tracked: tracked.has(from) })),
    fileEdits,
    jsonEdits: rewritePathKeyedFiles(
      root,
      moves,
      specifierRewritesOf(fileEdits)
    ),
  };
  return dangling.length === 0
    ? { kind: "ready", ...changes }
    : { kind: "blocked", ...changes, dangling };
}

/** Runs the moves over the listed files, returning each file's path after the moves mapped to its path now. */
function expandMoves(
  files: readonly string[],
  moves: readonly Move[]
): {
  readonly layout: ReadonlyMap<string, string>;
  readonly outcomes: readonly MoveOutcome[];
} {
  const layout = new Map(files.map((path) => [path, path]));
  const outcomes = moves.map((move): MoveOutcome => {
    let moved = 0;
    let kept = 0;
    for (const [path, writtenAt] of [...layout].filter(([path]) =>
      isAtOrUnder(path, move.from)
    )) {
      const destination = move.to + path.slice(move.from.length);
      const occupant = layout.get(destination);
      if (occupant !== undefined && occupant !== destination) {
        throw new Error(
          `two moves claim ${destination} (from ${occupant} and ${writtenAt})`
        );
      }
      if (occupant !== undefined) {
        kept += 1;
        continue;
      }
      if (
        [...layout.keys()].some((other) => other.startsWith(`${destination}/`))
      ) {
        throw new Error(`${path} would move onto the folder ${destination}`);
      }
      layout.delete(path);
      layout.set(destination, writtenAt);
      moved += 1;
    }
    return { move, moved, kept };
  });
  return { layout, outcomes };
}

function rewriteSource(
  text: string,
  importer: Importer,
  layout: ModuleLayout
): {
  readonly content: string;
  readonly edits: readonly SpecifierEdit[];
  readonly dangling: readonly DanglingReference[];
} {
  const edits: SpecifierEdit[] = [];
  const dangling: DanglingReference[] = [];
  let content = "";
  let cursor = 0;
  for (const literal of findModuleSpecifiers(importer.writtenAt, text)) {
    const result = retargetSpecifier(literal.value, importer, layout);
    switch (result.kind) {
      case "external":
      case "unchanged":
        break;
      case "dangling":
        dangling.push({
          file: importer.path,
          line: literal.line,
          specifier: literal.value,
        });
        break;
      case "rewritten": {
        const quote = text[literal.start];
        content += `${text.slice(cursor, literal.start)}${quote}${result.specifier}${quote}`;
        cursor = literal.end;
        edits.push({
          line: literal.line,
          before: literal.value,
          after: result.specifier,
        });
        break;
      }
      default: {
        const unreachable: never = result;
        throw new Error(`unknown retarget ${JSON.stringify(unreachable)}`);
      }
    }
  }
  return { content: content + text.slice(cursor), edits, dangling };
}

function rewritePathKeyedFiles(
  root: string,
  moves: readonly Move[],
  rewrites: SpecifierRewrites
): readonly PathKeyedRewrite[] {
  return PATH_KEYED_FILES.flatMap(({ path, rewrite }) => {
    if (!existsSync(join(root, path))) return [];
    const result = rewrite(
      readFileSync(join(root, path), "utf8"),
      moves,
      rewrites
    );
    return result === undefined ? [] : [{ path, ...result }];
  });
}

function specifierRewritesOf(
  fileEdits: readonly SourceRewrite[]
): SpecifierRewrites {
  return new Map(
    fileEdits.map(({ path, edits }) => [
      path,
      new Map(edits.map(({ before, after }) => [before, after])),
    ])
  );
}

function gitFiles(root: string, options: readonly string[]): readonly string[] {
  return execFileSync("git", ["ls-files", "-z", ...options], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\0")
    .filter((path) => path !== "");
}

function isFileOnDisk(root: string, path: string): boolean {
  if (path === ".." || path.startsWith("../") || path.startsWith("/"))
    return false;
  return (
    statSync(join(root, path), { throwIfNoEntry: false })?.isFile() === true
  );
}

function isScannedSource(path: string): boolean {
  return (
    SOURCE_FILE.test(path) &&
    SCANNED_FOLDERS.some((folder) => isAtOrUnder(path, folder))
  );
}

function cached(
  cache: Map<string, boolean>,
  key: string,
  compute: () => boolean
): boolean {
  const known = cache.get(key);
  if (known !== undefined) return known;
  const value = compute();
  cache.set(key, value);
  return value;
}

function byKey(
  [a]: readonly [string, string],
  [b]: readonly [string, string]
): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
