/**
 * What every decklist file reader hands back: the decklist lines it made, and
 * the lines it could not read.
 *
 * I-62 3.3 (`docs/product/specs/i62-switching-from-another-site.md`) says a
 * line the import cannot read is shown to the player, never dropped, so each
 * reader reports such a line with its line number in the file.
 *
 * @module import/decklist-file-lines
 */

/** Longest excerpt of an unreadable line kept for the player to recognise it. */
const EXCERPT_LENGTH = 60;

/** A line of a decklist file that no card line could be made from. */
export interface UnreadableLine {
  /** 1-based line number in the file, where the element or record starts. */
  readonly line: number;
  /** The start of the line as the file wrote it, without control characters. */
  readonly content: string;
}

/** The decklist a file reader made, in the text the deck import parses. */
export interface DecklistLines {
  readonly lines: readonly string[];
  readonly unreadable: readonly UnreadableLine[];
}

/** Section headings `parseTextDecklist` reads (`src/lib/deck/import.ts`). */
export type DecklistHeading = "Commander" | "Deck" | "Sideboard" | "Maybeboard";

/**
 * An unreadable line, cut to a short excerpt with control characters removed.
 *
 * @param line - 1-based line number in the file
 * @param content - the raw text of the line, element or record
 */
export function unreadableLine(line: number, content: string): UnreadableLine {
  return { line, content: withoutControls(content).trim().slice(0, EXCERPT_LENGTH) };
}

/**
 * A card name from a structured file, made safe to put on one decklist line:
 * control characters (a newline would start a new line) become spaces, and
 * runs of spaces collapse to one.
 *
 * @param raw - the name as the file wrote it, already unescaped
 * @returns the cleaned name, empty when nothing printable is left
 */
export function cardNameForLine(raw: string): string {
  return withoutControls(raw).split(" ").filter(Boolean).join(" ");
}

/**
 * The lines of one section: its heading, then its cards. A section without
 * cards gives no lines, so an empty sideboard adds no heading.
 *
 * @param heading - the heading the parser reads for the section
 * @param cardLines - `"<quantity> <name>"` lines
 */
export function sectionLines(heading: DecklistHeading, cardLines: readonly string[]): readonly string[] {
  return cardLines.length === 0 ? [] : [heading, ...cardLines];
}

function withoutControls(text: string): string {
  return text.replaceAll(/[\p{Cc}\p{Cf}]/gu, " ");
}
