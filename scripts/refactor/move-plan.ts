/**
 * Plans a move map on a git working tree: which files move, which module
 * specifiers, config paths and path-keyed entries change, which references
 * would resolve to no file, and what the report lists without changing it.
 *
 * Planning reads the tree and writes nothing, so a dry run and a real run
 * take the same decisions; `apply-plan.ts` carries a ready plan out.
 *
 * Scanned sources: `.ts`, `.tsx`, `.js`, `.jsx` and their `m`/`c` variants
 * under `src/`, `e2e/` and `scripts/`, and at the repository root. The root
 * configs also get their hand-written paths rewritten (`config-files.ts`),
 * and `eslint.config.mjs` its migration guard (`migration-guard.ts`). Docs
 * are only reported (`old-path-report.ts`).
 *
 * @module refactor/move-plan
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  isRootConfig,
  rewriteRootConfig,
  scopeChanges,
  SCOPE_FILES,
  type PathEdit,
  type PatternList,
  type ScopeChange,
} from "./config-files";
import {
  generatedSection,
  GUARD_FILE,
  rewriteMigrationGuard,
} from "./migration-guard";
import { findModuleSpecifiers } from "./module-specifiers";
import { isAtOrUnder, type Move } from "./move-map";
import {
  findOldPathMentions,
  isReportedConfig,
  isReportedDoc,
  type PathMention,
} from "./old-path-report";
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

/** A source or config file's new content, at its path after the moves. */
export interface SourceRewrite {
  readonly path: string;
  readonly content: string;
  /** Rewritten module specifiers. */
  readonly edits: readonly SpecifierEdit[];
  /** Rewritten hand-written paths, in a root config only. */
  readonly pathEdits: readonly PathEdit[];
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
  /** Moved files that a coverage or test list stops or starts selecting: reported, not changed. */
  readonly scopeChanges: readonly ScopeChange[];
  /** Old paths still named in Markdown: reported, never rewritten. */
  readonly docMentions: readonly PathMention[];
  /** Old paths still named in root configs after their rewrite, in a comment for example: reported. */
  readonly configMentions: readonly PathMention[];
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
const ROOT_SOURCE = /^[^/]+\.[cm]?[jt]sx?$/;
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
  {
    path: GUARD_FILE,
    rewrite: (text, moves) => rewriteMigrationGuard(text, moves),
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
 * @throws Error when two moves claim one destination, a file would move onto a folder, or the map marks a shim and `eslint.config.mjs` has no generated section for it
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

  const files = [...layout].sort(byKey);
  const readNow = (writtenAt: string): string =>
    readFileSync(join(root, writtenAt), "utf8");
  const { fileEdits, lists, dangling } = rewriteFiles(
    files,
    moves,
    moduleLayout,
    readNow
  );
  const fileMoves = [...layout]
    .filter(([path, writtenAt]) => path !== writtenAt)
    .map(([to, from]) => ({ from, to, tracked: tracked.has(from) }));
  const edited = new Map(fileEdits.map(({ path, content }) => [path, content]));
  const jsonEdits = rewritePathKeyedFiles(
    moves,
    specifierRewritesOf(fileEdits),
    (path) =>
      edited.get(path) ??
      (existsSync(join(root, path)) ? readNow(path) : undefined)
  );
  for (const { path, content } of jsonEdits) edited.set(path, content);

  const changes: PlannedChanges = {
    moves: outcomes,
    fileMoves,
    fileEdits,
    jsonEdits,
    scopeChanges: scopeChanges(lists, fileMoves),
    ...reportOldPaths(
      files,
      moves,
      ([path, writtenAt]) => edited.get(path) ?? readNow(writtenAt)
    ),
  };
  return dangling.length === 0
    ? { kind: "ready", ...changes }
    : { kind: "blocked", ...changes, dangling };
}

/**
 * The source and config pass over every file: module specifiers in scanned
 * sources, then the hand-written paths of root configs on top, and the
 * pattern lists of the configs that decide coverage and test discovery.
 */
function rewriteFiles(
  files: readonly (readonly [string, string])[],
  moves: readonly Move[],
  moduleLayout: ModuleLayout,
  readNow: (writtenAt: string) => string
): {
  readonly fileEdits: readonly SourceRewrite[];
  readonly lists: readonly PatternList[];
  readonly dangling: readonly DanglingReference[];
} {
  const fileEdits: SourceRewrite[] = [];
  const lists: PatternList[] = [];
  const dangling: DanglingReference[] = [];
  for (const [path, writtenAt] of files) {
    const source = isScannedSource(path)
      ? rewriteSource(readNow(writtenAt), { path, writtenAt }, moduleLayout)
      : undefined;
    dangling.push(...(source?.dangling ?? []));
    const config = isRootConfig(path)
      ? rewriteRootConfig(path, source?.content ?? readNow(writtenAt), moves)
      : undefined;
    if (config !== undefined && SCOPE_FILES.has(path))
      lists.push(...config.lists);
    const content = config?.content ?? source?.content;
    const edits = source?.edits ?? [];
    const pathEdits = config?.edits ?? [];
    if (content !== undefined && edits.length + pathEdits.length > 0)
      fileEdits.push({ path, content, edits, pathEdits });
  }
  return { fileEdits, lists, dangling };
}

/**
 * The old paths still named in docs and in root configs, read from each
 * file's text after this plan's rewrites. The migration guard's generated
 * section is left out: its `from` paths are old on purpose.
 */
function reportOldPaths(
  files: readonly (readonly [string, string])[],
  moves: readonly Move[],
  textOf: (file: readonly [string, string]) => string
): Pick<PlannedChanges, "docMentions" | "configMentions"> {
  return {
    docMentions: files
      .filter(([path]) => isReportedDoc(path))
      .flatMap((file) => findOldPathMentions(file[0], textOf(file), moves)),
    configMentions: files
      .filter(([path]) => isReportedConfig(path))
      .flatMap((file) => {
        const text = textOf(file);
        const skipped =
          file[0] === GUARD_FILE ? generatedSection(text) : undefined;
        return findOldPathMentions(file[0], text, moves, skipped);
      }),
  };
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

/**
 * Runs each path-keyed rewrite on its file's current text: the text after
 * the other rewrites of this plan, so that the migration guard's section is
 * written into `eslint.config.mjs` after its config paths.
 */
function rewritePathKeyedFiles(
  moves: readonly Move[],
  rewrites: SpecifierRewrites,
  textOf: (path: string) => string | undefined
): readonly PathKeyedRewrite[] {
  return PATH_KEYED_FILES.flatMap(({ path, rewrite }) => {
    const text = textOf(path);
    if (text === undefined) return [];
    const result = rewrite(text, moves, rewrites);
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
    ROOT_SOURCE.test(path) ||
    (SOURCE_FILE.test(path) &&
      SCANNED_FOLDERS.some((folder) => isAtOrUnder(path, folder)))
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
