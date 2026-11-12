/**
 * Stale `vi.mock` guard: finds `vi.mock` and `vi.doMock` calls in test
 * sources and reports those whose module path no longer resolves.
 *
 * Why: Vitest applies a string mock to the module that the string resolves
 * to. When that module moves, the old string resolves to nothing, TypeScript
 * does not check it, and the mock silently stops applying. The test then
 * runs against the real module, or passes for the wrong reason. The typed
 * `vi.mock(import("…"))` form is type-checked, but most mocks still use
 * plain strings.
 *
 * Used by `vi-mock-paths.test.ts`, which runs it over every test file under
 * `src/`. The module is pure: it never touches the file system. The caller
 * passes a {@link ModuleLookup}.
 *
 * Limits, chosen to stay fast and dependency-free:
 * - Only a literal first argument is read: `"…"`, `'…'`, or a template
 *   literal without `${}`, also inside `import(…)`.
 * - A call on a comment line (`//`, `/*` or ` *`), or after `//` on the
 *   same line, is skipped.
 * - A package path is checked only for its package being installed, not
 *   against the package's `exports`.
 */
import { posix } from "node:path";

/** The Vitest function that registered the mock. */
export type MockMethod = "mock" | "doMock";

/** One `vi.mock` or `vi.doMock` call with a statically readable module path. */
export interface MockCall {
  readonly method: MockMethod;
  /** The module path exactly as written, e.g. `@/lib/db/prisma` or `./CardTooltip`. */
  readonly specifier: string;
  /** 1-based line of the `vi.mock` or `vi.doMock` call. */
  readonly line: number;
}

/** What the scanner may ask about the repository. Paths are POSIX and relative to its root. */
export interface ModuleLookup {
  /** True when `repoPath` (e.g. `src/lib/logger.ts`) is an existing file, not a folder. */
  readonly isFile: (repoPath: string) => boolean;
  /** True when a package (`next`, `@dnd-kit/core`) or a Node built-in (`node:fs`) can be imported. */
  readonly isInstalledPackage: (name: string) => boolean;
}

/** A test file to scan. `path` is POSIX and relative to the repository root. */
export interface TestSource {
  readonly path: string;
  readonly source: string;
}

/** Where a mock's module path leads. */
export type MockTarget =
  | { readonly kind: "module"; readonly path: string }
  | { readonly kind: "package"; readonly name: string }
  | { readonly kind: "missing-module"; readonly tried: readonly string[] }
  | { readonly kind: "missing-package"; readonly name: string };

/** A target that does not exist, so the mock applies to nothing. */
export type MissingTarget = Extract<
  MockTarget,
  { readonly kind: "missing-module" | "missing-package" }
>;

/** A mock whose module path does not resolve. */
export interface StaleMock {
  readonly file: string;
  readonly call: MockCall;
  readonly target: MissingTarget;
}

// `vi.mock(` or `vi.doMock(`, an optional `import(`, then a quoted path on any line.
const MOCK_CALL =
  /\bvi\s*\.\s*(mock|doMock)\s*\(\s*(?:import\s*\(\s*)?(["'`])([^"'`\n]+)\2/g;
const COMMENT_LINE_START = /^\s*(?:\/\*|\*)/;

// The order Vite tries for an extensionless path in this TypeScript-only `src/`.
const MODULE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"] as const;

/**
 * Lists the `vi.mock` and `vi.doMock` calls of one source file, in source
 * order, in a single pass. Calls whose path is not a literal, or that sit in
 * a comment, are left out (see the module header).
 */
export function findMockCalls(source: string): readonly MockCall[] {
  const calls: MockCall[] = [];
  let line = 1;
  let cursor = 0;
  for (const match of source.matchAll(MOCK_CALL)) {
    const [, method, quote, specifier] = match;
    const start = match.index;
    line += countNewlines(source, cursor, start);
    cursor = start;
    const lineStart = source.lastIndexOf("\n", start - 1) + 1;
    const before = source.slice(lineStart, start);
    const isComment = before.includes("//") || COMMENT_LINE_START.test(before);
    const isDynamic = quote === "`" && specifier.includes("${");
    if (!isComment && !isDynamic) {
      calls.push({
        method: method === "doMock" ? "doMock" : "mock",
        specifier,
        line,
      });
    }
  }
  return calls;
}

/**
 * Resolves a mocked module path the way Vite does for this repository:
 * - `@/x` is `src/x` (the alias in `vitest.config.ts` and `tsconfig.json`);
 * - `./x` and `../x` are relative to the folder of `testFile`;
 * - `/x` is relative to the repository root;
 * - anything else is a package, or a Node built-in such as `node:fs`.
 *
 * A module path matches the path itself, then `.ts`, `.tsx`, `/index.ts`
 * and `/index.tsx`.
 */
export function resolveMockTarget(
  specifier: string,
  testFile: string,
  lookup: ModuleLookup
): MockTarget {
  const base = moduleBase(specifier, testFile);
  if (base === null) {
    const name = packageName(specifier);
    return lookup.isInstalledPackage(name)
      ? { kind: "package", name }
      : { kind: "missing-package", name };
  }
  const tried = MODULE_SUFFIXES.map((suffix) => `${base}${suffix}`);
  const path = tried.find((candidate) => lookup.isFile(candidate));
  return path === undefined
    ? { kind: "missing-module", tried }
    : { kind: "module", path };
}

/** Scans every file and returns the mocks whose path does not resolve, in file and line order. */
export function findStaleMocks(
  files: readonly TestSource[],
  lookup: ModuleLookup
): readonly StaleMock[] {
  return files.flatMap((file) =>
    findMockCalls(file.source).flatMap((call): StaleMock[] => {
      const target = resolveMockTarget(call.specifier, file.path, lookup);
      return isMissing(target) ? [{ file: file.path, call, target }] : [];
    })
  );
}

/**
 * One line per stale mock, `file:line vi.mock "path": reason`, for the test
 * failure message. It never contains a call with a parenthesis, so a pasted
 * failure line is not itself read as a mock by a later scan.
 */
export function formatStaleMock({ file, call, target }: StaleMock): string {
  const where = `${file}:${call.line} vi.${call.method} "${call.specifier}"`;
  switch (target.kind) {
    case "missing-module":
      return `${where}: no module at ${target.tried.join(", ")}`;
    case "missing-package":
      return `${where}: package "${target.name}" is not installed`;
    default: {
      const unreachable: never = target;
      return unreachable;
    }
  }
}

/** Line breaks in `source` from `from` (inclusive) to `to` (exclusive). */
function countNewlines(source: string, from: number, to: number): number {
  let count = 0;
  let index = source.indexOf("\n", from);
  while (index !== -1 && index < to) {
    count += 1;
    index = source.indexOf("\n", index + 1);
  }
  return count;
}

/** The repository-relative path a module specifier points at, or null for a package. */
function moduleBase(specifier: string, testFile: string): string | null {
  if (specifier.startsWith("@/")) return posix.join("src", specifier.slice(2));
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return posix.join(posix.dirname(testFile), specifier);
  }
  if (specifier.startsWith("/")) return posix.normalize(specifier.slice(1));
  return null;
}

/** `next/navigation` gives `next`, `@dnd-kit/core/x` gives `@dnd-kit/core`, `node:fs` stays `node:fs`. */
function packageName(specifier: string): string {
  const segmentCount = specifier.startsWith("@") ? 2 : 1;
  return specifier.split("/").slice(0, segmentCount).join("/");
}

function isMissing(target: MockTarget): target is MissingTarget {
  return target.kind === "missing-module" || target.kind === "missing-package";
}
