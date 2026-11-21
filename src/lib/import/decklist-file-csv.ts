/**
 * Reads a decklist `.csv` file into decklist lines.
 *
 * The first record is a header. Its columns are matched without regard to case
 * or surrounding spaces: a quantity column, a name column, and an optional zone
 * column whose `Commander`, `Sideboard`, `Maybeboard` or `Considering` values
 * map to the headings `parseTextDecklist` reads; any other zone value means the
 * main deck. Other columns (Moxfield's `Edition`, `Foil`, `Tags`…) are ignored:
 * set codes, foil marks and tags are not kept as data yet (I-62 slice 1).
 *
 * Fields follow RFC 4180 (https://www.rfc-editor.org/rfc/rfc4180, read
 * 2026-11-21): a quoted field may hold commas, line breaks and `""` for one
 * quote, so `"Jace, the Mind Sculptor"` stays one name. The scan is a single
 * linear pass, so a hostile file cannot stall the page.
 *
 * @module import/decklist-file-csv
 */
import {
  cardNameForLine,
  sectionLines,
  unreadableLine,
  type DecklistHeading,
  type DecklistLines,
  type UnreadableLine,
} from "./decklist-file-lines";

/** The header names each column may carry, lower-cased. */
export const CSV_COLUMNS = {
  quantity: ["count", "quantity", "qty", "amount"],
  name: ["name", "card name"],
  zone: ["board", "section"],
} as const;

const ZONE_HEADINGS: ReadonlyMap<string, DecklistHeading> = new Map([
  ["commander", "Commander"],
  ["sideboard", "Sideboard"],
  ["maybeboard", "Maybeboard"],
  ["considering", "Maybeboard"],
]);
/** Section order of the decklist the reader writes. */
const HEADING_ORDER: readonly DecklistHeading[] = ["Commander", "Deck", "Sideboard", "Maybeboard"];
const QUANTITY = /^\d{1,4}$/;

/** One CSV record and the 1-based file line it starts on. */
interface CsvRecord {
  readonly line: number;
  readonly fields: readonly string[];
}

interface ColumnIndexes {
  readonly quantity: number;
  readonly name: number;
  readonly zone: number;
}

/**
 * The decklist of a `.csv` file, or `null` when its header names no
 * quantity column or no name column ({@link CSV_COLUMNS}).
 *
 * @param text - the file's text, line endings already `\n`
 * @returns one section per zone, in Commander, Deck, Sideboard, Maybeboard
 *   order; a row without a name or a positive whole quantity is unreadable
 */
export function readDecklistCsv(text: string): DecklistLines | null {
  const [header, ...rows] = parseCsvRecords(text);
  const columns = header === undefined ? null : columnIndexes(header.fields);
  if (columns === null) return null;

  const sections = new Map<DecklistHeading, string[]>(HEADING_ORDER.map((heading) => [heading, []]));
  const unreadable: UnreadableLine[] = [];
  for (const row of rows) {
    const cardLine = cardLineOf(row, columns);
    if (cardLine === null) {
      unreadable.push(unreadableLine(row.line, row.fields.join(",")));
    } else {
      sections.get(zoneHeading(row, columns))?.push(cardLine);
    }
  }
  return {
    lines: HEADING_ORDER.flatMap((heading) => sectionLines(heading, sections.get(heading) ?? [])),
    unreadable,
  };
}

function columnIndexes(header: readonly string[]): ColumnIndexes | null {
  const names = header.map((column) => column.trim().toLowerCase());
  const indexOfAny = (accepted: readonly string[]) => names.findIndex((column) => accepted.includes(column));
  const quantity = indexOfAny(CSV_COLUMNS.quantity);
  const name = indexOfAny(CSV_COLUMNS.name);
  if (quantity < 0 || name < 0) return null;
  return { quantity, name, zone: indexOfAny(CSV_COLUMNS.zone) };
}

function cardLineOf(row: CsvRecord, columns: ColumnIndexes): string | null {
  const quantity = (row.fields[columns.quantity] ?? "").trim();
  const name = cardNameForLine(row.fields[columns.name] ?? "");
  if (!QUANTITY.test(quantity) || Number(quantity) === 0 || name === "") return null;
  return `${Number(quantity)} ${name}`;
}

function zoneHeading(row: CsvRecord, columns: ColumnIndexes): DecklistHeading {
  const zone = (row.fields[columns.zone] ?? "").trim().toLowerCase();
  return ZONE_HEADINGS.get(zone) ?? "Deck";
}

/** Scanner state while the records are read. */
interface CsvScan {
  readonly records: CsvRecord[];
  fields: string[];
  field: string;
  quoted: boolean;
  line: number;
  recordLine: number;
}

/**
 * Splits CSV text into records (RFC 4180), dropping blank records.
 *
 * @param text - CSV text with `\n` line endings
 */
function parseCsvRecords(text: string): readonly CsvRecord[] {
  const scan: CsvScan = { records: [], fields: [], field: "", quoted: false, line: 1, recordLine: 1 };
  for (let index = 0; index < text.length; index++) {
    const char = text.charAt(index);
    if (scan.quoted) {
      index += readQuotedChar(scan, char, text.charAt(index + 1));
    } else {
      readPlainChar(scan, char);
    }
  }
  endRecord(scan);
  return scan.records;
}

/** @returns how many extra characters were consumed (1 for an escaped `""`) */
function readQuotedChar(scan: CsvScan, char: string, next: string): number {
  if (char !== '"') {
    if (char === "\n") scan.line++;
    scan.field += char;
    return 0;
  }
  if (next === '"') {
    scan.field += '"';
    return 1;
  }
  scan.quoted = false;
  return 0;
}

function readPlainChar(scan: CsvScan, char: string): void {
  if (char === '"' && scan.field === "") {
    scan.quoted = true;
  } else if (char === ",") {
    scan.fields.push(scan.field);
    scan.field = "";
  } else if (char === "\n") {
    endRecord(scan);
    scan.line++;
    scan.recordLine = scan.line;
  } else {
    scan.field += char;
  }
}

function endRecord(scan: CsvScan): void {
  const fields = [...scan.fields, scan.field];
  scan.fields = [];
  scan.field = "";
  if (fields.some((field) => field.trim() !== "")) scan.records.push({ line: scan.recordLine, fields });
}
