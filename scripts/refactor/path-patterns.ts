/**
 * Maps the paths that configs and docs write by hand through the move map:
 * plain paths, module paths without their extension, globs, and the anchored
 * regular expressions of dependency-cruiser. Also matches a glob the way the
 * coverage and test configs read it, for the scope report.
 *
 * Pure: nothing here reads the file system. `config-files.ts` and
 * `old-path-report.ts` build on it.
 *
 * @module refactor/path-patterns
 */
import { isAtOrUnder, mapMovedPath, type Move } from "./move-map";

// `[` and `]` are left out: Next.js route folders such as `[locale]` use
// them as plain characters, and no config here uses a glob character class.
const GLOB_CHARACTER = /[*?{]/;

// The suffixes a module path written without its extension may stand for,
// close to the order of TypeScript's "bundler" resolution.
const MODULE_SUFFIXES = [
  ".ts",
  ".tsx",
  ".d.ts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  "/index.ts",
  "/index.tsx",
  "/index.js",
] as const;

const CODE_EXTENSION = /(?:\.d)?\.[cm]?[jt]sx?$/;

// `^`, then a run of path characters: word characters, `@`, `-`, `/`, and
// the escapes `\.`, `\-`, `\/`, `\[`, `\]`, `\(`, `\)`.
const REGEX_HEAD = /^\^((?:[\w@-]|\/|\\[./\-[\]()])+)/;
const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g;

/**
 * Where `path` ends up after the moves, or `undefined` when no move covers
 * it. Besides a path at or under a moved `from`, it maps a module path
 * written without its extension or `/index` (`src/lib/dice` for a moved
 * `src/lib/dice.ts`), and keeps that form in the result.
 */
export function mapModulePath(
  moves: readonly Move[],
  path: string
): string | undefined {
  const moved = mapMovedPath(moves, path);
  if (moved !== path) return moved;
  for (const suffix of MODULE_SUFFIXES) {
    const file = path + suffix;
    const movedFile = mapMovedPath(moves, file);
    if (movedFile === file) continue;
    return movedFile.endsWith(suffix)
      ? movedFile.slice(0, -suffix.length)
      : movedFile.replace(CODE_EXTENSION, "");
  }
  return undefined;
}

/**
 * A path or glob rewritten for the moves, or `undefined` when no move
 * changes it. A leading `./` is kept.
 *
 * Only the pattern's literal head, the segments before the first one that
 * holds a glob character, is mapped: `src/lib/combos/**` follows a move of
 * `src/lib/combos`, and `src/lib/deck/types.ts` follows that file. A head
 * that merely contains a moved file (`src/components/**` when one component
 * moves out) is left alone, since no rewrite keeps it selecting the same
 * files; {@link matchesPattern} lets the plan report that change instead.
 */
export function mapPathPattern(
  moves: readonly Move[],
  pattern: string
): string | undefined {
  const dotSlash = pattern.startsWith("./") ? "./" : "";
  const segments = pattern.slice(dotSlash.length).split("/");
  const globAt = segments.findIndex((segment) => GLOB_CHARACTER.test(segment));
  const headLength = globAt === -1 ? segments.length : globAt;
  if (headLength === 0) return undefined;
  const head = segments.slice(0, headLength).join("/");
  const moved =
    globAt === -1 ? mapModulePath(moves, head) : mapFolder(moves, head);
  if (moved === undefined) return undefined;
  return dotSlash + [moved, ...segments.slice(headLength)].join("/");
}

/**
 * A dependency-cruiser path pattern, a regular expression over repository
 * paths, rewritten for the moves, or `undefined`.
 *
 * Two forms name a path, and only they are rewritten: `^<file>$` selects one
 * file, and `^<folder>/…` everything under a folder (whatever follows the
 * slash is kept). Any other pattern is left alone; the plan's report of old
 * paths left in configs lists what it still names.
 */
export function mapRegexPattern(
  moves: readonly Move[],
  pattern: string
): string | undefined {
  const head = REGEX_HEAD.exec(pattern);
  if (head === null) return undefined;
  const rest = pattern.slice(1 + head[1].length);
  const path = head[1].replace(/\\(.)/g, "$1");
  let moved: string | undefined;
  if (rest === "$") {
    moved = mapModulePath(moves, path);
  } else if (path.endsWith("/")) {
    const folder = mapFolder(moves, path.slice(0, -1));
    moved = folder === undefined ? undefined : `${folder}/`;
  }
  return moved === undefined
    ? undefined
    : `^${moved.replace(REGEX_SPECIAL, "\\$&")}${rest}`;
}

/**
 * True when the pattern selects `path`, read the way Vitest and SonarCloud
 * read their lists: `**` spans folders, `*` and `?` stay within one, `{a,b}`
 * is a choice, and a pattern without a glob character selects that path and
 * everything under it (as `sonar.sources=src` does). A leading `./` is
 * ignored.
 */
export function matchesPattern(pattern: string, path: string): boolean {
  const body = pattern.startsWith("./") ? pattern.slice(2) : pattern;
  if (!GLOB_CHARACTER.test(body)) return isAtOrUnder(path, body);
  return globToRegExp(body).test(path);
}

function mapFolder(moves: readonly Move[], folder: string): string | undefined {
  const moved = mapMovedPath(moves, folder);
  return moved === folder ? undefined : moved;
}

// Tried in order at each position; the last one takes any single character.
const GLOB_TOKENS: readonly (readonly [RegExp, (token: string) => string])[] = [
  [/^\*\*\//, () => "(?:.*/)?"],
  [/^\/\*\*$/, () => "(?:/.*)?"],
  [/^\*\*/, () => ".*"],
  [/^\*/, () => "[^/]*"],
  [/^\?/, () => "[^/]"],
  [
    /^\{[^{}]*\}/,
    (token) =>
      `(?:${token.slice(1, -1).split(",").map(escapeRegex).join("|")})`,
  ],
  [/^[\s\S]/, escapeRegex],
];

function globToRegExp(glob: string): RegExp {
  let source = "";
  let rest = glob;
  while (rest !== "") {
    for (const [token, translate] of GLOB_TOKENS) {
      const match = token.exec(rest);
      if (match === null) continue;
      source += translate(match[0]);
      rest = rest.slice(match[0].length);
      break;
    }
  }
  return new RegExp(`^${source}$`);
}

function escapeRegex(text: string): string {
  return text.replace(REGEX_SPECIAL, "\\$&");
}
