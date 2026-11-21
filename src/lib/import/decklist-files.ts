/**
 * Turns the decklist files a player chooses (`.txt`, MTGO `.dek`, `.csv`) into
 * the decklist text the deck import already parses, with the problems found.
 *
 * I-62 requirements 1.1 and 1.6 (`docs/product/specs/i62-switching-from-another-site.md`):
 * files first, and the browser reads them; raw files are never uploaded or
 * stored. This module is pure (a file's name and text in, decklist text and
 * problems out), so the picker reads each file and hands the text here.
 *
 * @module import/decklist-files
 */
import { readDecklistCsv } from "./decklist-file-csv";
import { readMtgoDek } from "./decklist-file-dek";
import { unreadableLine, type DecklistLines, type UnreadableLine } from "./decklist-file-lines";

/**
 * Limits on one choice of files. `maxLines` is `MAX_LINES` in
 * `src/lib/deck/import.ts`: `parseTextDecklist` keeps the first 500 lines and
 * drops the rest, so a longer decklist is refused here instead of cut there.
 */
export const DECKLIST_FILE_LIMITS = { maxFiles: 10, maxBytes: 1_000_000, maxLines: 500 } as const;

/** How a file was read: as a text decklist, an MTGO `.dek` deck or a CSV. */
export type DecklistFileFormat = "text" | "dek" | "csv";

/** Why a choice of files was refused; the text box is left as it was. */
export type DecklistFileRefusal =
  | { readonly kind: "too-many-files"; readonly count: number }
  | { readonly kind: "file-too-large"; readonly file: string }
  | { readonly kind: "unsupported-extension"; readonly file: string }
  | { readonly kind: "not-a-dek-deck"; readonly file: string }
  | { readonly kind: "csv-unknown-columns"; readonly file: string }
  | { readonly kind: "too-many-lines"; readonly count: number };

/** A line that could not be read, with the file it came from. */
export interface DecklistFileProblem extends UnreadableLine {
  readonly file: string;
}

/** One file of a successful read: its name, how it was read, how many lines it gave. */
export interface DecklistFileSummary {
  readonly name: string;
  readonly format: DecklistFileFormat;
  readonly lineCount: number;
}

/** One file read on its own. */
export type DecklistFileRead =
  | {
      readonly ok: true;
      readonly format: DecklistFileFormat;
      readonly text: string;
      readonly lineCount: number;
      readonly problems: readonly UnreadableLine[];
    }
  | { readonly ok: false; readonly refusal: DecklistFileRefusal };

/** The files of one choice, joined in the order chosen, or why they were refused. */
export type DecklistFilesOutcome =
  | {
      readonly ok: true;
      readonly text: string;
      readonly files: readonly DecklistFileSummary[];
      readonly problems: readonly DecklistFileProblem[];
    }
  | { readonly ok: false; readonly refusals: readonly DecklistFileRefusal[] };

const FORMAT_BY_EXTENSION: ReadonlyMap<string, DecklistFileFormat> = new Map([
  ["txt", "text"],
  ["dek", "dek"],
  ["csv", "csv"],
]);
/** `parseTextDecklist`'s `99` heading, the one heading without a letter. */
const NINETY_NINE_HEADING = /^99(?: ?\(\d{1,3}\))?:?$/;
const LETTER = /\p{L}/u;

/**
 * Checks a choice of files before any is read: how many, how large, which
 * extensions. Reading a 1 GB file to refuse it would stall the page.
 *
 * @param files - each chosen file's name and size in bytes
 * @returns every refusal, empty when the choice may be read
 */
export function checkDecklistFileChoice(
  files: readonly { readonly name: string; readonly size: number }[]
): readonly DecklistFileRefusal[] {
  if (files.length > DECKLIST_FILE_LIMITS.maxFiles) return [{ kind: "too-many-files", count: files.length }];
  return files.flatMap(({ name, size }): DecklistFileRefusal[] => {
    if (formatOf(name) === null) return [{ kind: "unsupported-extension", file: name }];
    return size > DECKLIST_FILE_LIMITS.maxBytes ? [{ kind: "file-too-large", file: name }] : [];
  });
}

/**
 * Reads one file into decklist text, by its extension.
 *
 * @param name - the file's name; its extension picks the reader
 * @param text - the file's text
 * @returns the decklist text and its unreadable lines, or the refusal
 */
export function readDecklistFile(name: string, text: string): DecklistFileRead {
  const format = formatOf(name);
  if (format === null) return { ok: false, refusal: { kind: "unsupported-extension", file: name } };
  const decklist = readAs(format, normalizeText(text));
  if (decklist === null) {
    const kind = format === "dek" ? "not-a-dek-deck" : "csv-unknown-columns";
    return { ok: false, refusal: { kind, file: name } };
  }
  return {
    ok: true,
    format,
    text: decklist.lines.join("\n"),
    lineCount: decklist.lines.length,
    problems: decklist.unreadable,
  };
}

/**
 * Reads every chosen file and joins their decklists in the order chosen, so a
 * main-deck file followed by a sideboard file gives one decklist.
 *
 * @param files - each file's name and text, in the order the player chose them
 * @returns the joined text, or every refusal; a joined decklist over
 *   {@link DECKLIST_FILE_LIMITS}.maxLines lines is refused
 */
export function readDecklistFiles(
  files: readonly { readonly name: string; readonly text: string }[]
): DecklistFilesOutcome {
  const reads = files.map((file) => ({ name: file.name, read: readDecklistFile(file.name, file.text) }));
  const refusals = reads.flatMap(({ read }) => (read.ok ? [] : [read.refusal]));
  if (refusals.length > 0) return { ok: false, refusals };

  const summaries: DecklistFileSummary[] = [];
  const texts: string[] = [];
  const problems: DecklistFileProblem[] = [];
  for (const { name, read } of reads) {
    if (!read.ok) continue;
    summaries.push({ name, format: read.format, lineCount: read.lineCount });
    if (read.lineCount > 0) texts.push(read.text);
    problems.push(...read.problems.map((problem) => ({ ...problem, file: name })));
  }
  const lineCount = summaries.reduce((total, file) => total + file.lineCount, 0);
  if (lineCount > DECKLIST_FILE_LIMITS.maxLines) return { ok: false, refusals: [{ kind: "too-many-lines", count: lineCount }] };
  return { ok: true, text: texts.join("\n"), files: summaries, problems };
}

function formatOf(name: string): DecklistFileFormat | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;
  return FORMAT_BY_EXTENSION.get(name.slice(dot + 1).toLowerCase()) ?? null;
}

function readAs(format: DecklistFileFormat, text: string): DecklistLines | null {
  switch (format) {
    case "text":
      return readTextDecklist(text);
    case "dek":
      return readMtgoDek(text);
    case "csv":
      return readDecklistCsv(text);
    default: {
      const unknown: never = format;
      return unknown;
    }
  }
}

/** Drops a byte-order mark, makes every line ending `\n` and trims trailing blank lines. */
function normalizeText(text: string): string {
  return text.replace(/^﻿/, "").replaceAll(/\r\n?/g, "\n").trimEnd();
}

/**
 * A text file is kept as written, so Preview reads it exactly as pasted text.
 * A line with no letter at all (`----`, `4`) cannot name a card; it is
 * reported, and comments and the `99` heading are not.
 */
function readTextDecklist(text: string): DecklistLines {
  const lines = text === "" ? [] : text.split("\n");
  const unreadable = lines.flatMap((raw, index) =>
    isUnreadableTextLine(raw.trim()) ? [unreadableLine(index + 1, raw)] : []
  );
  return { lines, unreadable };
}

function isUnreadableTextLine(line: string): boolean {
  if (line === "" || line.startsWith("//") || line.startsWith("#")) return false;
  return !NINETY_NINE_HEADING.test(line) && !LETTER.test(line);
}
