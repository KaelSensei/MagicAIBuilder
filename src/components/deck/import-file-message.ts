/**
 * Words the outcome of reading decklist files for the import dialog's status
 * line, in the player's language (`deck.import.file` messages).
 *
 * The file content quoted in a message (an unreadable line) is plain text:
 * React renders the status line as text, never as HTML.
 *
 * @module components/deck/import-file-message
 */
import type { useTranslations } from "next-intl";
import {
  DECKLIST_FILE_LIMITS,
  type DecklistFileProblem,
  type DecklistFileRefusal,
  type DecklistFilesOutcome,
} from "@/lib/import/decklist-files";

/** Translator scoped to `deck.import.file`. */
type FileMessages = ReturnType<typeof useTranslations>;

/** What the dialog does with a choice of files. */
export type ImportFileResult =
  /** The files were read: `text` replaces the text box. */
  | { readonly kind: "read"; readonly text: string; readonly message: string }
  /** Nothing was read; the text box keeps what it held. */
  | { readonly kind: "refused"; readonly message: string };

const BYTES_PER_MB = 1_000_000;

/**
 * The status line for a choice of files that was read, or refused.
 *
 * @param t - translator scoped to `deck.import.file`
 * @param outcome - the joined read of every chosen file
 * @param replacing - whether the text box held text the files replace
 */
export function describeFileOutcome(
  t: FileMessages,
  outcome: DecklistFilesOutcome,
  replacing: boolean
): ImportFileResult {
  if (!outcome.ok) return describeRefusals(t, outcome.refusals);
  const sentences = outcome.files.map((file) =>
    t("read", { name: file.name, format: file.format, count: file.lineCount })
  );
  if (replacing) sentences.push(t("replaced"));
  if (outcome.problems.length > 0) sentences.push(describeProblems(t, outcome.problems));
  return { kind: "read", text: outcome.text, message: sentences.join(" ") };
}

/**
 * The status line for files refused before or while being read.
 *
 * @param t - translator scoped to `deck.import.file`
 * @param refusals - every reason, at least one
 */
export function describeRefusals(t: FileMessages, refusals: readonly DecklistFileRefusal[]): ImportFileResult {
  const sentences = refusals.map((refusal) => refusalSentence(t, refusal));
  return { kind: "refused", message: [...sentences, t("unchanged")].join(" ") };
}

function describeProblems(t: FileMessages, problems: readonly DecklistFileProblem[]): string {
  const lines = problems.map((problem) =>
    t("unreadableLine", { file: problem.file, line: problem.line, content: problem.content })
  );
  return t("unreadable", { count: problems.length, lines: lines.join("; ") });
}

function refusalSentence(t: FileMessages, refusal: DecklistFileRefusal): string {
  switch (refusal.kind) {
    case "too-many-files":
      return t("tooManyFiles", { count: refusal.count, limit: DECKLIST_FILE_LIMITS.maxFiles });
    case "file-too-large":
      return t("tooLarge", { name: refusal.file, limit: DECKLIST_FILE_LIMITS.maxBytes / BYTES_PER_MB });
    case "unsupported-extension":
      return t("unsupported", { name: refusal.file });
    case "not-a-dek-deck":
      return t("notDek", { name: refusal.file });
    case "csv-unknown-columns":
      return t("csvColumns", { name: refusal.file });
    case "too-many-lines":
      return t("tooManyLines", { count: refusal.count, limit: DECKLIST_FILE_LIMITS.maxLines });
    default: {
      const unknown: never = refusal;
      return unknown;
    }
  }
}
