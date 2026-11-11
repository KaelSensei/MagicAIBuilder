/**
 * Spreadsheet-safe text cells for every CSV file the app lets a player download.
 *
 * Shared kernel: the acquisition plan, the collection export, the deck shopping
 * list and the deck statistics export build their text cells here, so the
 * defence below lives in one place. Deck names, card names and tags are text a
 * player chose, and the files are opened in Excel, LibreOffice Calc or Google
 * Sheets.
 *
 * Formula injection: a spreadsheet reads a cell that starts with `=`, `+`, `-`,
 * `@`, a tab, a carriage return or a line feed (or, in some locales, the
 * full-width `＝`, `＋`, `－`, `＠`) as a formula, so a deck named
 * `=HYPERLINK("https://…","Click")` would become a live link in the downloaded
 * file. OWASP's remedy, applied here: prefix such a cell with a single quote,
 * enclose every text cell in double quotes, and double the quotes inside it.
 * Source: https://owasp.org/www-community/attacks/CSV_Injection (page last
 * changed 2026-01-29, read 2026-11-10).
 *
 * Known limits, from the same source: Excel may drop the quote when the file is
 * saved and reopened, and no escaping is safe for every program that reads
 * CSV. The prefix stays visible in the cell, so the real card "+2 Mace"
 * exports as `'+2 Mace`.
 *
 * Not responsible for: numbers the app computes (quantities, prices), which the
 * exporters write as they are, and the columns of each export.
 *
 * @module csv
 */

/**
 * First characters that make a spreadsheet evaluate a cell (the OWASP list in
 * the module header). `-` comes first so that it is not read as a range.
 */
const FORMULA_TRIGGER = /^[-=+@\t\r\n＝＋－＠]/u;

/**
 * The text a spreadsheet shows as text instead of evaluating it.
 *
 * Adds a leading single quote when `text` starts with a formula trigger and
 * returns any other text unchanged. Only the first character matters: a
 * trigger later in the text cannot start a cell of its own while the reader
 * splits on commas outside quotes (RFC 4180).
 *
 * Call it directly only from an export that quotes cells when they need it;
 * every other export uses {@link csvText}.
 */
export function neutralizeFormula(text: string): string {
  return FORMULA_TRIGGER.test(text) ? `'${text}` : text;
}

/**
 * One CSV text cell: neutralized, then enclosed in double quotes with every
 * inner double quote doubled, so commas, quotes and line breaks stay inside
 * the cell (RFC 4180, section 2, rules 5 to 7:
 * https://www.rfc-editor.org/rfc/rfc4180).
 *
 * @example
 * csvText('=1+2";=1+2'); // => `"'=1+2"";=1+2"`, OWASP's own example
 */
export function csvText(text: string): string {
  return `"${neutralizeFormula(text).replaceAll('"', '""')}"`;
}
