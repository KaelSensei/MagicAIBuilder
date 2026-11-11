/**
 * The move map: the ordered list of file and folder moves that the move
 * codemod applies, and the path arithmetic built on it.
 *
 * The map lives in `scripts/refactor/moves.json` and only grows: each move
 * pull request appends its entries, and any branch can re-run the codemod
 * after a rebase (ADR 0001, "migration approach" in
 * docs/engineering/architecture.md). Every rule below exists to keep a second
 * run a no-op, so that re-running is always safe.
 *
 * @module refactor/move-map
 */
import { posix } from "node:path";
import { z } from "zod";

/** One move: a file or a folder, both paths POSIX and relative to the repository root. */
export interface Move {
  readonly from: string;
  readonly to: string;
}

/** The outcome of reading a move map: the moves in order, or every problem found. */
export type MoveMapResult =
  | { readonly ok: true; readonly moves: readonly Move[] }
  | { readonly ok: false; readonly errors: readonly string[] };

const moveMapSchema = z.array(
  z.strictObject({ from: z.string(), to: z.string() })
);

/**
 * Checks a parsed `moves.json` and returns its moves, or the list of problems.
 *
 * Besides the shape, it rejects any map a second run would not leave alone:
 * - a path that is not POSIX, relative and normalised (no `/` at either end,
 *   no `.` or `..` segment, no backslash);
 * - a move onto itself or into its own folder;
 * - a destination that overlaps, as the same path or as a parent or child
 *   folder, the source of the same or an earlier move. The earlier move would
 *   take the new file away again on the next run. A later move may take an
 *   earlier destination further: that is a chain, and {@link mapMovedPath}
 *   follows it.
 */
export function parseMoveMap(json: unknown): MoveMapResult {
  const parsed = moveMapSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `moves${formatIssuePath(issue.path)}: ${issue.message}`
      ),
    };
  }
  const moves = parsed.data;
  const errors = moves.flatMap((move, index) => [
    ...pathErrors(move, index),
    ...overlapErrors(moves, index),
  ]);
  return errors.length === 0 ? { ok: true, moves } : { ok: false, errors };
}

/**
 * Where `path` ends up once every move has run, in map order. A path inside a
 * moved folder follows the folder; a path no move covers is returned as is.
 */
export function mapMovedPath(moves: readonly Move[], path: string): string {
  return moves.reduce(
    (current, move) =>
      isAtOrUnder(current, move.from)
        ? move.to + current.slice(move.from.length)
        : current,
    path
  );
}

/**
 * The path a file had before any move: {@link mapMovedPath} run backwards.
 * Used to read the relative specifiers of a file that was moved without the
 * codemod, which still point from its old folder.
 */
export function originalPathOf(moves: readonly Move[], path: string): string {
  return moves.reduceRight(
    (current, move) =>
      isAtOrUnder(current, move.to)
        ? move.from + current.slice(move.to.length)
        : current,
    path
  );
}

/** True when `path` is `folder` itself or lies inside it. `src/lib/dicey.ts` is not under `src/lib/dice`. */
export function isAtOrUnder(path: string, folder: string): boolean {
  return path === folder || path.startsWith(`${folder}/`);
}

function overlaps(a: string, b: string): boolean {
  return isAtOrUnder(a, b) || isAtOrUnder(b, a);
}

function pathErrors(move: Move, index: number): readonly string[] {
  return (["from", "to"] as const).flatMap((key) =>
    isRepoPath(move[key])
      ? []
      : [
          `moves[${index}]: "${key}" (${move[key]}) must be a normalised POSIX path relative to the repository root`,
        ]
  );
}

function overlapErrors(
  moves: readonly Move[],
  index: number
): readonly string[] {
  const { to } = moves[index];
  return moves.slice(0, index + 1).flatMap((earlier, earlierIndex) => {
    if (!overlaps(to, earlier.from)) return [];
    return earlierIndex === index
      ? [
          `moves[${index}]: "to" (${to}) overlaps its own "from"; a second run would move it again`,
        ]
      : [
          `moves[${index}]: "to" (${to}) overlaps the "from" of moves[${earlierIndex}] (${earlier.from}); a second run would move it again`,
        ];
  });
}

function isRepoPath(path: string): boolean {
  return (
    path !== "" &&
    !path.includes("\\") &&
    !path.startsWith("/") &&
    !path.endsWith("/") &&
    path.split("/").every((segment) => segment !== "." && segment !== "..") &&
    posix.normalize(path) === path
  );
}

function formatIssuePath(path: readonly PropertyKey[]): string {
  return path
    .map((key) => (typeof key === "number" ? `[${key}]` : `.${String(key)}`))
    .join("");
}
