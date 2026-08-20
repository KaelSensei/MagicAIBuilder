/**
 * MTGTop8 tournament search — parsing only, no I/O.
 *
 * MTGTop8's EDH section is organised by **commander archetype**: every
 * commander has a numeric id listed in the search form's
 * `archetype_sel[EDH]` select. Searching by that id returns decks *led* by
 * the commander; the `cards=` field instead returns every deck that merely
 * *contains* the card, which for a popular commander is mostly other
 * people's 99. The id is therefore preferred, with `cards=` as the fallback
 * for a commander MTGTop8 has not given an archetype yet.
 *
 * Result rows carry the context the meta panel wants to show: player, event,
 * date, placement, and the event's size as one to four stars. MTGTop8's "EDH"
 * is overwhelmingly **Duel Commander** (1v1), so the format label is kept and
 * shown rather than assumed.
 *
 * The site serves ISO-8859-1, not UTF-8 — see `decodeLatin1`.
 *
 * @module meta/mtgtop8
 */

import type { TournamentDeck } from "./fetch";

export const MTGTOP8_SEARCH_URL = "https://www.mtgtop8.com/search";

/** Decodes a response body MTGTop8 serves as ISO-8859-1. */
export function decodeLatin1(buffer: ArrayBuffer): string {
  return new TextDecoder("iso-8859-1").decode(buffer);
}

/** Strips tags and collapses whitespace in a cell's inner HTML. */
function cellText(html: string): string {
  return html
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/** Lower-cases and drops punctuation so a slug-shaped name still matches. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Reads the commander → archetype id map from the search form.
 *
 * @param html - the GET /search page
 * @returns ids keyed by lower-cased commander name; empty when the EDH
 *   select is missing, which reads as "no archetype" downstream
 */
export function parseArchetypeOptions(html: string): ReadonlyMap<string, number> {
  const select = /name=archetype_sel\[EDH\]>([\s\S]*?)<\/select>/.exec(html);
  const options = new Map<string, number>();
  if (!select) return options;
  const optionRe = /<option value=(\d+)\s*>([^<]+)<\/option>/g;
  let match: RegExpExecArray | null;
  while ((match = optionRe.exec(select[1])) !== null) {
    options.set(match[2].trim().toLowerCase(), Number(match[1]));
  }
  return options;
}

/**
 * Finds a commander's archetype id, tolerating the punctuation loss of a
 * slug round-trip ("atraxa praetors voice" → Atraxa, Praetors' Voice).
 *
 * @param options - from {@link parseArchetypeOptions}
 * @param commanderName - display name or slug-derived words
 * @returns the id, or null when MTGTop8 lists no such commander
 */
export function findArchetypeId(
  options: ReadonlyMap<string, number>,
  commanderName: string
): number | null {
  const exact = options.get(commanderName.toLowerCase());
  if (exact !== undefined) return exact;
  const wanted = normalizeName(commanderName);
  for (const [name, id] of options) {
    if (normalizeName(name) === wanted) return id;
  }
  return null;
}

/**
 * Converts MTGTop8's `dd/mm/yy` into an ISO date.
 *
 * @returns `yyyy-mm-dd`, or undefined when the cell is not a date
 */
export function parseTop8Date(raw: string): string | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(raw.trim());
  if (!m) return undefined;
  return `20${m[3]}-${m[2]}-${m[1]}`;
}

const ROW_RE = /<tr class=hover_tr>([\s\S]*?)<\/tr>/g;
const CELL_RE = /<td[^>]*>([\s\S]*?)<\/td>/g;
const DECK_LINK_RE = /href=(event\?e=\d+&d=\d+&f=EDH)>([^<]+)</;

/**
 * Parses the result rows of a POST /search response.
 *
 * Cells are positional: checkbox, deck, player, format, event, stars,
 * placement, date. A row with a different shape is skipped rather than
 * guessed at.
 *
 * @param html - the search response body, already decoded
 * @returns decks in page order
 */
export function parseSearchResults(html: string): TournamentDeck[] {
  const decks: TournamentDeck[] = [];
  let row: RegExpExecArray | null;
  while ((row = ROW_RE.exec(html)) !== null) {
    const cells = [...row[1].matchAll(CELL_RE)].map((c) => c[1]);
    if (cells.length < 8) continue;
    const link = DECK_LINK_RE.exec(cells[1]);
    if (!link) continue;
    decks.push({
      name: link[2].trim(),
      player: cellText(cells[2]) || undefined,
      format: cellText(cells[3]) || undefined,
      event: cellText(cells[4]) || undefined,
      eventLevel: (cells[5].match(/star\.png/g) ?? []).length || undefined,
      placement: cellText(cells[6]) || undefined,
      date: parseTop8Date(cellText(cells[7])),
      url: `https://www.mtgtop8.com/${link[1]}`,
      source: "mtgtop8",
    });
  }
  return decks;
}

export interface SearchBodyInput {
  readonly archetypeId: number | null;
  readonly commanderName: string;
}

/**
 * Builds the form body for POST /search.
 *
 * @param input - the archetype id when known, else the name for a content search
 */
export function buildSearchBody({ archetypeId, commanderName }: SearchBodyInput): URLSearchParams {
  const body = new URLSearchParams({ format: "EDH", current_page: "" });
  if (archetypeId === null) body.set("cards", commanderName);
  else body.set("archetype_sel[EDH]", String(archetypeId));
  return body;
}
