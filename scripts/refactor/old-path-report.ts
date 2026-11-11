/**
 * Finds the old paths that prose and configs still name after the moves, for
 * the codemod's report. Nothing here rewrites: a sentence that names a path
 * may need more than a new path, so the author edits it by hand.
 *
 * A mention is any token that holds a `/` and, read as a repository path,
 * lies at or under the `from` of a move, or names a moved file without its
 * extension. Four written forms are read, and the replacement keeps the
 * form: the repository path (`src/lib/dice.ts`), the `@/` alias, the path
 * without `src/` that the docs often use (`lib/dice.ts`), and a path relative
 * to the file, as in a Markdown link.
 *
 * Which files are read: every Markdown file (`.md`, `.mdc`) except the
 * history docs, and the non-Markdown files at the repository root and under
 * `.github/`, once the codemod has rewritten them.
 *
 * @module refactor/old-path-report
 */
import { posix } from "node:path";
import { isInRange, type TextRange } from "./migration-guard";
import { isAtOrUnder, type Move } from "./move-map";
import { mapModulePath } from "./path-patterns";

/** An old path named in a file, and the text to write instead. */
export interface PathMention {
  readonly file: string;
  readonly line: number;
  /** The token as written, without trailing punctuation. */
  readonly mention: string;
  /** The new path, in the same written form as `mention`. */
  readonly replacement: string;
}

// History docs record the paths of their day, and feature branches never
// edit the changelog, the progress log or the roadmap (CLAUDE.md,
// "Documentation discipline").
const HISTORY_DOCS = ["docs/project", "docs/product/roadmap.md"] as const;
const MARKDOWN = /\.mdc?$/;
// The lockfile names packages, never a repository path, and is the largest file at the root.
const UNREPORTED_CONFIGS: ReadonlySet<string> = new Set(["pnpm-lock.yaml"]);

const TOKEN = /[\w@.[\]/-]*\/[\w@.[\]/-]*/g;
const SRC = "src/";
const ALIAS = "@/";

/** True for a Markdown file whose old-path mentions the report lists. */
export function isReportedDoc(path: string): boolean {
  return (
    MARKDOWN.test(path) &&
    !HISTORY_DOCS.some((history) => isAtOrUnder(path, history))
  );
}

/** True for a config whose old-path mentions the report lists: a non-Markdown file at the root or under `.github/`. */
export function isReportedConfig(path: string): boolean {
  return (
    !MARKDOWN.test(path) &&
    !UNREPORTED_CONFIGS.has(path) &&
    (!path.includes("/") || isAtOrUnder(path, ".github"))
  );
}

/**
 * Lists the old paths that `text`, the content of `file`, names, in reading
 * order, each token once per line.
 *
 * @param skipped - a range whose mentions are left out, such as the migration guard's generated section
 */
export function findOldPathMentions(
  file: string,
  text: string,
  moves: readonly Move[],
  skipped?: TextRange
): readonly PathMention[] {
  const mentions: PathMention[] = [];
  let lineStart = 0;
  for (const [index, line] of text.split("\n").entries()) {
    const seen = new Set<string>();
    for (const match of line.matchAll(TOKEN)) {
      if (isInRange(skipped, lineStart + match.index)) continue;
      const mention = trimToken(match[0]);
      if (mention === "" || seen.has(mention)) continue;
      const replacement = replacementFor(file, mention, moves);
      if (replacement === undefined) continue;
      seen.add(mention);
      mentions.push({ file, line: index + 1, mention, replacement });
    }
    lineStart += line.length + 1;
  }
  return mentions;
}

/** A written form of a path: how to read it as a repository path, and how to write a repository path back in it. */
interface WrittenForm {
  readonly read: (mention: string, file: string) => string | undefined;
  readonly write: (path: string, file: string) => string;
}

// Tried in this order; the first form that reads a moved path wins.
const FORMS: readonly WrittenForm[] = [
  // `@/lib/dice`
  {
    read: (mention) =>
      mention.startsWith(ALIAS) ? SRC + mention.slice(ALIAS.length) : undefined,
    write: (path) =>
      path.startsWith(SRC) ? ALIAS + path.slice(SRC.length) : path,
  },
  // `../../src/lib/dice.ts`, relative to the file that names it
  {
    read: (mention, file) => {
      if (!mention.startsWith("./") && !mention.startsWith("../"))
        return undefined;
      const path = posix.join(posix.dirname(file), mention);
      return path.startsWith("../") ? undefined : path;
    },
    write: (path, file) => {
      const relative = posix.relative(posix.dirname(file), path);
      return relative.startsWith("../") ? relative : `./${relative}`;
    },
  },
  // `src/lib/dice.ts`
  { read: (mention) => mention, write: (path) => path },
  // `lib/dice.ts`, as the docs often shorten it
  {
    read: (mention) =>
      /^(?:src\/|@\/|\.|\/)/.test(mention) ? undefined : SRC + mention,
    write: (path) => (path.startsWith(SRC) ? path.slice(SRC.length) : path),
  },
];

function replacementFor(
  file: string,
  mention: string,
  moves: readonly Move[]
): string | undefined {
  for (const form of FORMS) {
    const path = form.read(mention, file);
    if (path === undefined) continue;
    const moved = mapModulePath(moves, path);
    if (moved !== undefined) return form.write(moved, file);
  }
  return undefined;
}

/** The token without what surrounds a path in prose: a Markdown link's `[…]` and a sentence's final dot. */
function trimToken(token: string): string {
  const unbracketed = token.startsWith("[")
    ? token.slice(1).replace(/[\].]+$/, "")
    : token;
  return unbracketed.replace(/[./]+$/, "");
}
