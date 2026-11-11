/**
 * Decides, for one module specifier, whether a move changes it and how to
 * write it from the importer's new place.
 *
 * A specifier is resolved the way TypeScript and Vite resolve it in this
 * repository (`@/` is `src/`, see `tsconfig.json` and `vitest.config.ts`),
 * except that every candidate path goes through the move map first. A
 * reference therefore resolves whether the target has already moved or not,
 * which is what makes a second run, or a run on a rebased branch, a no-op.
 *
 * Written form of a rewritten specifier:
 * - `@/…` stays `@/…`;
 * - a relative one stays relative while the target is in the importer's
 *   folder or below (`./x`), and becomes `@/…` when it would climb out of
 *   it inside `src/`; outside `src/` (e2e, scripts) it stays relative;
 * - the extension and `/index` are left out when the original left them out.
 *
 * @module refactor/specifier-resolution
 */
import { posix } from "node:path";
import {
  isAtOrUnder,
  mapMovedPath,
  originalPathOf,
  type Move,
} from "./move-map";

/** The repository once the moves have run. */
export interface ModuleLayout {
  readonly moves: readonly Move[];
  /** True when a file, not a folder, exists at this repository path after the moves. */
  readonly isFile: (path: string) => boolean;
}

/** The file that holds a specifier. */
export interface Importer {
  /** Its path once the moves have run. */
  readonly path: string;
  /** The path its specifiers were written for: the old path when this run moves the file, else `path`. */
  readonly writtenAt: string;
}

/** What a move does to one specifier. */
export type Retarget =
  /** A package or a Node built-in: never rewritten, never checked. */
  | { readonly kind: "external" }
  /** It resolves and its text stays as it is. */
  | { readonly kind: "unchanged" }
  /** It resolves once written as `specifier`. */
  | { readonly kind: "rewritten"; readonly specifier: string }
  /** It resolves to no file, before or after the moves. */
  | { readonly kind: "dangling" };

const ALIAS = "@/";
const SRC = "src";

// Close to the order of TypeScript's "bundler" resolution and Vite's default
// `resolve.extensions`, then the folder index files.
const SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".d.ts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  "/index.ts",
  "/index.tsx",
  "/index.d.ts",
  "/index.js",
  "/index.jsx",
] as const;

const CODE_EXTENSION = /(?:\.d)?\.[cm]?[jt]sx?$/;

/** A file a specifier reached: its path before and after the moves, and the suffix that matched. */
interface Target {
  readonly before: string;
  readonly after: string;
  readonly suffix: string;
}

/** A folder to resolve a relative specifier from, and whether the specifier must be rewritten even if its target stayed put. */
interface Base {
  readonly path: string;
  readonly stale: boolean;
}

/**
 * Resolves `specifier`, written in `importer`, against the layout after the
 * moves, and says whether its text must change.
 *
 * A relative specifier of a file that this run moves is read from the file's
 * old folder. One of a file already at its new path is read from there first
 * and, if that fails, from its old folder: that repairs a file that git or a
 * rebase moved without the codemod. If a file with the same name exists in
 * both folders, the new folder wins.
 */
export function retargetSpecifier(
  specifier: string,
  importer: Importer,
  layout: ModuleLayout
): Retarget {
  if (!isProjectSpecifier(specifier)) return { kind: "external" };
  for (const base of basesFor(specifier, importer, layout.moves)) {
    const target = findTarget(base.path, layout);
    if (target === undefined) continue;
    if (!base.stale && target.before === target.after)
      return { kind: "unchanged" };
    const rewritten = writeSpecifier(specifier, importer.path, target);
    return rewritten === specifier
      ? { kind: "unchanged" }
      : { kind: "rewritten", specifier: rewritten };
  }
  return { kind: "dangling" };
}

function isProjectSpecifier(specifier: string): boolean {
  return (
    specifier.startsWith(ALIAS) ||
    specifier === "." ||
    specifier === ".." ||
    specifier.startsWith("./") ||
    specifier.startsWith("../")
  );
}

function basesFor(
  specifier: string,
  importer: Importer,
  moves: readonly Move[]
): readonly Base[] {
  if (specifier.startsWith(ALIAS)) {
    return [
      { path: posix.join(SRC, specifier.slice(ALIAS.length)), stale: false },
    ];
  }
  const from = (file: string, stale: boolean): Base => ({
    path: posix.join(posix.dirname(file), specifier),
    stale,
  });
  if (importer.writtenAt !== importer.path)
    return [from(importer.writtenAt, true)];
  const original = originalPathOf(moves, importer.path);
  return original === importer.path
    ? [from(importer.path, false)]
    : [from(importer.path, false), from(original, true)];
}

function findTarget(base: string, layout: ModuleLayout): Target | undefined {
  for (const suffix of SUFFIXES) {
    const before = base + suffix;
    const after = mapMovedPath(layout.moves, before);
    if (layout.isFile(after)) return { before, after, suffix };
  }
  return undefined;
}

function writeSpecifier(
  specifier: string,
  importerPath: string,
  target: Target
): string {
  const modulePath = withoutSuffix(target);
  if (specifier.startsWith(ALIAS) && isAtOrUnder(modulePath, SRC))
    return aliasOf(modulePath);
  const relativePath = posix.relative(posix.dirname(importerPath), modulePath);
  if (relativePath !== ".." && !relativePath.startsWith("../")) {
    return relativePath === "" ? "." : `./${relativePath}`;
  }
  // Inside src/, a parent-relative path is written as @/: the import boundary
  // rules match specifiers, so P0-14 bans `../` there, and @/ survives the
  // next move of the importer.
  if (isAtOrUnder(importerPath, SRC) && isAtOrUnder(modulePath, SRC))
    return aliasOf(modulePath);
  return relativePath;
}

/** The module path as the original specifier spelled it: with or without extension and `/index`. */
function withoutSuffix({ after, suffix }: Target): string {
  if (suffix === "") return after;
  if (after.endsWith(suffix)) return after.slice(0, -suffix.length);
  return after.replace(CODE_EXTENSION, "");
}

function aliasOf(modulePath: string): string {
  return ALIAS + modulePath.slice(SRC.length + 1);
}
