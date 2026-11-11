/**
 * Keeps the repository's path-keyed JSON files in step with a move: the
 * dependency-cruiser baseline (`.dependency-cruiser-known-violations.json`)
 * and the ESLint bulk suppressions (`eslint-suppressions.json`).
 *
 * Both name files by repository path, so a move that leaves them alone turns
 * a known violation or a suppressed count into a new error. The baseline also
 * records each edge's specifier as written, which the codemod may rewrite.
 *
 * @module refactor/path-keyed-files
 */
import { mapMovedPath, type Move } from "./move-map";

/** New content for one file, and how many entries or keys changed. */
export interface JsonRewrite {
  readonly content: string;
  readonly count: number;
}

/** For each source file (path after the moves), its rewritten specifiers: text before to text after. */
export type SpecifierRewrites = ReadonlyMap<
  string,
  ReadonlyMap<string, string>
>;

// dependency-cruiser 18.7 types an import through tsconfig `paths` with these
// before its other types, as the baseline shows for every `@/` edge.
const ALIASED_TYPES: readonly string[] = [
  "aliased",
  "aliased-tsconfig",
  "aliased-tsconfig-paths",
];

/**
 * Updates the dependency-cruiser baseline so that every entry stays equal to
 * the violation the gate will report after the moves: paths in `from`, `to`,
 * `cycle` and `via` follow the moves, and an edge whose specifier the codemod
 * rewrote gets the new `unresolvedTo`, with `dependencyTypes` re-typed when
 * the specifier changed between relative and `@/`.
 *
 * Why every field: `--ignore-known` matches an entry on its rule and paths,
 * but the stale-entry count, which fails `pnpm arch`, compares `unresolvedTo`,
 * `type` and `dependencyTypes` too (`compareViolationsBase` in
 * dependency-cruiser's `src/graph-utl/compare.mjs`).
 *
 * The file is written as dependency-cruiser writes it: sorted by its
 * `compareViolations`, then `JSON.stringify(entries, null, 2)` and a newline.
 * A later shrink-only prune then only deletes entries. Returns `undefined`
 * when nothing changes or the file is not a list.
 *
 * Not updated: the `dependencyTypes` inside `cycle` elements, which no
 * comparison reads. A cycle whose path dependency-cruiser picks differently
 * once names change shows up as a stale entry in `pnpm arch`.
 */
export function rewriteKnownViolations(
  text: string,
  moves: readonly Move[],
  rewrites: SpecifierRewrites
): JsonRewrite | undefined {
  const entries: unknown = JSON.parse(text);
  if (!Array.isArray(entries)) return undefined;
  let count = 0;
  const updated = entries.map((entry: unknown) => {
    const next = refreshEdge(renamePaths(entry, moves), rewrites);
    if (JSON.stringify(next) !== JSON.stringify(entry)) count += 1;
    return next;
  });
  if (count === 0) return undefined;
  const sorted = updated.toSorted(compareViolations);
  return { content: `${JSON.stringify(sorted, null, 2)}\n`, count };
}

/**
 * Renames the moved files among the ESLint suppression keys, leaving the rest
 * of the file byte for byte as it was. ESLint keys suppressions by path
 * relative to where it runs, the repository root here.
 */
export function rewriteSuppressions(
  text: string,
  moves: readonly Move[]
): JsonRewrite | undefined {
  let count = 0;
  const content = text.replace(/"(?:[^"\\]|\\.)*"/g, (token) => {
    const value: unknown = JSON.parse(token);
    if (typeof value !== "string") return token;
    const moved = mapMovedPath(moves, value);
    if (moved === value) return token;
    count += 1;
    return JSON.stringify(moved);
  });
  return count === 0 ? undefined : { content, count };
}

/** Every string value in the tree that names a moved path, mapped; keys and other values unchanged. */
function renamePaths(value: unknown, moves: readonly Move[]): unknown {
  if (typeof value === "string") return mapMovedPath(moves, value);
  if (Array.isArray(value))
    return value.map((item: unknown) => renamePaths(item, moves));
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, renamePaths(item, moves)])
  );
}

function refreshEdge(entry: unknown, rewrites: SpecifierRewrites): unknown {
  if (!isRecord(entry)) return entry;
  const { from, unresolvedTo, dependencyTypes } = entry;
  if (typeof from !== "string" || typeof unresolvedTo !== "string")
    return entry;
  const rewritten = rewrites.get(from)?.get(unresolvedTo);
  if (rewritten === undefined) return entry;
  const formChanged = isAlias(unresolvedTo) !== isAlias(rewritten);
  return {
    ...entry,
    unresolvedTo: rewritten,
    ...(formChanged && isStringList(dependencyTypes)
      ? { dependencyTypes: retype(dependencyTypes, isAlias(rewritten)) }
      : {}),
  };
}

/**
 * dependency-cruiser's `compareViolations` (src/graph-utl/compare.mjs in
 * 18.7.2), the order its `--baseline` output is written in. Strings compare
 * with `localeCompare`, as there, so both agree in the same environment.
 */
function compareViolations(a: unknown, b: unknown): number {
  return (
    Math.sign(severityRank(a) - severityRank(b)) ||
    text(field(field(a, "rule"), "name")).localeCompare(
      text(field(field(b, "rule"), "name"))
    ) ||
    text(field(a, "from")).localeCompare(text(field(b, "from"))) ||
    text(field(a, "to")).localeCompare(text(field(b, "to"))) ||
    text(field(a, "unresolvedTo")).localeCompare(
      text(field(b, "unresolvedTo"))
    ) ||
    text(field(a, "type")).localeCompare(text(field(b, "type"))) ||
    compareLists(
      strings(field(a, "dependencyTypes")),
      strings(field(b, "dependencyTypes"))
    ) ||
    compareLists(names(field(a, "cycle")), names(field(b, "cycle"))) ||
    compareLists(names(field(a, "via")), names(field(b, "via")))
  );
}

// dependency-cruiser ranks an unknown severity -1, before "error".
const SEVERITY_RANK: ReadonlyMap<string, number> = new Map([
  ["error", 1],
  ["warn", 2],
  ["info", 3],
  ["ignore", 4],
]);

function severityRank(entry: unknown): number {
  return SEVERITY_RANK.get(text(field(field(entry, "rule"), "severity"))) ?? -1;
}

function compareLists(a: readonly string[], b: readonly string[]): number {
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    const order = a[index].localeCompare(b[index]);
    if (order !== 0) return order;
  }
  return Math.sign(a.length - b.length);
}

function field(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strings(value: unknown): readonly string[] {
  return isStringList(value) ? value : [];
}

function names(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.map((item: unknown) => text(field(item, "name")))
    : [];
}

function retype(types: readonly string[], aliased: boolean): readonly string[] {
  const local = types.filter((type) => !ALIASED_TYPES.includes(type));
  return aliased ? [...ALIASED_TYPES, ...local] : local;
}

function isAlias(specifier: string): boolean {
  return specifier.startsWith("@/");
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === "string")
  );
}
