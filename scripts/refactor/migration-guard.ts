/**
 * Writes the generated section of `eslint.config.mjs` that feeds the
 * migration guard: the list of temporary re-export shims, which the ESLint
 * rule in `migration-guard-rule.mjs` bans importing or mocking.
 *
 * Why a guard: while a series of move pull requests keeps a shim at an old
 * path (decision D8), a branch that predates the move can still import or
 * `vi.mock` that path. An import keeps working through the shim, but a mock
 * of the shim does not mock the moved module, so the test silently runs
 * against the real one (research_stack_practices §5.3).
 *
 * The section is the text between a line that starts with
 * `// <migration-guard>` and one that starts with `// </migration-guard>`.
 * It holds one constant, `MIGRATION_SHIMS`, built from the `"shim": true`
 * entries of the move map, in the layout Prettier prints, so that formatting
 * the config and running the codemod again agree.
 *
 * @module refactor/migration-guard
 */
import { mapMovedPath, type Move } from "./move-map";
import type { JsonRewrite } from "./path-keyed-files";

/** The file that holds the generated section, relative to the repository root. */
export const GUARD_FILE = "eslint.config.mjs";

const BEGIN = "// <migration-guard>";
const END = "// </migration-guard>";

/** Offsets of a text range: `start` included, `end` excluded. */
export interface TextRange {
  readonly start: number;
  readonly end: number;
}

/**
 * The body of the generated section, the lines between its two marker lines,
 * or `undefined` when the text has no complete section. The codemod's other
 * passes skip this range: its `from` paths are old paths on purpose.
 */
export function generatedSection(text: string): TextRange | undefined {
  const begin = findLine(text, BEGIN, 0);
  if (begin === undefined) return undefined;
  const newline = text.indexOf("\n", begin);
  if (newline === -1) return undefined;
  const end = findLine(text, END, newline + 1);
  return end === undefined ? undefined : { start: newline + 1, end };
}

/** True when `offset` lies in `range`; never when there is no range. */
export function isInRange(
  range: TextRange | undefined,
  offset: number
): boolean {
  return range !== undefined && offset >= range.start && offset < range.end;
}

/**
 * The guard file with its generated section listing every `"shim": true`
 * entry of the map, each `from` paired with its final destination (a chain
 * of moves is followed), or `undefined` when the section already says so.
 * `count` is the number of shims listed.
 *
 * @throws Error when the map marks a shim and the text has no section to list it in
 */
export function rewriteMigrationGuard(
  text: string,
  moves: readonly Move[]
): JsonRewrite | undefined {
  const shims = moves
    .filter((move) => move.shim === true)
    .map((move) => ({ from: move.from, to: mapMovedPath(moves, move.from) }));
  const section = generatedSection(text);
  if (section === undefined) {
    if (shims.length === 0) return undefined;
    throw new Error(
      `${GUARD_FILE} has no <migration-guard> section to list the shims of the move map in; restore it (scripts/refactor/README.md)`
    );
  }
  const body = renderShims(shims);
  if (text.slice(section.start, section.end) === body) return undefined;
  return {
    content: text.slice(0, section.start) + body + text.slice(section.end),
    count: shims.length,
  };
}

function renderShims(shims: readonly Move[]): string {
  if (shims.length === 0) return "const MIGRATION_SHIMS = [];\n";
  return [
    "const MIGRATION_SHIMS = [",
    ...shims.flatMap(({ from, to }) => [
      "  {",
      `    from: ${JSON.stringify(from)},`,
      `    to: ${JSON.stringify(to)},`,
      "  },",
    ]),
    "];",
    "",
  ].join("\n");
}

/** Offset of the first line at or after `from` that starts with `marker`, indentation aside. */
function findLine(
  text: string,
  marker: string,
  from: number
): number | undefined {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^[ \\t]*${escaped}`, "gm");
  pattern.lastIndex = from;
  return pattern.exec(text)?.index;
}
