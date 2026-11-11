/**
 * Rewrites the paths that root configs write by hand, which are not module
 * specifiers: path and glob strings in `vitest.config.ts`, `next.config.ts`
 * and the other root scripts, dependency-cruiser's path patterns, and the
 * list items of the SonarCloud properties files. It also reads each of their
 * pattern lists, so that the plan can report a moved file that leaves or
 * joins a coverage or test list ({@link scopeChanges}).
 *
 * Module specifiers in root scripts (`import … from "./src/…"`) are not
 * handled here: they go through the specifier pass like any source
 * (`specifier-resolution.ts`). Why the scope report exists: SonarCloud's
 * coverage exclusions are path-keyed, so moving a component out of
 * `src/components/**` silently puts it in the coverage gate
 * (audit_tests_tooling §3.4, point 5). The move pull request must make that
 * choice explicitly.
 *
 * @module refactor/config-files
 */
import { generatedSection, isInRange } from "./migration-guard";
import type { Move } from "./move-map";
import { findPlainStrings, type PlainStringLiteral } from "./module-specifiers";
import {
  mapPathPattern,
  mapRegexPattern,
  matchesPattern,
} from "./path-patterns";

/** One rewritten path in a config, for the report. */
export interface PathEdit {
  readonly line: number;
  readonly before: string;
  readonly after: string;
}

/** A list of patterns in a config, as written and as rewritten for the moves. */
export interface PatternList {
  readonly file: string;
  readonly line: number;
  /** The property that holds it: `exclude`, `sonar.coverage.exclusions`. */
  readonly name: string;
  readonly before: readonly string[];
  readonly after: readonly string[];
}

/** A config's new content, its path edits, and its pattern lists. */
export interface ConfigRewrite {
  readonly content: string;
  readonly edits: readonly PathEdit[];
  readonly lists: readonly PatternList[];
}

/** A moved file that a coverage or test list stops or starts selecting. */
export interface ScopeChange {
  readonly file: string;
  readonly line: number;
  readonly list: string;
  readonly from: string;
  readonly to: string;
  readonly change: "leaves" | "joins";
}

/** The configs whose lists decide coverage or test discovery, and so get a scope report. */
export const SCOPE_FILES: ReadonlySet<string> = new Set([
  "vitest.config.ts",
  "sonar-project.properties",
  ".sonarcloud.properties",
]);

const ROOT_SCRIPT = /^[^/]+\.[cm]?[jt]sx?$/;
const ROOT_PROPERTIES = /^[^/]+\.properties$/;
// `key=value` or `key: value`, and a carriage return kept apart; a line that
// starts with `#` or `!` is a comment.
const PROPERTY = /^(\s*[^\s#!][^=:]*?\s*[=:]\s*)([^\r]*)(\r?)$/;

/** True for a root config whose hand-written paths are rewritten: a script at the repository root (`.ts`, `.mjs`, `.cjs`, …) or a `.properties` file there. */
export function isRootConfig(path: string): boolean {
  return ROOT_SCRIPT.test(path) || ROOT_PROPERTIES.test(path);
}

/**
 * Rewrites the hand-written paths of a root config ({@link isRootConfig}).
 *
 * @param path - the config's path, relative to the repository root
 * @param text - its text; for a script, already through the specifier pass
 */
export function rewriteRootConfig(
  path: string,
  text: string,
  moves: readonly Move[]
): ConfigRewrite {
  return ROOT_PROPERTIES.test(path)
    ? rewritePropertiesPaths(path, text, moves)
    : rewriteScriptPaths(path, text, moves);
}

/**
 * Each moved file whose membership of a list changes with the move. A list
 * selects a file when any of its patterns does; the file is checked at its
 * old path against the list as written, and at its new path against the
 * list as rewritten.
 */
export function scopeChanges(
  lists: readonly PatternList[],
  moved: readonly Move[]
): readonly ScopeChange[] {
  return lists.flatMap((list) =>
    moved.flatMap(({ from, to }): readonly ScopeChange[] => {
      const before = list.before.some((pattern) =>
        matchesPattern(pattern, from)
      );
      const after = list.after.some((pattern) => matchesPattern(pattern, to));
      if (before === after) return [];
      const { file, line, name } = list;
      return [
        {
          file,
          line,
          list: name,
          from,
          to,
          change: before ? "leaves" : "joins",
        },
      ];
    })
  );
}

/**
 * Every string literal of a script that names no module and holds a moved
 * path: a plain path or glob, or a dependency-cruiser pattern when it starts
 * with `^`. The migration guard's generated section is skipped, since its
 * `from` paths are old paths on purpose.
 */
function rewriteScriptPaths(
  path: string,
  text: string,
  moves: readonly Move[]
): ConfigRewrite {
  const skipped = generatedSection(text);
  const literals = findPlainStrings(path, text)
    .filter((literal) => !isInRange(skipped, literal.start))
    .map((literal) => ({
      literal,
      after: mapScriptString(moves, literal.value),
    }));
  const changed = literals.flatMap(({ literal, after }) =>
    after === undefined ? [] : [{ literal, after }]
  );
  let content = "";
  let cursor = 0;
  for (const { literal, after } of changed) {
    content +=
      text.slice(cursor, literal.start) + quoted(after, text[literal.start]);
    cursor = literal.end;
  }
  return {
    content: content + text.slice(cursor),
    edits: changed.map(({ literal, after }) => ({
      line: literal.line,
      before: literal.value,
      after,
    })),
    lists: listsOf(path, literals),
  };
}

function mapScriptString(
  moves: readonly Move[],
  value: string
): string | undefined {
  return value.startsWith("^")
    ? mapRegexPattern(moves, value)
    : mapPathPattern(moves, value);
}

/** The array literals among the strings, each with its items as written and as rewritten. */
function listsOf(
  path: string,
  literals: readonly {
    readonly literal: PlainStringLiteral;
    readonly after: string | undefined;
  }[]
): readonly PatternList[] {
  const lists = new Map<number, PatternList>();
  for (const { literal, after } of literals) {
    if (literal.list === undefined) continue;
    const { start, line, name } = literal.list;
    const list = lists.get(start) ?? {
      file: path,
      line,
      name,
      before: [],
      after: [],
    };
    lists.set(start, {
      ...list,
      before: [...list.before, literal.value],
      after: [...list.after, after ?? literal.value],
    });
  }
  return [...lists.values()];
}

/**
 * Every comma-separated item of a `.properties` value that names a moved
 * path. Comments stay as they are; a value continued on the next line with
 * `\` is not read (no config here uses one).
 */
function rewritePropertiesPaths(
  path: string,
  text: string,
  moves: readonly Move[]
): ConfigRewrite {
  const edits: PathEdit[] = [];
  const lists: PatternList[] = [];
  const content = text
    .split("\n")
    .map((line, index) => {
      const property = PROPERTY.exec(line);
      if (property === null) return line;
      const [, key, value, carriageReturn] = property;
      const items = value.split(",");
      const rewritten = items.map((item) => {
        const pattern = item.trim();
        const after =
          pattern === "" ? undefined : mapPathPattern(moves, pattern);
        if (after === undefined) return item;
        edits.push({ line: index + 1, before: pattern, after });
        return item.replace(pattern, after);
      });
      lists.push({
        file: path,
        line: index + 1,
        name: key.replace(/[=:]\s*$/, "").trim(),
        before: items.map((item) => item.trim()),
        after: rewritten.map((item) => item.trim()),
      });
      return key + rewritten.join(",") + carriageReturn;
    })
    .join("\n");
  return { content, edits, lists };
}

/** `value` as a string literal with the given quote, escaped as JavaScript requires. */
function quoted(value: string, quote: string): string {
  if (quote === '"') return JSON.stringify(value);
  const escaped = value.replace(/\\/g, "\\\\").replaceAll(quote, `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}
